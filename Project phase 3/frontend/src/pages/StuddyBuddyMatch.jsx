// src/pages/StudyBuddyMatch.jsx
import { useEffect, useState } from "react";
import {
  saveMatchProfile,
  fetchMatchSuggestions,
  fetchMatchProfile,
  uploadProfileImage,
  startConversation,
  fetchDirectMessages,
  sendDirectMessage,
  fetchInbox,
  fetchMessageRequests,
  respondToMessageRequest,
} from "../api/match";
import { searchCourses } from "../api/studygroups";

const FAKE_USER_ID = 1001; // replace with real auth later

export default function StudyBuddyMatch() {
  const [profile, setProfile] = useState({
    study_style: "group",
    meeting_pref: "in_person",
    bio: "",
    profile_image_url: "",
    study_goal: "make friends",
    focus_time_pref: "evening",
    noise_pref: "background music",
    age: "",
  });

  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseQuery, setCourseQuery] = useState("");
  const [courseResults, setCourseResults] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [hasProfile, setHasProfile] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // DM state
  const [activeConversation, setActiveConversation] = useState(null); // { conversation_id, partner, ... }
  const [dmMessages, setDmMessages] = useState([]);
  const [dmInput, setDmInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const [showChatDock, setShowChatDock] = useState(false);
  const [inbox, setInbox] = useState([]);       // all conversations
  const [requests, setRequests] = useState([]); // pending message requests
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  const [selectedMatch, setSelectedMatch] = useState(null); // for profile popup

  // Load existing profile (if any) on mount
  useEffect(() => {
    async function init() {
      try {
        const data = await fetchMatchProfile(FAKE_USER_ID);
        if (data && data.exists && data.profile) {
          const p = data.profile;

          setProfile((prev) => ({
            ...prev,
            study_style: p.study_style || "group",
            meeting_pref: p.meeting_pref || "in_person",
            bio: p.bio || "",
            profile_image_url: p.profile_image_url || "",
            study_goal: p.study_goal || "make friends",
            focus_time_pref: p.focus_time_pref || "evening",
            noise_pref: p.noise_pref || "background music",
            age: p.age ?? "",
          }));

          setSelectedCourses(data.courses || []);
          setHasProfile(true);
          setShowProfileForm(false); // existing users see matches first
          setInfo("Loaded your match profile.");
          await loadMatchesInternal();
        } else {
          setHasProfile(false);
          setShowProfileForm(true);
        }
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setInitialized(true);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load inbox whenever the dock is opened and you have a profile
  useEffect(() => {
    if (showChatDock && hasProfile) {
      loadInbox();
    }
  }, [showChatDock, hasProfile]);

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCourseSearch(q) {
    setCourseQuery(q);
    setError("");
    setInfo("");

    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setCourseResults([]);
      return;
    }

    try {
      const results = await searchCourses(trimmed, 8);
      setCourseResults(results);
    } catch (err) {
      setError(err.message || "Failed to search courses");
    }
  }

  function handleAddCourse(course) {
    if (selectedCourses.some((c) => c.course_id === course.course_id)) {
      setInfo("Course already added.");
      return;
    }

    if (selectedCourses.length >= 5) {
      setInfo("You can only choose up to 5 courses.");
      return;
    }

    setSelectedCourses((prev) => [...prev, course]);
    setCourseQuery("");
    setCourseResults([]);
  }

  function handleRemoveCourse(courseId) {
    setSelectedCourses((prev) =>
      prev.filter((c) => c.course_id !== courseId)
    );
  }

  async function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setInfo("");
    setIsUploading(true);

    try {
      const { url } = await uploadProfileImage(file);
      setProfile((prev) => ({
        ...prev,
        profile_image_url: url,
      }));
      setInfo("Profile image uploaded.");
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  function formatTime(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // open conversation from inbox (normal chat, no request gating)
    async function openConversationFromInbox(convo) {
    setError("");
    setIsLoadingChat(true);

    try {
      const msgs = await fetchDirectMessages(convo.conversation_id, 50);

      // Normalize request status
      const requestStatus = convo.request_status || "accepted"; // null -> treat as accepted
      const isRequestFlow = requestStatus === "pending";
      const isYouRequester = convo.is_requester === 1;

      // 👇 Check if YOU have already sent a message in this convo
      const youAlreadySent = (msgs || []).some(
        (m) => m.sender_user_id === FAKE_USER_ID
      );

      setActiveConversation({
        conversation_id: convo.conversation_id,
        partner: {
          other_user_id: convo.other_user_id,
          first_name: convo.first_name,
          last_name: convo.last_name,
        },
        requestStatus,             // "pending" / "accepted"
        isRequestFlow,             // true only when pending
        isYouRequester,            // true if you made the request
        hasSentInitial:
          isRequestFlow && isYouRequester && youAlreadySent, 
      });

      setDmMessages(msgs || []);
    } catch (err) {
      setError(err.message || "Failed to load conversation.");
    } finally {
      setIsLoadingChat(false);
    }
  }


  async function handleSendDm(e) {
    e.preventDefault();
    const text = dmInput.trim();
    if (!text || !activeConversation) return;

    const { isRequestFlow, hasSentInitial, isYouRequester } = activeConversation;

    // requester side: only one initial message while pending
    if (isRequestFlow && isYouRequester && hasSentInitial) {
      setInfo(
        `Waiting for ${activeConversation.partner.first_name} to accept your message request.`
      );
      return;
    }

    // target side: cannot send until they have accepted
    if (isRequestFlow && !isYouRequester) {
      setInfo("You need to accept this message request before replying.");
      return;
    }

    try {
      await sendDirectMessage(
        activeConversation.conversation_id,
        FAKE_USER_ID,
        text
      );

      const now = new Date().toISOString();
      setDmMessages((prev) => [
        ...prev,
        {
          message_id: `local-${Date.now()}`,
          sender_user_id: FAKE_USER_ID,
          first_name: "You",
          last_name: "",
          content: text,
          sent_time: now,
        },
      ]);
      setDmInput("");

      // mark that we've used our one message as requester
      setActiveConversation((prev) =>
        prev
          ? {
              ...prev,
              hasSentInitial:
                prev.isRequestFlow && prev.isYouRequester
                  ? true
                  : prev.hasSentInitial,
            }
          : prev
      );

      await loadInbox();
    } catch (err) {
      setError(err.message || "Failed to send message.");
    }
  }

  async function handleSaveProfile() {
    setError("");
    setInfo("");

    if (!FAKE_USER_ID) {
      setError("User is not logged in.");
      return;
    }

    if (selectedCourses.length === 0) {
      setError("Choose at least one course to match on.");
      return;
    }

    setIsSaving(true);
    try {
      const ageVal =
        profile.age === "" || profile.age === null
          ? null
          : Number(profile.age);

      const payload = {
        user_id: FAKE_USER_ID,
        study_style: profile.study_style || null,
        meeting_pref: profile.meeting_pref || null,
        bio: profile.bio || null,
        profile_image_url: profile.profile_image_url || null,
        study_goal: profile.study_goal || null,
        focus_time_pref: profile.focus_time_pref || null,
        noise_pref: profile.noise_pref || null,
        age: Number.isNaN(ageVal) ? null : ageVal,
        preferred_min_age: null,
        preferred_max_age: null,
        course_ids: selectedCourses.map((c) => c.course_id),
      };

      await saveMatchProfile(payload);
      setHasProfile(true);
      setInfo("Profile saved.");
      await loadMatchesInternal();
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function loadInbox() {
    setIsLoadingInbox(true);
    setError("");
    try {
      const [convos, reqs] = await Promise.all([
        fetchInbox(FAKE_USER_ID),
        fetchMessageRequests(FAKE_USER_ID),
      ]);
      setInbox(convos || []);
      setRequests(reqs || []);
    } catch (err) {
      setError(err.message || "Failed to load chat.");
    } finally {
      setIsLoadingInbox(false);
    }
  }

  async function loadMatchesInternal() {
    setError("");
    setIsLoadingMatches(true);
    try {
      const data = await fetchMatchSuggestions(FAKE_USER_ID, 20);
      setMatches(data || []);
      if (!data || data.length === 0) {
        setInfo("No matches found yet.");
      }
    } catch (err) {
      setError(err.message || "Failed to load matches");
    } finally {
      setIsLoadingMatches(false);
    }
  }

  async function handleRefreshMatches() {
    await loadMatchesInternal();
  }

 async function handleRespondToRequest(req, action) {
  try {
    // Call backend
    await respondToMessageRequest(req.request_id, action, FAKE_USER_ID);

    // 👉 UPDATE the active conversation immediately
    setActiveConversation((prev) => {
      if (!prev) return prev;

      // Only update if this request belongs to the currently opened DM
      if (prev.partner.other_user_id !== req.requester_user_id) {
        return prev;
      }

      return {
        ...prev,
        requestStatus: action === "accept" ? "accepted" : "rejected",   // <<< HERE
        isRequestFlow: false,
        hasSentInitial: false,
      };
    });

    // Refresh inbox so request disappears
    await loadInbox();
  } catch (err) {
    setError(err.message || "Failed to update request.");
  }
}

  async function openChatWithMatch(match) {
  setError("");
  setInfo("");
  setIsLoadingChat(true);
  try {
    const { conversation_id } = await startConversation(
      FAKE_USER_ID,
      match.other_user_id
    );

    await loadInbox(); // keep inbox in sync
    const msgs = await fetchDirectMessages(conversation_id, 50);

    const alreadySent = (msgs || []).some(
      (m) => m.sender_user_id === FAKE_USER_ID
    );

    setActiveConversation({
      conversation_id,
      partner: match,
      isRequestFlow: true,
      hasSentInitial: alreadySent,
      isYouRequester: true,
      requestStatus: "pending", // ✅ this is a pending request
    });
    setDmMessages(msgs || []);
    setShowChatDock(true);
  } catch (err) {
    setError(err.message || "Failed to open chat.");
  } finally {
    setIsLoadingChat(false);
  }
}

function truncatePreview(text, max = 60) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

  // ----- request / input gating helpers -----
  const isPendingRequest =
  !!activeConversation && activeConversation.requestStatus === "pending";

const isRejectedRequest =
  !!activeConversation && activeConversation.requestStatus === "rejected";

const isYouRequester =
  isPendingRequest && activeConversation?.isYouRequester === true;

const isYouTarget =
  isPendingRequest && activeConversation?.isYouRequester === false;

const disableDmInput =
  (isYouRequester && activeConversation?.hasSentInitial) ||
  isYouTarget ||
  isRejectedRequest;

const dmPlaceholder = isRejectedRequest
  ? "This message request was ignored."
  : isPendingRequest
  ? isYouRequester
    ? `Waiting for ${activeConversation.partner.first_name} to accept...`
    : "You need to accept this message request before replying."
  : "Type a message...";

  
  // 🔍 DEBUG LOGS — TEMPORARY
  useEffect(() => {
    console.log("ACTIVE CONVERSATION STATE", activeConversation);
  }, [activeConversation]);

  useEffect(() => {
    console.log("DISABLE DM INPUT?", disableDmInput);
  }, [disableDmInput]);

  // ----- render -----
  return (
    <div className="app-shell home-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        <h1 className="page-title">StudyBuddy Match</h1>

        {hasProfile && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowProfileForm((v) => !v)}
          >
            {showProfileForm ? "Hide profile settings" : "Profile settings"}
          </button>
        )}
      </div>

      {/* Profile card */}
      {showProfileForm && (
        <section className="section">
          <div className="card feature-card feature-card-gamified">
            <div className="feature-card-header">
              <div className="feature-card-title-row">
                <h2 className="feature-grid-title">Your Match Profile</h2>
              </div>
            </div>

            <p className="hero-body-text">
              Tell StudyBuddy how you like to learn, when you&apos;re free, and
              which courses you&apos;re focused on. We&apos;ll suggest compatible
              study partners from your college first, then beyond.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
                gap: "1.5rem",
                marginTop: "1.25rem",
              }}
            >
              {/* Left: profile form */}
              <div>
                <div className="section" style={{ marginBottom: "1rem" }}>
                  <label>Study style</label>
                  <select
                    name="study_style"
                    value={profile.study_style}
                    onChange={handleChange}
                    className="match-select"
                  >
                    <option value="solo">Solo</option>
                    <option value="pair">Pair</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                <div className="section" style={{ marginBottom: "1rem" }}>
                  <label>Meeting preference</label>
                  <select
                    name="meeting_pref"
                    value={profile.meeting_pref}
                    onChange={handleChange}
                    className="match-select"
                  >
                    <option value="online">Online</option>
                    <option value="in_person">In-person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="section" style={{ marginBottom: "1rem" }}>
                  <label>Study goal</label>
                  <select
                    name="study_goal"
                    value={profile.study_goal}
                    onChange={handleChange}
                    className="match-select"
                  >
                    <option value="make friends">Make friends</option>
                    <option value="ace tests">Ace tests</option>
                    <option value="review material">Review material</option>
                    <option value="all of the above">All of the above</option>
                  </select>
                </div>

                <div
                  className="section"
                  style={{
                    marginBottom: "1rem",
                    display: "grid",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <label>Focus time</label>
                    <select
                      name="focus_time_pref"
                      value={profile.focus_time_pref}
                      onChange={handleChange}
                      className="match-select"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Late night</option>
                      <option value="no preference">No preference</option>
                    </select>
                  </div>

                  <div>
                    <label>Noise level preference</label>
                    <select
                      name="noise_pref"
                      value={profile.noise_pref}
                      onChange={handleChange}
                      className="match-select"
                    >
                      <option value="silent">Silent</option>
                      <option value="some noise">Some chatter</option>
                      <option value="background music">
                        Background music OK
                      </option>
                      <option value="no preference">No preference</option>
                    </select>
                  </div>
                </div>

                <div
                  className="section"
                  style={{
                    marginBottom: "1rem",
                    display: "grid",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <label>Your age (optional)</label>
                    <input
                      type="number"
                      name="age"
                      min="17"
                      max="80"
                      value={profile.age}
                      onChange={handleChange}
                      placeholder="e.g. 20"
                    />
                  </div>

                  <div>
                    <label>Profile image</label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                      />
                      {isUploading && (
                        <span className="group-meta">Uploading...</span>
                      )}
                    </div>
                    {profile.profile_image_url && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <img
                          src={profile.profile_image_url}
                          alt="Profile preview"
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "999px",
                            objectFit: "cover",
                            border: "1px solid rgba(148,163,184,0.75)",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="section" style={{ marginBottom: "1rem" }}>
                  <label>Short bio</label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    placeholder="Tell potential study buddies a little about yourself..."
                  />
                </div>
              </div>

              {/* Right: course selection + actions */}
              <div>
                <div className="section" style={{ marginBottom: "1.1rem" }}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">Courses to match on</div>
                      <p className="group-meta">
                        You can choose up to 5 courses. We only match students
                        who share at least one.
                      </p>
                    </div>
                  </div>

                  <div
                    className="section"
                    style={{ marginBottom: "0.5rem" }}
                  >
                    <input
                      type="text"
                      placeholder="Search courses (e.g., COS 420 or Database Systems)"
                      value={courseQuery}
                      onChange={(e) => handleCourseSearch(e.target.value)}
                    />
                  </div>

                  {courseResults.length > 0 && (
                    <div
                      className="scroll-list card-subtle"
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.75rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <ul className="clean-list">
                        {courseResults.map((c) => (
                          <li key={c.course_id} className="group-row">
                            <div className="group-main">
                              <span className="group-name">
                                {c.course_code}
                              </span>
                              <span className="group-meta">
                                {c.course_name}
                                {c.college_name ? ` · ${c.college_name}` : ""}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleAddCourse(c)}
                            >
                              Add
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    className="card-subtle"
                    style={{
                      padding: "0.75rem 0.9rem",
                      borderRadius: "0.9rem",
                    }}
                  >
                    <div
                      className="card-header"
                      style={{ marginBottom: "0.4rem" }}
                    >
                      <div
                        className="card-title"
                        style={{ fontSize: "1rem" }}
                      >
                        Selected ({selectedCourses.length}/5)
                      </div>
                    </div>

                    {selectedCourses.length === 0 ? (
                      <p className="group-meta">No courses selected yet.</p>
                    ) : (
                      <ul className="clean-list scroll-list">
                        {selectedCourses.map((c) => (
                          <li key={c.course_id} className="group-row">
                            <div className="group-main">
                              <span className="group-name">
                                {c.course_code}
                              </span>
                              <span className="group-meta">
                                {c.course_name}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleRemoveCourse(c.course_id)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div
                  className="section"
                  style={{
                    marginTop: "0.75rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving profile..." : "Save profile"}
                  </button>
                </div>

                {error && (
                  <p className="error-text" style={{ marginTop: "0.5rem" }}>
                    {error}
                  </p>
                )}
                {info && !error && (
                  <p className="group-meta" style={{ marginTop: "0.5rem" }}>
                    {info}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* hide until profile is saved */}
      {hasProfile && (
        <section className="section">
          <div className="card card-subtle">
            <div className="card-header">
              <div>
                <div className="card-title">Suggested StudyBuddies</div>
                <p className="group-meta">
                  Here is who we think would be a great fit for you!
                </p>
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleRefreshMatches}
                disabled={isLoadingMatches}
              >
                {isLoadingMatches ? "Refreshing..." : "Refresh matches"}
              </button>
            </div>

            {matches.length === 0 ? (
              <p className="group-meta">
                {initialized ? "No matches yet." : "Loading..."}
              </p>
            ) : (
              <div className="scroll-list">
                <ul className="clean-list">
                  {matches.map((m) => {
                    const isThisOpen =
                        activeConversation?.partner?.other_user_id === m.other_user_id;

                    return (
                        <li key={m.other_user_id} className="group-row">
                        <div className="group-main">
                            {/* Name becomes a clickable “open profile” trigger */}
                            <button
                            type="button"
                            className="group-name"
                            style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                margin: 0,
                                textAlign: "left",
                                cursor: "pointer",
                            }}
                            onClick={() => setSelectedMatch(m)}
                            >
                            {m.first_name} {m.last_name}
                            </button>
                        </div>

                        <div
                            style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "0.4rem",
                            }}
                        >
                            {m.profile_image_url ? (
                            <img
                                src={m.profile_image_url}
                                alt={`${m.first_name} ${m.last_name}`}
                                style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "999px",
                                objectFit: "cover",
                                border: "1px solid rgba(148,163,184,0.6)",
                                }}
                                onError={(e) => {
                                e.currentTarget.style.display = "none";
                                }}
                            />
                            ) : null}

                            <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => openChatWithMatch(m)}
                            disabled={isLoadingChat && isThisOpen}
                            >
                            {isLoadingChat && isThisOpen
                                ? "Opening..."
                                : isThisOpen
                                ? "Open chat"
                                : "Message"}
                            </button>
                        </div>
                        </li>
                    );
                    })}

                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {hasProfile && (
        <>
          {/* Floating Chat button in the bottom-right */}
          <button
            type="button"
            className="btn btn-primary"
            style={{
              position: "fixed",
              right: "1.5rem",
              bottom: showChatDock ? "19rem" : "1.5rem",
              zIndex: 40,
              borderRadius: "999px",
              paddingInline: "1.25rem",
            }}
            onClick={() => setShowChatDock((v) => !v)}
          >
            Chat
          </button>

          {showChatDock && (
            <div
              className="card card-subtle"
              style={{
                position: "fixed",
                right: "1.5rem",
                bottom: "1.5rem",
                width: "640px",
                maxHeight: "580px",
                display: "flex",
                flexDirection: "column",
                zIndex: 50,
              }}
            >
              {/* Top bar of the dock */}
              <div
                className="card-header"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <div className="card-title" style={{ fontSize: "0.95rem" }}>
                  Chat
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowChatDock(false)}
                >
                  Close
                </button>
              </div>

              {/* Two columns: left = list, right = active conversation */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1.7fr)",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {/* LEFT: messages + requests list */}
                <div
                  className="scroll-list"
                  style={{
                    borderRight: "1px solid rgba(148,163,184,0.35)",
                    paddingRight: "0.5rem",
                  }}
                >
                  {/* Conversations */}
                  <div className="group-meta" style={{ fontSize: "0.8rem" }}>
                    Messages
                  </div>
                  {isLoadingInbox ? (
                    <p className="group-meta">Loading…</p>
                  ) : inbox.length === 0 ? (
                    <p className="group-meta">No conversations yet.</p>
                  ) : (
                    <ul className="clean-list">
                      {inbox.map((c) => (
                        <li
                          key={c.conversation_id}
                          className="group-row"
                          style={{
                            padding: "0.25rem 0.2rem",
                            cursor: "pointer",
                            background:
                              activeConversation?.conversation_id ===
                              c.conversation_id
                                ? "rgba(59,130,246,0.15)"
                                : "transparent",
                            borderRadius: "0.5rem",
                          }}
                          onClick={() => openConversationFromInbox(c)}
                        >
                          <div className="group-main">
                            <span className="group-name">
                              {c.first_name} {c.last_name}
                            </span>
                            <span
                            className="group-meta"
                            style={{ fontSize: "0.75rem" }}
                            >
                            {c.last_message
                                ? truncatePreview(c.last_message, 70)   // adjust 70 if you want shorter/longer
                                : "No messages yet"}
                            </span>

                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Requests */}
                  <div
                    className="group-meta"
                    style={{ fontSize: "0.8rem", marginTop: "0.75rem" }}
                  >
                    Requests
                  </div>
                  {requests.length === 0 ? (
                    <p className="group-meta">No pending requests.</p>
                  ) : (
                    <ul className="clean-list">
                      {requests.map((r) => (
                        <li key={r.request_id} className="group-row">
                          <div className="group-main">
                            <span className="group-name">
                              {r.requester_name ||
                                `${r.first_name} ${r.last_name || ""}`}
                            </span>
                            <span
                              className="group-meta"
                              style={{ fontSize: "0.75rem" }}
                            >
                              Message request
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() =>
                                handleRespondToRequest(r, "accept")
                              }
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() =>
                                handleRespondToRequest(r, "reject")
                              }
                            >
                              Ignore
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* RIGHT: active conversation */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  {activeConversation ? (
                    <>
                      {/* header for the current DM */}
                      <div
                        className="card-header"
                        style={{
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0 0 0.35rem 0",
                        }}
                      >
                        <div>
                          <div
                            className="card-title"
                            style={{ fontSize: "0.9rem" }}
                          >
                            {activeConversation.partner.first_name}{" "}
                            {activeConversation.partner.last_name}
                          </div>
                        </div>
                      </div>

                      {/* messages list */}
                      <div
                        className="scroll-list"
                        style={{
                          maxHeight: "240px",
                          padding: "0.75rem 0.9rem",
                          borderRadius: "0.75rem",
                          border: "1px solid rgba(148,163,184,0.35)",
                          marginBottom: "0.5rem",
                          flex: 1,
                          minHeight: 0,
                        }}
                      >
                        {dmMessages.length === 0 ? (
                          <p className="group-meta">
                            No messages yet. Say hi and break the ice 👋
                          </p>
                        ) : (
                          <ul className="clean-list">
                            {dmMessages.map((msg) => (
                              <li
                                key={msg.message_id}
                                style={{
                                  display: "flex",
                                  flexDirection:
                                    msg.sender_user_id === FAKE_USER_ID
                                      ? "row-reverse"
                                      : "row",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <div
                                  style={{
                                    maxWidth: "70%",
                                    padding: "0.45rem 0.6rem",
                                    borderRadius: "0.75rem",
                                    fontSize: "0.9rem",
                                    border:
                                      "1px solid rgba(148,163,184,0.6)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 500,
                                      marginBottom: "0.15rem",
                                      fontSize: "0.8rem",
                                      opacity: 0.9,
                                    }}
                                  >
                                    {msg.sender_user_id === FAKE_USER_ID
                                      ? "You"
                                      : `${msg.first_name} ${msg.last_name}`}
                                  </div>
                                  <div>{msg.content}</div>
                                  <div
                                    className="group-meta"
                                    style={{
                                      marginTop: "0.15rem",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {formatTime(msg.sent_time)}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* input */}
                    <form
                        onSubmit={handleSendDm}
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "flex-end",
                        }}
                        >
                        <textarea
                            placeholder={dmPlaceholder}
                            value={dmInput}
                            onChange={(e) => {
                            setDmInput(e.target.value);
                            // auto-grow textarea
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            style={{
                            flex: 1,
                            minHeight: "40px",
                            maxHeight: "120px",
                            padding: "0.45rem 0.6rem",
                            borderRadius: "0.75rem",
                            border: "1px solid rgba(148,163,184,0.6)",
                            fontSize: "0.9rem",
                            resize: "none",
                            overflowY: "auto",
                            }}
                            disabled={disableDmInput}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={disableDmInput || !dmInput.trim()}
                        >
                            Send
                        </button>
                        </form>


                        {isRejectedRequest && (
                            <p className="group-meta" style={{ marginTop: "0.25rem", color: "#f55" }}>
                                This message request was ignored.
                            </p>
                        )}

                    </>
                  ) : (
                    <p className="group-meta" style={{ paddingTop: "0.5rem" }}>
                      Select a conversation or accept a request to start
                      chatting.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Match profile popup */}
        {selectedMatch && (
        <div
            style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            }}
            onClick={() => setSelectedMatch(null)}
        >
            <div
            className="card card-subtle"
            style={{
                width: "480px",
                maxWidth: "90vw",
                maxHeight: "80vh",
                overflowY: "auto",
                padding: "1.25rem 1.5rem",
            }}
            onClick={(e) => e.stopPropagation()} // don’t close when clicking inside
            >
            <div
                className="card-header"
                style={{
                justifyContent: "space-between",
                alignItems: "center",
                padding: 0,
                marginBottom: "0.75rem",
                }}
            >
                <div className="card-title" style={{ fontSize: "1.1rem" }}>
                {selectedMatch.first_name} {selectedMatch.last_name}
                </div>
                <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedMatch(null)}
                >
                Close
                </button>
            </div>

            <div
                style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "0.75rem",
                alignItems: "flex-start",
                }}
            >
                {selectedMatch.profile_image_url && (
                <img
                    src={selectedMatch.profile_image_url}
                    alt={`${selectedMatch.first_name} ${selectedMatch.last_name}`}
                    style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "999px",
                    objectFit: "cover",
                    border: "1px solid rgba(148,163,184,0.6)",
                    }}
                    onError={(e) => {
                    e.currentTarget.style.display = "none";
                    }}
                />
                )}

                <div>
                {selectedMatch.age && (
                    <p className="group-meta">Age {selectedMatch.age}</p>
                )}
                <p className="group-meta">
                    Shared courses: {selectedMatch.shared_courses ?? 0}
                </p>
                </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
                <p className="group-meta">
                Style: {selectedMatch.study_style} · Meeting:{" "}
                {selectedMatch.meeting_pref} · Goal: {selectedMatch.study_goal}
                </p>
            </div>

            <div>
                <div
                className="card-title"
                style={{ fontSize: "0.95rem", marginBottom: "0.35rem" }}
                >
                Bio
                </div>
                <p className="group-meta">
                {selectedMatch.bio && selectedMatch.bio.trim().length > 0
                    ? selectedMatch.bio
                    : "This student hasn't added a bio yet."}
                </p>
            </div>
            </div>
        </div>
        )}

    </div>
  );
}
