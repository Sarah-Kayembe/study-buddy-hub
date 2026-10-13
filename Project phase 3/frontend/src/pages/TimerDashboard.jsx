// frontend/src/pages/TimerDashboard.jsx
// Updated by Sarah Kayembe

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

// --- COMPONENTS -----
import "../styles/studyTools.css";
import RoomScene from "../components/Dashboard/RoomScene";
import TopBar from "../components/Dashboard/TopBar";
import LeftSidebar from "../components/Dashboard/LeftSidebar";
import QuickMenu from "../components/Dashboard/QuickMenu";
import EncouragementBar from "../components/Dashboard/EncouragementBar";

// --- WINDOWS -----
import TimerWindow from "../components/Dashboard/Windows/TimerWindow";
import TaskWindow from "../components/Dashboard/Windows/TaskWindow";
import MoodWindow from "../components/Dashboard/Windows/MoodWindow";
import InventoryWindow from "../components/Dashboard/Windows/InventoryWindow";
import StudyVilleWindow from "../components/Dashboard/Windows/StudyVilleWindow";
import LeaderboardWindow from "../components/Dashboard/Windows/LeaderboardWindow";
import StatsWindow from "../components/Dashboard/Windows/StatsWindow";
import GiveUpDialog from "../components/Dashboard/Windows/GiveUpDialog";
import FlowtimeDialog from "../components/Dashboard/Windows/FlowtimeDialog";
import BreakDialog from "../components/Dashboard/Windows/BreakDialog";
import ProfileWindow from "../components/Dashboard/Windows/ProfileWindow";

//----- SOUND (timer sounds) -----
import startSoundFile from "../assets/sounds/start.mp3";
import finishSoundFile from "../assets/sounds/finish.mp3";
import breakSoundFile from "../assets/sounds/break.mp3";

// Ambient sounds
import pianoMp3 from "../assets/sounds/ambience/piano.mp3";
import rainMp3 from "../assets/sounds/ambience/rain.mp3";
import cafeMp3 from "../assets/sounds/ambience/cafe.mp3";
import fireplaceMp3 from "../assets/sounds/ambience/fireplace.mp3";
import lofiMp3 from "../assets/sounds/ambience/lofi.mp3";
import forestMp3 from "../assets/sounds/ambience/forest.mp3";
import celestialMp3 from "../assets/sounds/ambience/celestial.mp3";

// StudyVille reward images
import treehouseImg from "../assets/studyville/treehouse.webp";
import bhouseImg from "../assets/studyville/bhouse.webp";
import bookstoreImg from "../assets/studyville/booksstore.webp";
import coffeeshopImg from "../assets/studyville/coffeeshop.webp";
import roadImg from "../assets/studyville/Road.webp";
import road1Img from "../assets/studyville/Road1.webp";
import tileImg from "../assets/studyville/Tile.webp";

// API Configuration
import { API_BASE } from "../api/base";

const API_BASE_URL = `${API_BASE}/api/focus`;

// Format seconds -> MM:SS
function formatSeconds(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// Ambient themes
const AMBIENT_THEMES = {
  piano: pianoMp3,
  rain: rainMp3,
  cafe: cafeMp3,
  fireplace: fireplaceMp3,
  lofi: lofiMp3,
  forest: forestMp3,
  celestial: celestialMp3,
};

// Static reward options
const REWARD_OPTIONS = [
  { id: "treehouse", label: "Treehouse", image: treehouseImg },
  { id: "bhouse", label: "Big House", image: bhouseImg },
  { id: "bookstore", label: "Bookstore", image: bookstoreImg },
  { id: "coffeeshop", label: "Coffee Shop", image: coffeeshopImg },
  { id: "road", label: "Road Tile 1", image: roadImg },
  { id: "road2", label: "Road Tile 2", image: road1Img },
  { id: "tile", label: "Base Tile", image: tileImg },
];

export default function TimerDashboard() {
  // General UI State
  const [currentMode, setCurrentMode] = useState("focus");
  const [uiVisible, setUiVisible] = useState(true);
  const [activeWindow, setActiveWindow] = useState(null);
  const [selectedItemToPlace, setSelectedItemToPlace] = useState(null);

  // Dashboard Data
  const [tasks, setTasks] = useState([]);
  const [money, setMoney] = useState(0);
  const [stats, setStats] = useState({});
  const [level, setLevel] = useState(1);

  // User account data (used for top bar and profile picture)
  const [user, setUser] = useState(null);

  const [activeQuick, setActiveQuick] = useState(null);

  // Timer State
  const [timerMode, setTimerMode] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [originalFocusSeconds, setOriginalFocusSeconds] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0);
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

  // Create each sound player once. useRef(new Audio(...)) built three new
  // players on every render, which happens every second while the timer runs.
  const [startSound] = useState(() => ({ current: new Audio(startSoundFile) }));
  const [finishSound] = useState(() => ({ current: new Audio(finishSoundFile) }));
  const [breakSound] = useState(() => ({ current: new Audio(breakSoundFile) }));

  const ambientAudioRef = useRef(null);

  // Real-time clock
  const [currentTime, setCurrentTime] = useState("");

  // Reward system
  const [showRewardPicker, setShowRewardPicker] = useState(false);
  const [pendingConfig, setPendingConfig] = useState(null);
  const [currentSessionReward, setCurrentSessionReward] = useState(null);
  const [earnedRewards, setEarnedRewards] = useState([]);

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

  // Audio helper
  const playSound = useCallback(
    (audioRef) => {
      if (soundMuted) return;
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch {
        // Browsers can block audio until the user interacts; skip the sound.
      }
    },
    [soundMuted]
  );

  const playStartSound = useCallback(() => playSound(startSound), [playSound, startSound]);
  const playBreakSound = useCallback(() => playSound(breakSound), [playSound, breakSound]);
  const playFinishSound = useCallback(
    () => playSound(finishSound),
    [playSound, finishSound]
  );

  // Persist sound settings
  useEffect(() => {
    localStorage.setItem("sb_sound_muted", soundMuted ? "true" : "false");
  }, [soundMuted]);

  useEffect(() => {
    localStorage.setItem("sb_sound_theme", soundTheme);
  }, [soundTheme]);

  // Ambient background audio engine
  useEffect(() => {
    const audioEl = ambientAudioRef.current;
    if (!audioEl) return;

    audioEl.loop = true;
    audioEl.src = AMBIENT_THEMES[soundTheme];

    if (soundMuted) {
      audioEl.pause();
      return;
    }

    const play = () => {
      audioEl.play().catch(() => {});
    };
    play();

    return () => audioEl.pause();
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
    setCurrentSessionReward(null);
    setPendingConfig(null);
  }, []);

  const awardCurrentReward = useCallback(() => {
    if (!currentSessionReward) return;
    setEarnedRewards((prev) => [...prev, currentSessionReward]);
    setCurrentSessionReward(null);
  }, [currentSessionReward]);

  // Start session after reward chosen
  const startTimerWithConfig = useCallback(
    (config, reward) => {
      const type = config?.type || "pomodoro";
      setCurrentSessionReward(reward);
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

  const handleStartSession = useCallback((config) => {
    setPendingConfig(config || {});
    setShowRewardPicker(true);
  }, []);

  const handleRewardClick = useCallback(
    (reward) => {
      if (!pendingConfig) return;
      setShowRewardPicker(false);
      startTimerWithConfig(pendingConfig, reward);
      setPendingConfig(null);
    },
    [pendingConfig, startTimerWithConfig]
  );

  const handleCancelPreStart = useCallback(() => resetTimerState(), [resetTimerState]);

  const handleGiveUpRequest = useCallback(() => setShowGiveUpDialog(true), []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setMoney(data.money || 0);
        setStats(data.stats || {});
        setLevel(data.level || 1);
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
          fetchDashboardData();
          alert(`Session Complete! +${result.reward.coins} Coins`);
        }
      } catch (e) {
        console.error("Session log failed", e);
      }
    },
    [tasks, shortBreakMinutes, longBreakMinutes, fetchDashboardData]
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
    awardCurrentReward();
    resetTimerState();
  }, [
    flowSeconds,
    logSessionToBackend,
    resetTimerState,
    playFinishSound,
    awardCurrentReward,
  ]);

  // Focus finishing
  const finishFocusPeriod = useCallback(() => {
    setIsTimerRunning(false);
    const durationMin =
      focusMinutes || Math.max(1, Math.round(originalFocusSeconds / 60));

    if (timerMode === "pomodoro" || timerMode === "custom") {
      logSessionToBackend(durationMin, timerMode);
      awardCurrentReward();
    }

    if (
      (timerMode === "pomodoro" || timerMode === "custom") &&
      shortBreakMinutes > 0
    ) {
      setBreakSecondsLeft(shortBreakMinutes * 60);
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
    awardCurrentReward,
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

  // Real-time clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, "0");
      const m = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to toggle windows
  const toggleWindow = (win) => {
    setActiveWindow((prev) => (prev === win ? null : win));
  };

  // Quick menu timer display
  const quickMenuTime =
    timerMode === "flowtime"
      ? formatSeconds(flowSeconds)
      : isBreak
      ? formatSeconds(breakSecondsLeft)
      : formatSeconds(timeLeft);

  return (
    <div className="spirit-dashboard">
      <audio ref={ambientAudioRef} />

      <div className="spirit-room-layer">
        <RoomScene mode={currentMode} />
      </div>

      <div
        className="spirit-ui-layer"
        style={{
          opacity: uiVisible ? 1 : 0,
          transition: "opacity 0.5s",
        }}
      >
        <div className="hud-top-bar">
           <TopBar
              level={level}
              money={money}
              exp={stats.total_exp || 0}
              streakDays={stats.current_streak_days || 0}

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

              onLogout={async () => {
                await fetch(`${API_BASE}/auth/logout`, {
                  method: "POST",
                  credentials: "include",
                });
                window.location.href = "/login";
              }}
            />




        </div>

        <div className="hud-left-sidebar">
          <LeftSidebar
            onOpenStudyVille={() => toggleWindow("studyville")}
            onOpenRewards={() => toggleWindow("inventory")}
            onOpenGroups={() => alert("Groups Coming Soon")}
            onOpenLeaderboard={() => toggleWindow("leaderboard")}
          />
        </div>

        <div className="hud-quick-menu">
          <QuickMenu
            activeQuick={activeQuick}
            setActiveQuick={setActiveQuick}
            onToggleTimer={() => toggleWindow("timer")}
            onToggleTasks={() => toggleWindow("tasks")}
            onToggleCalendar={() => toggleWindow("calendar")}
            onToggleStats={() => toggleWindow("stats")}
            nextTask={tasks[0] ? tasks[0].title : null}
            timerRunning={isTimerRunning}
            remainingTime={quickMenuTime}
            currentTime={currentTime}
          />
        </div>

        <div className="hud-center-bar">
          <EncouragementBar
            mode={currentMode}
            setMode={setCurrentMode}
            onOpenMood={() => toggleWindow("mood")}
          />
        </div>

        {isTimerRunning && (
          <FloatingTimerBubble
            timerMode={timerMode}
            isBreak={isBreak}
            timeLeft={timeLeft}
            flowSeconds={flowSeconds}
            breakSecondsLeft={breakSecondsLeft}
            onStopFlowtime={handleFlowtimeStop}
            onGiveUp={handleGiveUpRequest}
          />
        )}
      </div>

      {flowtimeTooShort && (
        <div className="spirit-window-overlay">
          <div
            className="spirit-window"
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
            setIsBreak(true);
            setIsTimerRunning(true);
            setTimerMode("break");
            setShowFlowDialog(null);
          }}
          onEndSession={() => {
            const mins = Math.floor(flowSeconds / 60);
            logSessionToBackend(mins, "flowtime");
            awardCurrentReward();
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

      {showRewardPicker && (
        <div className="spirit-window-overlay">
          <div
            className="spirit-window"
            style={{
              width: "480px",
              maxWidth: "95vw",
            }}
          >
            <div className="window-header">
              <span className="window-title">Choose Your StudyVille Reward</span>
              <button
                className="close-btn"
                onClick={() => {
                  setShowRewardPicker(false);
                  setPendingConfig(null);
                }}
              >
                ✖
              </button>
            </div>
            <div className="window-content">
              <p
                style={{
                  color: "#e5e7eb",
                  marginBottom: "10px",
                  fontSize: "0.9rem",
                }}
              >
                Pick one building or tile you will earn if you finish this session.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {REWARD_OPTIONS.map((reward) => (
                  <button
                    key={reward.id}
                    onClick={() => handleRewardClick(reward)}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.6)",
                      background: "rgba(15,23,42,0.9)",
                      padding: "8px 6px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "transform 0.12s ease, box-shadow 0.12s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "70px",
                        height: "70px",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "rgba(15,23,42,1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 6,
                      }}
                    >
                      <img
                        src={reward.image}
                        alt={reward.label}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#e5e7eb",
                        textAlign: "center",
                      }}
                    >
                      {reward.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSoundSettings && (
        <div className="spirit-window-overlay">
          <div
            className="spirit-window"
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
                  className="spirit-btn-secondary"
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
                {[
                  { id: "forest", label: "Forest" },
                  { id: "cafe", label: "Cafe" },
                  { id: "rain", label: "Rain" },
                  { id: "fireplace", label: "Fireplace" },
                  { id: "piano", label: "Piano" },
                  { id: "celestial", label: "Celestial" },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSoundTheme(theme.id)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border:
                        soundTheme === theme.id
                          ? "2px solid #a855f7"
                          : "1px solid rgba(148,163,184,0.6)",
                      background:
                        soundTheme === theme.id
                          ? "rgba(88,28,135,0.35)"
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
        className="spirit-window-overlay"
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
            setActiveQuick(null);
          }}
        />
      </div>

      {/* TASKS WINDOW */}
      {activeWindow === "tasks" && (
        <div className="spirit-window-overlay">
          <TaskWindow
            tasks={tasks}
            onClose={() => {
              setActiveWindow(null);
              setActiveQuick(null);
            }}
            onRefreshData={loadTasks}
          />
        </div>
      )}

      {/* MOOD WINDOW */}
      {activeWindow === "mood" && (
        <div className="spirit-window-overlay">
          <MoodWindow
            onClose={() => {
              setActiveWindow(null);
              setActiveQuick(null);
            }}
          />
        </div>
      )}

      {/* INVENTORY WINDOW */}
      {activeWindow === "inventory" && (
        <div className="spirit-window-overlay">
          <InventoryWindow
            onClose={() => {
              setActiveWindow(null);
              setActiveQuick(null);
            }}
            onSelectItem={(item) => {
              setSelectedItemToPlace(item);
              setActiveWindow("studyville");
            }}
          />
        </div>
      )}

      {/* STUDYVILLE WINDOW */}
      {activeWindow === "studyville" && (
        <div className="spirit-window-overlay">
          <StudyVilleWindow
            selectedItemToPlace={selectedItemToPlace}
            onClearSelection={() => setSelectedItemToPlace(null)}
            earnedRewards={earnedRewards}
            onClose={() => {
              setActiveWindow(null);
              setActiveQuick(null);
            }}
          />
        </div>
      )}

      {/* LEADERBOARD WINDOW */}
      {activeWindow === "leaderboard" && (
        <div className="spirit-window-overlay">
          <LeaderboardWindow
            onClose={() => {
              setActiveWindow(null);
              setActiveQuick(null);
            }}
          />
        </div>
      )}

      {/* STATS WINDOW */}
      {activeWindow === "stats" && (
        <div className="spirit-window-overlay">
          <StatsWindow
            onClose={() => {
              setActiveWindow(null);
              setActiveQuick(null);
            }}
          />
        </div>
      )}

      {/* PROFILE WINDOW */}
      {showProfile && (
        <div className="spirit-window-overlay">
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
          <img
            src="https://img.icons8.com/ios-filled/50/ffffff/visible.png"
            alt="toggle-ui"
            style={{
              width: "22px",
              height: "22px",
            }}
          />
        </button>
      )}
    </div>
  );
}

// Floating draggable timer bubble
function FloatingTimerBubble({
  timerMode,
  isBreak,
  timeLeft,
  flowSeconds,
  breakSecondsLeft,
  onStopFlowtime,
  onGiveUp,
}) {
  const [pos, setPos] = useState({
    x: 0,
    y: 0,
  });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPos({
        x: dragStartRef.current.x + dx,
        y: dragStartRef.current.y + dy,
      });
    };
    const stop = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", stop);
    }

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };
  }, [dragging]);

  const seconds =
    timerMode === "flowtime"
      ? flowSeconds
      : isBreak
      ? breakSecondsLeft
      : timeLeft;

  const label =
    isBreak ? "Break" : timerMode === "flowtime" ? "Flow" : "Focus";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 220 + pos.y,
        right: 40 - pos.x,
        zIndex: 60,
        cursor: dragging ? "grabbing" : "grab",
      }}
      onMouseDown={(e) => {
        setDragging(true);
        dragStartRef.current = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          x: pos.x,
          y: pos.y,
        };
      }}
    >
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 20%, #111827, #020617 70%)",
          border: "4px solid #7c3aed",
          boxShadow: "0 0 24px rgba(167,139,250,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 10,
            borderRadius: "50%",
            border: "3px solid rgba(148,163,184,0.4)",
          }}
        />

        <div
          style={{
            textAlign: "center",
            color: "#fff",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "1.9rem",
            }}
          >
            {formatSeconds(seconds)}
          </div>

          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {timerMode === "flowtime" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStopFlowtime();
                }}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "4px 10px",
                  background: "rgba(34,197,94,0.1)",
                  color: "#4ade80",
                  cursor: "pointer",
                }}
              >
                Stop
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onGiveUp();
              }}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "4px 10px",
                background: "rgba(239,68,68,0.1)",
                color: "#fca5a5",
                cursor: "pointer",
              }}
            >
              Give Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
