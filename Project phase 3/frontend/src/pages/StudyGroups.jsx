// src/pages/StudyGroups.jsx

import { useEffect, useState } from "react";
import {
  fetchPublicGroups,
  fetchMyGroups,
  createGroup,
  joinGroup,
  createSession,
  fetchUpcomingSessions,
  fetchPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  fetchGroupMembers,
  kickMember,
  generateInviteCode,
  joinByInviteCode,
} from "../api/studygroups.js";

import ChatPage from "./ChatPage";
import CheckJoinIcon from "../assets/CheckJoin.png";

export default function StudyGroups() {
  // temp/dev user switcher
  const [userId, setUserId] = useState(1005);

  // --- chat state ---
  const [chatGroup, setChatGroup] = useState(null);

  // --- filters / data ---
  const [courseId, setCourseId] = useState(420);
  const [publicGroups, setPublicGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- create group form ---
  const [newGroupName, setNewGroupName] = useState("");
  const [newMaxMembers, setNewMaxMembers] = useState(5);
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  // --- schedule session modal ---
  const [scheduleGroup, setScheduleGroup] = useState(null); // { id, name } or null
  const [sessionDate, setSessionDate] = useState("");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // --- calendar modal ---
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // --- manage members modal ---
  const [manageGroup, setManageGroup] = useState(null); // { id, name, role } or null
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTab, setManageTab] = useState("requests"); // "requests" | "members"
  const [manageRequests, setManageRequests] = useState([]);
  const [manageMembers, setManageMembers] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState("");
  const [inviteCodeInfo, setInviteCodeInfo] = useState(null);
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
  const [inviteCodeError, setInviteCodeError] = useState("");

  // --- toast ---
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showToast, setShowToast] = useState(false);

  // --- tabs (create/search) ---
  const [activeTab, setActiveTab] = useState("create"); // "create" | "search"

  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [inviteJoinLoading, setInviteJoinLoading] = useState(false);


  // --------------------
  // Data loading
  // --------------------
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [pub, mine, sessions] = await Promise.all([
        fetchPublicGroups(courseId),
        fetchMyGroups(userId),
        fetchUpcomingSessions(userId),
      ]);

      setPublicGroups(pub);
      setMyGroups(mine);
      setUpcomingSessions(sessions);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, userId]);

  // --------------------
  // Helpers
  // --------------------
  const showToastMessage = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const resetSessionForm = () => {
    setSessionDate("");
    setSessionStart("");
    setSessionEnd("");
    setSessionLocation("");
    setSessionNotes("");
  };

  // Group sessions by date string "YYYY-MM-DD"
  const sessionsByDate = (() => {
    const map = {};
    for (const s of upcomingSessions) {
      const key = s.session_date;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  })();

  // Build calendar cells for current calendarMonth
  const calendarCells = (() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0–11

    const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr =
        year +
        "-" +
        String(month + 1).padStart(2, "0") +
        "-" +
        String(d).padStart(2, "0");
      cells.push({
        day: d,
        dateStr,
        hasEvents: !!sessionsByDate[dateStr],
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  })();

  const selectedEvents =
    selectedCalendarDate && sessionsByDate[selectedCalendarDate]
      ? sessionsByDate[selectedCalendarDate]
      : [];

  const calendarMonthLabel = calendarMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const openCalendar = () => {
    if (upcomingSessions.length > 0) {
      const first = upcomingSessions[0].session_date; // "YYYY-MM-DD"
      const [y, m] = first.split("-").map(Number);
      setCalendarMonth(new Date(y, m - 1, 1));
      setSelectedCalendarDate(first);
    } else {
      const today = new Date();
      const todayStr =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");
      setSelectedCalendarDate(todayStr);
    }
    setShowCalendarModal(true);
  };

  const changeMonth = (delta) => {
    setCalendarMonth((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m + delta, 1);
    });
  };

  // --------------------
  // Manage members / requests helpers
  // --------------------
  const loadManageData = async (groupId, tab, groupRole) => {
  setManageLoading(true);
  setManageError("");

  try {
    // owner-only: pending join requests
    if (tab === "requests" && groupRole === "owner") {
      const data = await fetchPendingJoinRequests(groupId, userId);
      setManageRequests(data);
    }

    // everyone can see members
    if (tab === "members") {
      const data = await fetchGroupMembers(groupId);
      setManageMembers(data);
    }
  } catch (err) {
    console.error(err);
    setManageError(err.message || "Failed to load data");
  } finally {
    setManageLoading(false);
  }
};


  const openManageModal = (group) => {
    // group: { id, name, role }
    const initialTab = group.role === "owner" ? "requests" : "members";
    setManageGroup(group);
    setManageTab(initialTab);
    setShowManageModal(true);
    loadManageData(group.id, initialTab, group.role);
  };

  const handleApproveRequest = async (requestUserId) => {
  if (!manageGroup) return;
  try {
    await approveJoinRequest(manageGroup.id, requestUserId, userId);
    showToastMessage("Request approved", "success");
    // reload requests + members (they just joined)
    await loadManageData(manageGroup.id, "requests", manageGroup.role);
    await loadManageData(manageGroup.id, "members", manageGroup.role);
    await loadData(); // refresh My Groups list / counts
  } catch (err) {
    console.error(err);
    showToastMessage(err.message || "Failed to approve", "error");
  }
};

const handleRejectRequest = async (requestUserId) => {
  if (!manageGroup) return;
  try {
    await rejectJoinRequest(manageGroup.id, requestUserId, userId);
    showToastMessage("Request rejected", "success");
    await loadManageData(manageGroup.id, "requests", manageGroup.role);
  } catch (err) {
    console.error(err);
    showToastMessage(err.message || "Failed to reject", "error");
  }
};


  const handleKickMember = async (memberUserId) => {
    if (!manageGroup) return;
    if (!window.confirm("Remove this member from the group?")) return;

    try {
      await kickMember(manageGroup.id, memberUserId, userId);
      showToastMessage("Member removed", "success");
      await loadManageData(manageGroup.id, "members", manageGroup.role);
      await loadData();
    } catch (err) {
      console.error(err);
      showToastMessage(err.message || "Failed to remove member", "error");
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!manageGroup) return;
    setInviteCodeLoading(true);
    setInviteCodeError("");
    try {
      const res = await generateInviteCode(manageGroup.id, userId);
      // expected shape: { invite_code, expires_at }
      setInviteCodeInfo(res);
    } catch (err) {
      console.error(err);
      setInviteCodeError(err.message || "Failed to generate invite code");
    } finally {
      setInviteCodeLoading(false);
    }
  };


  const handleCreateGroup = async (e) => {
  e.preventDefault();
  if (!newGroupName.trim()) return;

  setError("");
  try {
    await createGroup({
      group_name: newGroupName.trim(),
      max_members: Number(newMaxMembers),
      course_id: Number(courseId),
      is_private: newIsPrivate,
      creator_user_id: userId,
    });

    setNewGroupName("");
    setNewMaxMembers(5);
    setNewIsPrivate(false);

    await loadData();
    showToastMessage("Group created!", "success");
  } catch (err) {
    console.error(err);
    setError(err.message || "Failed to create group");
    showToastMessage("Failed to create group", "error");
  }
};


  const handleJoin = async (groupId) => {
    setError("");
    try {
      const res = await joinGroup(groupId, userId);

      if (res.status === "joined") {
        await loadData();
        showToastMessage("Joined group!", "success");
      } else if (res.status === "request_pending") {
        showToastMessage(
          res.message || "Join request sent to group owner.",
          "success"
        );
      } else {
        showToastMessage(res.message || "Request submitted.", "success");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to join group");
      showToastMessage(err.message || "Failed to join group", "error");
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!scheduleGroup) return;

    setError("");
    try {
      await createSession(scheduleGroup.id, {
        session_date: sessionDate,
        start_time: sessionStart,
        end_time: sessionEnd,
        location: sessionLocation,
        notes: sessionNotes,
      });

      resetSessionForm();
      setScheduleGroup(null);
      setShowScheduleModal(false);

      await loadData();

      showToastMessage("Session scheduled!", "success");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create session");
      showToastMessage("Failed to create session", "error");
    }
  };

  // --------------------
  // Chat mode: AFTER all hooks
  // --------------------
  if (chatGroup !== null) {
    return (
      <ChatPage
        groupId={chatGroup.id}
        groupName={chatGroup.name}
        userId={userId}
        onBack={() => setChatGroup(null)}
      />
    );
  }

    // Build a quick lookup of groups the current user is already in
  const myGroupIds = new Set(myGroups.map((g) => g.group_id));

  // Only show public groups the user is not already a member of
  const visiblePublicGroups = publicGroups.filter(
    (g) => !myGroupIds.has(g.group_id)
  );

const handleJoinByCode = async (e) => {
  e.preventDefault();
  const code = inviteCodeInput.trim();
  if (!code) return;

  setInviteJoinLoading(true);
  setError("");

  try {
    await joinByInviteCode(code, userId);
    setInviteCodeInput("");
    showToastMessage("Joined group via invite code!", "success");
    await loadData();
  } catch (err) {
    console.error(err);
    showToastMessage(err.message || "Failed to join with code", "error");
  } finally {
    setInviteJoinLoading(false);
  }
};

  // --------------------
  // Render
  // --------------------
  return (
    <div className="app-shell">
      {/* Dev user switcher */}
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          alignItems: "center",
          fontSize: "0.85rem",
          opacity: 0.85,
        }}
      >
        <span style={{ fontWeight: 500 }}>Acting as user:</span>
        <select
          value={userId}
          onChange={(e) => setUserId(Number(e.target.value))}
          style={{
            borderRadius: "999px",
            padding: "0.25rem 0.6rem",
            border: "1px solid rgba(148,163,184,0.6)",
            background: "#020617",
            color: "#e5e7eb",
          }}
        >
          <option value={1005}>1005 (owner demo)</option>
          <option value={1006}>1006 (student A)</option>
          <option value={1004}>1004 (student B)</option>
        </select>
      </div>

      <h1 className="page-title">Study Groups</h1>

      {/* Top layout: My Groups + right side panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.2fr)",
          gap: "1.5rem",
          alignItems: "flex-start",
          marginBottom: "2rem",
        }}
      >
        {/* My groups */}
        <section className="section" style={{ marginBottom: 0 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">My Groups</div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={openCalendar}
              >
                View upcoming sessions
              </button>
            </div>
            {myGroups.length === 0 ? (
              <p>You are not in any groups for this course.</p>
            ) : (
              <div className="scroll-list">
                <ul className="clean-list">
                  {myGroups.map((g) => (
                    <li key={g.group_id} className="group-row">
                      <div className="group-main">
                        <span className="group-name">{g.group_name}</span>
                        <span className="group-meta">role: {g.role}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-ghost icon-btn"
                          title={
                            g.role === "owner"
                              ? "View join requests & members"
                              : "View group members"
                          }
                          onClick={() =>
                            openManageModal({
                              id: g.group_id,
                              name: g.group_name,
                              role: g.role,
                            })
                          }
                        >
                          <img src={CheckJoinIcon} alt="Manage members" />
                        </button>

                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() =>
                            setChatGroup({
                              id: g.group_id,
                              name: g.group_name,
                            })
                          }
                        >
                          Chat
                        </button>

                        <button
                          className="btn btn-ghost"
                          type="button"
                          onClick={() => {
                            setScheduleGroup({
                              id: g.group_id,
                              name: g.group_name,
                            });
                            setShowScheduleModal(true);
                          }}
                        >
                          Schedule
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Right side: Create/Search tabs */}
        <section className="section" style={{ marginBottom: 0 }}>
          <div className="card">
            {/* REAL tabs */}
            <div className="tabs" style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                className={
                  "tab-btn" + (activeTab === "create" ? " tab-btn-active" : "")
                }
                onClick={() => setActiveTab("create")}
              >
                Create group
              </button>
              <button
                type="button"
                className={
                  "tab-btn" + (activeTab === "search" ? " tab-btn-active" : "")
                }
                onClick={() => setActiveTab("search")}
              >
                Search groups
              </button>
            </div>

            {activeTab === "create" && (
              <div>
                <div className="card-title" style={{ fontSize: "1.05rem" }}>
                  Create a Group
                </div>
                <form
                  onSubmit={handleCreateGroup}
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    marginTop: "0.75rem",
                  }}
                >
                  <div>
                    <label>
                      Name
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </label>
                  </div>

                  <div>
                    <label>
                      Course ID
                      <input
                        type="number"
                        value={courseId}
                        onChange={(e) => setCourseId(Number(e.target.value))}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <label style={{ flex: "0 0 150px" }}>
                      Max members
                      <input
                        type="number"
                        value={newMaxMembers}
                        onChange={(e) => setNewMaxMembers(e.target.value)}
                        min={1}
                      />
                    </label>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newIsPrivate}
                        onChange={(e) => setNewIsPrivate(e.target.checked)}
                      />
                      Private group
                    </label>
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary">
                      Create group
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "search" && (
              <div>
                <div className="card-title" style={{ fontSize: "1.05rem" }}>
                  Public Groups for Course {courseId}
                </div>
                <p
                  style={{
                    margin: "0.25rem 0 0.75rem",
                    fontSize: "0.9rem",
                    opacity: 0.75,
                  }}
                >
                  Filter and discover public groups by course ID.
                </p>

               <div
                className="toolbar-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginBottom: "0.75rem",
                }}
              >
                {/* Left: course filter */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <label>
                    Course ID
                    <input
                      type="number"
                      value={courseId}
                      onChange={(e) => setCourseId(Number(e.target.value))}
                    />
                  </label>
                  <button
                    className="btn btn-primary"
                    onClick={loadData}
                    type="button"
                  >
                    Refresh
                  </button>
                </div>

                {/* Right: join-by-code */}
                <form
                  onSubmit={handleJoinByCode}
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                    Or join a private group by code:
                  </span>
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    placeholder="Enter invite code"
                    style={{ width: "160px" }}
                  />
                  <button
                    type="submit"
                    className="btn btn-ghost"
                    disabled={inviteJoinLoading}
                  >
                    {inviteJoinLoading ? "Joining..." : "Join with code"}
                  </button>
                </form>
              </div>


                {loading && <p>Loading groups...</p>}
                {error && <p className="error-text">{error}</p>}

               {visiblePublicGroups.length === 0 ? (
                  <p>No public groups found.</p>
                ) : (
                  <div className="scroll-list">
                    <ul className="clean-list">
                      {visiblePublicGroups.map((g) => (

                        <li key={g.group_id} className="group-row">
                          <div className="group-main">
                            <span className="group-name">{g.group_name}</span>
                            <span className="group-meta">
                              {g.members}/{g.max_members} members
                              {g.last_session &&
                                ` · last session: ${g.last_session}`}
                            </span>
                          </div>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={() => handleJoin(g.group_id)}
                          >
                            Join
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* -------- Schedule session modal -------- */}
      {showScheduleModal && scheduleGroup && (
        <div
          className="modal-backdrop"
          onClick={() => setShowScheduleModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Schedule session — {scheduleGroup.name}</h2>

            <form
              onSubmit={handleCreateSession}
              style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}
            >
              <div>
                <label>
                  Date
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <label>
                  Start time
                  <input
                    type="time"
                    value={sessionStart}
                    onChange={(e) => setSessionStart(e.target.value)}
                  />
                </label>
                <label>
                  End time
                  <input
                    type="time"
                    value={sessionEnd}
                    onChange={(e) => setSessionEnd(e.target.value)}
                  />
                </label>
              </div>

              <div>
                <label>
                  Location
                  <input
                    type="text"
                    placeholder="Discord VC, Zoom, Library..."
                    value={sessionLocation}
                    onChange={(e) => setSessionLocation(e.target.value)}
                  />
                </label>
              </div>

              <div>
                <label>
                  Notes (optional)
                  <textarea
                    rows={3}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                  />
                </label>
              </div>

              {error && (
                <p className="error-text" style={{ marginTop: "0.25rem" }}>
                  {error}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleGroup(null);
                    resetSessionForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------- Manage members modal -------- */}
      {showManageModal && manageGroup && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowManageModal(false);
            setManageGroup(null);
            setManageRequests([]);
            setManageMembers([]);
            setManageError("");
            setInviteCodeInfo(null);
            setInviteCodeError("");
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Manage members — {manageGroup.name}</h2>

            {/* Tabs: owner gets Requests + Members, others see just Members */}
            {manageGroup.role === "owner" ? (
              <div className="tabs" style={{ marginBottom: "1rem" }}>
                <button
                  type="button"
                  className={
                    "tab-btn" +
                    (manageTab === "requests" ? " tab-btn-active" : "")
                  }
                  onClick={() => {
                    setManageTab("requests");
                    loadManageData(manageGroup.id, "requests", manageGroup.role);
                  }}
                >
                  Join requests
                </button>
                <button
                  type="button"
                  className={
                    "tab-btn" +
                    (manageTab === "members" ? " tab-btn-active" : "")
                  }
                  onClick={() => {
                    setManageTab("members");
                    loadManageData(manageGroup.id, "members", manageGroup.role);
                  }}
                >
                  Members
                </button>
              </div>
            ) : (
              <p
                style={{
                  marginTop: "0.25rem",
                  marginBottom: "0.75rem",
                  fontSize: "0.9rem",
                  opacity: 0.8,
                }}
              >
                Viewing members of this group.
              </p>
            )}

            {manageLoading && <p>Loading...</p>}
            {manageError && (
              <p className="error-text" style={{ marginBottom: "0.5rem" }}>
                {manageError}
              </p>
            )}

            {/* Pending requests tab (owner only) */}
            {manageGroup.role === "owner" &&
              manageTab === "requests" &&
              !manageLoading && (
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    Pending join requests
                  </div>

                  {manageRequests.length === 0 ? (
                    <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                      No pending requests right now.
                    </p>
                  ) : (
                    <ul className="clean-list" style={{ margin: 0 }}>
                      {manageRequests.map((r) => (
                        <li
                          key={r.user_id}
                          className="group-row"
                          style={{ alignItems: "center" }}
                        >
                          <div className="group-main">
                            <span className="group-name">
                              {r.full_name || `User ${r.user_id}`}
                            </span>
                            <span className="group-meta">
                              Requested at:{" "}
                              {r.request_date ? r.request_date : "—"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveRequest(r.user_id)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleRejectRequest(r.user_id)}
                            >
                              Reject
                            </button>
                          </div>
                        </li>
                      ))}

                    </ul>
                  )}
                </div>
              )}

            {/* Members tab */}
            {manageTab === "members" && !manageLoading && (
              <div
                style={{ marginTop: manageGroup.role === "owner" ? "0.5rem" : 0 }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    fontSize: "0.95rem",
                  }}
                >
                  Group members
                </div>

                {manageMembers.length === 0 ? (
                  <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    No members found.
                  </p>
                ) : (
                  <ul className="clean-list" style={{ margin: 0 }}>
                    {manageMembers.map((m) => (
                      <li
                        key={m.user_id}
                        className="group-row"
                        style={{ alignItems: "center" }}
                      >
                        <div className="group-main">
                          <span className="group-name">
                            {m.user_name || `User ${m.user_id}`}
                          </span>
                          <span className="group-meta">
                            role: {m.role}
                            {m.joined_at ? ` · joined at ${m.joined_at}` : ""}
                          </span>
                        </div>

                        {manageGroup.role === "owner" &&
                          m.user_id !== userId && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleKickMember(m.user_id)}
                            >
                              Kick
                            </button>
                          )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {manageGroup.role === "owner" && (
              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid rgba(148,163,184,0.35)",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                    fontSize: "0.95rem",
                  }}
                >
                  Private invite code
                </div>
                <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.5rem" }}>
                  Generate a short-lived code you can share with classmates to join this
                  private group.
                </p>

                {inviteCodeError && (
                  <p className="error-text" style={{ marginBottom: "0.5rem" }}>
                    {inviteCodeError}
                  </p>
                )}

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleGenerateInviteCode}
                  disabled={inviteCodeLoading}
                >
                  {inviteCodeLoading ? "Generating..." : "Generate 10-minute code"}
                </button>

                {inviteCodeInfo && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.9rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px dashed rgba(148,163,184,0.7)",
                      background: "rgba(15,23,42,0.6)",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      Code:{" "}
                      <span style={{ fontFamily: "monospace", letterSpacing: "0.12em" }}>
                        {inviteCodeInfo.invite_code}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                      Expires at: {inviteCodeInfo.expires_at}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setShowManageModal(false);
                  setManageGroup(null);
                  setManageRequests([]);
                  setManageMembers([]);
                  setManageError("");
                  setInviteCodeInfo(null);
                  setInviteCodeError("");
                }}
              >
                Close
              </button>

            </div>
          </div>
        </div>
      )}

      {/* -------- Upcoming sessions calendar modal -------- */}
      {showCalendarModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCalendarModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upcoming sessions calendar</h2>

            <div className="modal-body-scroll">
              {upcomingSessions.length === 0 ? (
                <p>No upcoming sessions.</p>
              ) : (
                <>
                  <div className="calendar-header">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => changeMonth(-1)}
                    >
                      ‹
                    </button>
                    <span className="calendar-month-label">
                      {calendarMonthLabel}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => changeMonth(1)}
                    >
                      ›
                    </button>
                  </div>

                  <div className="calendar-grid">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <div key={d} className="calendar-weekday">
                          {d}
                        </div>
                      )
                    )}

                    {calendarCells.map((cell, idx) =>
                      cell === null ? (
                        <div key={idx} className="calendar-day empty" />
                      ) : (
                        <button
                          key={idx}
                          type="button"
                          className={[
                            "calendar-day",
                            cell.hasEvents ? "calendar-day-has-events" : "",
                            cell.dateStr === selectedCalendarDate
                              ? "calendar-day-selected"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() =>
                            setSelectedCalendarDate(cell.dateStr)
                          }
                        >
                          <span className="calendar-day-number">
                            {cell.day}
                          </span>
                          {cell.hasEvents && <span className="calendar-dot" />}
                        </button>
                      )
                    )}
                  </div>

                  <div className="calendar-events">
                    {selectedCalendarDate && selectedEvents.length > 0 ? (
                      <>
                        <div className="calendar-events-header">
                          Sessions on {selectedCalendarDate}
                        </div>
                        <ul className="clean-list">
                          {selectedEvents.map((s, i) => (
                            <li key={i} className="calendar-event-row">
                              <div className="calendar-event-title">
                                {s.group_name}
                              </div>
                              <div className="calendar-event-meta">
                                {s.start_time?.slice(0, 5)}–
                                {s.end_time?.slice(0, 5)} · {s.location}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p
                        style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}
                      >
                        No sessions on this day.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowCalendarModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- Toast -------- */}
      {showToast && (
        <div
          className={[
            "toast",
            "toast-show",
            toastType === "error" ? "toast-error" : "toast-success",
          ].join(" ")}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}


