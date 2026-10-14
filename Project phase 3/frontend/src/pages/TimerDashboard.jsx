// frontend/src/pages/TimerDashboard.jsx
// Updated by Sarah Kayembe

import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

// --- COMPONENTS -----
import "../styles/focusDen.css";
import RoomScene from "../components/Dashboard/RoomScene";
import TopBar from "../components/Dashboard/TopBar";
import LeftSidebar from "../components/Dashboard/LeftSidebar";
import QuickMenu from "../components/Dashboard/QuickMenu";
import SessionCard from "../components/Dashboard/SessionCard";
import { LevelUpCelebration, SessionRewardToast } from "../components/Dashboard/RewardCelebration";

// --- WINDOWS -----
import TimerWindow from "../components/Dashboard/Windows/TimerWindow";
import TaskWindow from "../components/Dashboard/Windows/TaskWindow";
import MoodWindow from "../components/Dashboard/Windows/MoodWindow";
import ShopWindow from "../components/Dashboard/Windows/ShopWindow";
import CalendarWindow from "../components/Dashboard/Windows/CalendarWindow";
import StudyVilleWindow from "../components/Dashboard/Windows/StudyVilleWindow";
import LeaderboardWindow from "../components/Dashboard/Windows/LeaderboardWindow";
import StatsWindow from "../components/Dashboard/Windows/StatsWindow";
import GiveUpDialog from "../components/Dashboard/Windows/GiveUpDialog";
import FlowtimeDialog from "../components/Dashboard/Windows/FlowtimeDialog";
import BreakDialog from "../components/Dashboard/Windows/BreakDialog";
import ProfileWindow from "../components/Dashboard/Windows/ProfileWindow";

//----- SOUND (timer sounds) -----
import { AMBIENCE_THEMES, playChime, startAmbience } from "../utils/focusSounds";


// API Configuration
import { API_BASE } from "../api/base";
import Icon from "../components/Dashboard/Icon";

const API_BASE_URL = `${API_BASE}/api/focus`;




export default function TimerDashboard() {
  // General UI State
  const [currentMode, setCurrentMode] = useState("focus");
  const [uiVisible, setUiVisible] = useState(true);
  const [activeWindow, setActiveWindow] = useState(null);
  // Item to start placing when StudyVille opens from the Rewards window
  const [itemToPlace, setItemToPlace] = useState(null);

  // Dashboard Data
  const [tasks, setTasks] = useState([]);
  // Level, XP, coins and streak from the backend (see /api/focus/dashboard)
  const [progress, setProgress] = useState(null);
  const [sessionReward, setSessionReward] = useState(null);
  const [levelUp, setLevelUp] = useState(null);

  // User account data (used for top bar and profile picture)
  const [user, setUser] = useState(null);


  // Timer State
  const [timerMode, setTimerMode] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [originalFocusSeconds, setOriginalFocusSeconds] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0);
  const [breakTotalSeconds, setBreakTotalSeconds] = useState(0);
  const [flowSeconds, setFlowSeconds] = useState(0);

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);

  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Dialog State
  const [showBreakDialog, setShowBreakDialog] = useState(null);
  const [showFlowDialog, setShowFlowDialog] = useState(null);
  const [showGiveUpDialog, setShowGiveUpDialog] = useState(false);
  const [flowtimeTooShort, setFlowtimeTooShort] = useState(false);

  // Sound state
  const [soundMuted, setSoundMuted] = useState(() => {
    try {
      return localStorage.getItem("sb_sound_muted") === "true";
    } catch {
      return false;
    }
  });

  const [soundTheme, setSoundTheme] = useState(() => {
    try {
      return localStorage.getItem("sb_sound_theme") || "forest";
    } catch {
      return "forest";
    }
  });

  const [showSoundSettings, setShowSoundSettings] = useState(false);




  // Profile window
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileWindow, setShowProfileWindow] = useState(false);



  // Fetch logged-in user account data
  useEffect(() => {
    fetch(`${API_BASE}/user/account`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser(data);
        }
      })
      .catch(() => {});
  }, []);

  // Chimes are generated in the browser (see utils/focusSounds).
  const playStartSound = useCallback(() => {
    if (!soundMuted) playChime("start");
  }, [soundMuted]);
  const playBreakSound = useCallback(() => {
    if (!soundMuted) playChime("break");
  }, [soundMuted]);
  const playFinishSound = useCallback(() => {
    if (!soundMuted) playChime("finish");
  }, [soundMuted]);

  // Persist sound settings
  useEffect(() => {
    localStorage.setItem("sb_sound_muted", soundMuted ? "true" : "false");
  }, [soundMuted]);

  useEffect(() => {
    localStorage.setItem("sb_sound_theme", soundTheme);
  }, [soundTheme]);

  // Ambient background sound, generated in the browser
  useEffect(() => {
    if (soundMuted) return undefined;
    return startAmbience(soundTheme);
  }, [soundTheme, soundMuted]);

  // Reset timer state
  const resetTimerState = useCallback(() => {
    setTimerMode(null);
    setIsTimerRunning(false);
    setIsBreak(false);
    setFlowSeconds(0);
    setTimeLeft(25 * 60);
    setOriginalFocusSeconds(25 * 60);
    setBreakSecondsLeft(0);
  }, []);

  // Start a session with the settings chosen in the timer window
  const startTimerWithConfig = useCallback(
    (config) => {
      const type = config?.type || "pomodoro";
      setTimerMode(type);
      setIsBreak(false);
      setIsTimerRunning(true);

      if (type === "flowtime") {
        setFlowSeconds(0);
        playStartSound();
        return;
      }

      const fm = config.focusMinutes ?? 25;
      const sb = config.shortBreakMinutes ?? (type === "pomodoro" ? 5 : 0);
      const lb = config.longBreakMinutes ?? (type === "pomodoro" ? 15 : 0);

      const focusSec = fm * 60;

      setFocusMinutes(fm);
      setShortBreakMinutes(sb);
      setLongBreakMinutes(lb);
      setOriginalFocusSeconds(focusSec);
      setTimeLeft(focusSec);
      playStartSound();
    },
    [playStartSound]
  );

  const handleStartSession = useCallback(
    (config) => {
      // Close the timer window so the room and session card are in view.
      setActiveWindow(null);
      startTimerWithConfig(config || {});
    },
    [startTimerWithConfig]
  );

  const handleCancelPreStart = useCallback(() => resetTimerState(), [resetTimerState]);

  const handleGiveUpRequest = useCallback(() => setShowGiveUpDialog(true), []);
  const clearSessionReward = useCallback(() => setSessionReward(null), []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setProgress(data.progress || null);
      }
    } catch (e) {
      console.error("API Error", e);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, { credentials: "include" });
      const data = await res.json();

      if (Array.isArray(data)) {
        const cleaned = data.map((t) => ({
          ...t,
          task1_id: t.task1_id,
          status: t.status || "in_progress",
        }));

        setTasks(cleaned);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  }, []);

  // The dashboard response already includes the user's tasks, so one
  // request fills everything on first load.
  useEffect(() => {
    // Loading data on mount; state is set when the response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Log session to backend
  const logSessionToBackend = useCallback(
    async (durationMin, techniqueType) => {
      const topicId = tasks.length > 0 ? tasks[0].topic_id : 1;
      try {
        const res = await fetch(`${API_BASE_URL}/session/complete`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration_min: durationMin,
            topic_id: topicId,
            technique_type: techniqueType,
            short_break_min: techniqueType === "pomodoro" ? shortBreakMinutes : null,
            long_break_min: techniqueType === "pomodoro" ? longBreakMinutes : null,
            session_type: "solo",
          }),
        });

        const result = await res.json();
        if (result.success) {
          setProgress((prev) => ({
            ...result.progress,
            streak_days: result.current_streak_days ?? prev?.streak_days ?? 0,
          }));
          if (result.leveled_up) {
            setLevelUp({ level: result.progress.level, reward: result.reward });
          } else {
            setSessionReward(result.reward);
          }
        }
      } catch (e) {
        console.error("Session log failed", e);
      }
    },
    [tasks, shortBreakMinutes, longBreakMinutes]
  );

  // Flowtime finishing
  const handleFlowtimeStop = useCallback(() => {
    const mins = Math.round(flowSeconds / 60);
    setIsTimerRunning(false);
    playFinishSound();

    if (mins < 30) {
      setFlowtimeTooShort(true);
      resetTimerState();
      setTimeout(() => setFlowtimeTooShort(false), 2500);
      return;
    }

    logSessionToBackend(mins, "flowtime");
    resetTimerState();
  }, [
    flowSeconds,
    logSessionToBackend,
    resetTimerState,
    playFinishSound,
  ]);

  // Focus finishing
  const finishFocusPeriod = useCallback(() => {
    setIsTimerRunning(false);
    const durationMin =
      focusMinutes || Math.max(1, Math.round(originalFocusSeconds / 60));

    if (timerMode === "pomodoro" || timerMode === "custom") {
      logSessionToBackend(durationMin, timerMode);
    }

    if (
      (timerMode === "pomodoro" || timerMode === "custom") &&
      shortBreakMinutes > 0
    ) {
      setBreakSecondsLeft(shortBreakMinutes * 60);
      setBreakTotalSeconds(shortBreakMinutes * 60);
      setIsBreak(true);
      setIsTimerRunning(true);
      playBreakSound();
    } else {
      playFinishSound();
      resetTimerState();
    }
  }, [
    focusMinutes,
    originalFocusSeconds,
    timerMode,
    shortBreakMinutes,
    logSessionToBackend,
    resetTimerState,
    playBreakSound,
    playFinishSound,
  ]);

  // Break finishing
  const finishBreak = useCallback(() => {
    setIsBreak(false);
    setIsTimerRunning(false);
    setBreakSecondsLeft(0);
    playFinishSound();

    setShowBreakDialog({
      message: "Break finished. Start next session?",
    });
  }, [playFinishSound]);

  // Focus countdown
  useEffect(() => {
    if (!isTimerRunning) return;
    if (timerMode === "flowtime") return;
    if (isBreak) return;
    if (timeLeft <= 0) return;

    const id = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [isTimerRunning, timerMode, isBreak, timeLeft]);

  useEffect(() => {
    if (isTimerRunning && !isBreak && timerMode !== "flowtime" && timeLeft <= 0) {
      // Reacting to the countdown reaching zero is what ends the focus period.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      finishFocusPeriod();
    }
  }, [timeLeft, isTimerRunning, isBreak, timerMode, finishFocusPeriod]);

  // Break countdown
  useEffect(() => {
    if (!isTimerRunning || !isBreak) return;
    if (breakSecondsLeft <= 0) return;

    const id = setInterval(() => setBreakSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [isTimerRunning, isBreak, breakSecondsLeft]);

  useEffect(() => {
    if (isTimerRunning && isBreak && breakSecondsLeft <= 0) {
      // Reacting to the break countdown reaching zero is what ends the break.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      finishBreak();
    }
  }, [isTimerRunning, isBreak, breakSecondsLeft, finishBreak]);

  // Flowtime engine
  useEffect(() => {
    if (timerMode !== "flowtime") return;
    if (!isTimerRunning) return;

    const id = setInterval(() => {
      setFlowSeconds((prev) => {
        if (prev + 1 >= 120 * 60) {
          setIsTimerRunning(false);
          setShowFlowDialog({
            type: "limit",
            minutes: Math.floor((prev + 1) / 60),
          });
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerMode, isTimerRunning]);


  // Leaving the den ends the running session, so check first.
  const navigate = useNavigate();
  const leaveDen = useCallback(
    (path) => {
      if (
        isTimerRunning &&
        !window.confirm("Leaving the Focus Den stops your timer. Leave anyway?")
      ) {
        return;
      }
      navigate(path);
    },
    [isTimerRunning, navigate]
  );

  // Helper to toggle windows
  const toggleWindow = (win) => {
    setActiveWindow((prev) => (prev === win ? null : win));
  };


  return (
    <div className="den-dashboard">

      <div className="den-room-layer">
        <RoomScene mode={currentMode} />
      </div>

      <div
        className={`den-ui-layer ${uiVisible ? "" : "is-hidden"}`}
        aria-hidden={!uiVisible}
      >
        <TopBar
          progress={progress}
          profileImage={user?.profile_image}
          firstName={user?.first_name}
          lastName={user?.last_name}
          email={user?.email}
          soundMuted={soundMuted}
          soundTheme={soundTheme}
          onOpenSoundSettings={() => setShowSoundSettings(true)}
          onToggleUI={() => setUiVisible(!uiVisible)}
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          onViewProfile={() => {
            setShowProfileMenu(false);
            setShowProfileWindow(true);
          }}
          onLeave={leaveDen}
          onLogout={async () => {
            await fetch(`${API_BASE}/auth/logout`, {
              method: "POST",
              credentials: "include",
            });
            window.location.href = "/login";
          }}
        />

        <div className="den-rail">
          <LeftSidebar
            activeWindow={activeWindow}
            onOpenStudyVille={() => {
              setItemToPlace(null);
              toggleWindow("studyville");
            }}
            onOpenRewards={() => toggleWindow("shop")}
            onOpenBuddies={() => leaveDen("/groups")}
            onOpenGroups={() => alert("Groups Coming Soon")}
            onOpenLeaderboard={() => toggleWindow("leaderboard")}
          />
        </div>

        {isTimerRunning && (
          <SessionCard
            timerMode={timerMode}
            isBreak={isBreak}
            timeLeft={timeLeft}
            totalSeconds={originalFocusSeconds}
            flowSeconds={flowSeconds}
            breakSecondsLeft={breakSecondsLeft}
            breakTotalSeconds={breakTotalSeconds}
            onStopFlowtime={handleFlowtimeStop}
            onGiveUp={handleGiveUpRequest}
          />
        )}

        {sessionReward && (
          <SessionRewardToast reward={sessionReward} onDone={clearSessionReward} />
        )}

        <QuickMenu
          activeWindow={activeWindow}
          onToggleTimer={() => toggleWindow("timer")}
          onToggleTasks={() => toggleWindow("tasks")}
          onToggleCalendar={() => toggleWindow("calendar")}
          onToggleStats={() => toggleWindow("stats")}
          onOpenMood={() => toggleWindow("mood")}
          roomMode={currentMode}
          setRoomMode={setCurrentMode}
          nextTask={tasks.find((t) => t.status !== "done")?.title}
          timerRunning={isTimerRunning}
          firstName={user?.first_name}
        />
      </div>

      {flowtimeTooShort && (
        <div className="den-window-overlay">
          <div
            className="den-window"
            style={{
              width: "300px",
              textAlign: "center",
              paddingBottom: "20px",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div className="window-header">
              <span className="window-title">Flowtime Session</span>
            </div>

            <div className="window-content">
              <p
                style={{
                  color: "#e5e7eb",
                  marginBottom: "12px",
                }}
              >
                Flowtime must be at least 30 minutes to earn rewards.
              </p>

              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                }}
              >
                Closing in a moment...
              </p>
            </div>
          </div>
        </div>
      )}

      {showFlowDialog && (
        <FlowtimeDialog
          type={showFlowDialog.type}
          minutes={Math.floor(flowSeconds / 60)}
          onStartBreak={() => {
            const userMinutes = prompt("Break length (minutes)?", 10);
            if (!userMinutes) return setShowFlowDialog(null);
            setBreakSecondsLeft(Number(userMinutes) * 60);
            setBreakTotalSeconds(Number(userMinutes) * 60);
            setIsBreak(true);
            setIsTimerRunning(true);
            setTimerMode("break");
            setShowFlowDialog(null);
          }}
          onEndSession={() => {
            const mins = Math.floor(flowSeconds / 60);
            logSessionToBackend(mins, "flowtime");
            resetTimerState();
            setShowFlowDialog(null);
          }}
          onStartAnother={() => {
            setShowFlowDialog(null);
            setTimerMode("flowtime");
            setFlowSeconds(0);
            setIsBreak(false);
            setIsTimerRunning(true);
          }}
        />
      )}

      {showBreakDialog && (
        <BreakDialog
          message={showBreakDialog.message}
          onStartNext={() => {
            if (timerMode === "pomodoro") {
              setTimeLeft(focusMinutes * 60);
              setOriginalFocusSeconds(focusMinutes * 60);
              setIsBreak(false);
              setIsTimerRunning(true);
            } else {
              resetTimerState();
            }
            setShowBreakDialog(null);
          }}
          onSkip={() => {
            resetTimerState();
            setShowBreakDialog(null);
          }}
        />
      )}

      {showGiveUpDialog && (
        <GiveUpDialog
          onCancel={() => setShowGiveUpDialog(false)}
          onConfirm={() => {
            resetTimerState();
            setShowGiveUpDialog(false);
          }}
        />
      )}

      {showSoundSettings && (
        <div className="den-window-overlay">
          <div
            className="den-window"
            style={{
              width: "360px",
              maxWidth: "90vw",
            }}
          >
            <div className="window-header">
              <span className="window-title">Sound Settings</span>
              <button
                className="close-btn"
                onClick={() => setShowSoundSettings(false)}
              >
                ✖
              </button>
            </div>
            <div className="window-content">
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#e5e7eb",
                    fontWeight: 600,
                  }}
                >
                  Master Sound
                </span>
                <button
                  className="den-btn-secondary"
                  onClick={() => setSoundMuted((m) => !m)}
                >
                  {soundMuted ? "Unmute" : "Mute All"}
                </button>
              </div>

              <div
                style={{
                  marginBottom: 10,
                  color: "#9ca3af",
                  fontSize: "0.85rem",
                }}
              >
                Ambient Theme
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {AMBIENCE_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSoundTheme(theme.id)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border:
                        soundTheme === theme.id
                          ? "2px solid #38bdf8"
                          : "1px solid rgba(148,163,184,0.6)",
                      background:
                        soundTheme === theme.id
                          ? "rgba(3, 105, 161,0.35)"
                          : "rgba(15,23,42,0.8)",
                      color: "#e5e7eb",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIMER WINDOW */}
      <div
        className="den-window-overlay"
        style={{
          display: activeWindow === "timer" ? "flex" : "none",
        }}
      >
        <TimerWindow
          timeLeft={timeLeft}
          isTimerRunning={isTimerRunning}
          timerMode={timerMode}
          flowSeconds={flowSeconds}
          isBreak={isBreak}
          onStartSession={handleStartSession}
          onCancelPreStart={handleCancelPreStart}
          onGiveUpRequest={handleGiveUpRequest}
          onFlowtimeStop={handleFlowtimeStop}
          onClose={() => {
            setActiveWindow(null);
          }}
        />
      </div>

      {/* TASKS WINDOW */}
      {activeWindow === "tasks" && (
        <div className="den-window-overlay">
          <TaskWindow
            tasks={tasks}
            onClose={() => {
              setActiveWindow(null);
            }}
            onRefreshData={loadTasks}
          />
        </div>
      )}

      {/* MOOD WINDOW */}
      {activeWindow === "mood" && (
        <div className="den-window-overlay">
          <MoodWindow
            onClose={() => {
              setActiveWindow(null);
            }}
          />
        </div>
      )}

      {/* REWARDS (SHOP) WINDOW */}
      {activeWindow === "shop" && (
        <div className="den-window-overlay">
          <ShopWindow
            onClose={() => setActiveWindow(null)}
            onCoinsChange={(coins) => setProgress((prev) => ({ ...prev, coins }))}
            onPlaceItem={(item) => {
              setItemToPlace(item.item_id);
              setActiveWindow("studyville");
            }}
          />
        </div>
      )}

      {/* STUDYVILLE WINDOW */}
      {activeWindow === "studyville" && (
        <div className="den-window-overlay">
          <StudyVilleWindow
            initialItemId={itemToPlace}
            onOpenShop={() => {
              setItemToPlace(null);
              setActiveWindow("shop");
            }}
            onClose={() => {
              setItemToPlace(null);
              setActiveWindow(null);
            }}
          />
        </div>
      )}

      {/* CALENDAR WINDOW */}
      {activeWindow === "calendar" && (
        <div className="den-window-overlay">
          <CalendarWindow onClose={() => setActiveWindow(null)} />
        </div>
      )}

      {/* LEADERBOARD WINDOW */}
      {activeWindow === "leaderboard" && (
        <div className="den-window-overlay">
          <LeaderboardWindow
            onClose={() => {
              setActiveWindow(null);
            }}
          />
        </div>
      )}

      {/* STATS WINDOW */}
      {activeWindow === "stats" && (
        <div className="den-window-overlay">
          <StatsWindow
            onClose={() => {
              setActiveWindow(null);
            }}
          />
        </div>
      )}

      {/* PROFILE WINDOW */}
      {showProfile && (
        <div className="den-window-overlay">
          <ProfileWindow
            user={user}
            onClose={() => setShowProfile(false)}
            onProfileUpdated={(newImagePath) => {
              setUser((prev) => ({
                ...prev,
                profile_image: newImagePath,
              }));
            }}
          />
        </div>
      )}

      {showProfileWindow && user && (
        <ProfileWindow
          user={user}
          onClose={() => setShowProfileWindow(false)}
          onProfileUpdated={(newImagePath) => {
            setUser((prev) => ({
              ...prev,
              profile_image: newImagePath,
            }));
          }}
        />
      )}


      {levelUp && (
        <LevelUpCelebration
          level={levelUp.level}
          reward={levelUp.reward}
          onClose={() => setLevelUp(null)}
        />
      )}

      {!uiVisible && (
        <button
          onClick={() => setUiVisible(true)}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 100,
            background: "rgba(0,0,0,0.5)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            cursor: "pointer",
            fontSize: "1.2rem",
            backdropFilter: "blur(5px)",
          }}
        >
          <Icon name="eye" title="show interface" />
        </button>
      )}
    </div>
  );
}
