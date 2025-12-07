// frontend/src/api/studygroups.js

const API_BASE = "http://127.0.0.1:8001";

// small helper to standardize fetch + error handling
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data.detail || "Request failed";
    throw new Error(msg);
  }

  return data;
}

/* -----------------------------
   Existing functions
----------------------------- */

export async function fetchPublicGroups(courseId, limit = 20) {
  const params = new URLSearchParams({
    course_id: String(courseId),
    limit: String(limit),
  });

  return apiFetch(`/groups/public?${params.toString()}`);
}

export async function fetchMyGroups(userId) {
  const params = new URLSearchParams({
    user_id: String(userId),
  });

  return apiFetch(`/groups/mine?${params.toString()}`);
}

export async function createGroup(payload) {
  // payload:
  // {
  //   group_name,
  //   max_members,
  //   course_id,
  //   is_private,
  //   creator_user_id
  // }
  return apiFetch("/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// NOTE: after your backend change, this now creates a JOIN REQUEST
// instead of instantly adding the member. The exact response body
// comes from /groups/<id>/join (status/message fields).
export async function joinGroup(groupId, userId) {
  return apiFetch(`/groups/${groupId}/join`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function createSession(groupId, payload) {
  // payload: { session_date, start_time, end_time, location, notes? }
  return apiFetch(`/groups/${groupId}/sessions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchUpcomingSessions(userId, limit = 50) {
  const params = new URLSearchParams({
    user_id: String(userId),
    limit: String(limit),
  });

  return apiFetch(`/groups/sessions/upcoming?${params.toString()}`);
}

/* -----------------------------
   NEW: Join request owner APIs
----------------------------- */

// GET /groups/:id/requests?owner_id=...
// returns: [{ user_id, full_name, request_date }, ...]
export async function fetchPendingJoinRequests(groupId, ownerId) {
  const params = new URLSearchParams({
    owner_id: String(ownerId),
  });

  return apiFetch(`/groups/${groupId}/requests?${params.toString()}`);
}

// POST /groups/:id/requests/:user_id/approve
// body: { owner_id }
export async function approveJoinRequest(groupId, targetUserId, ownerId) {
  return apiFetch(`/groups/${groupId}/requests/${targetUserId}/approve`, {
    method: "POST",
    body: JSON.stringify({ owner_id: ownerId }),
  });
}

// POST /groups/:id/requests/:user_id/reject
// body: { owner_id }
export async function rejectJoinRequest(groupId, targetUserId, ownerId) {
  return apiFetch(`/groups/${groupId}/requests/${targetUserId}/reject`, {
    method: "POST",
    body: JSON.stringify({ owner_id: ownerId }),
  });
}

export async function fetchGroupMembers(groupId) {
  const res = await fetch(`${API_BASE}/groups/${groupId}/members`);

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to load members");
  }

  return res.json();
}

export async function kickMember(groupId, userId, ownerId) {
  const res = await fetch(
    `${API_BASE}/groups/${groupId}/members/${userId}/kick`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner_id: ownerId }),
    }
  );

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to remove member");
  }

  return res.json();
}


export async function generateInviteCode(groupId, ownerId) {
  return apiFetch(`/groups/${groupId}/invite-code`, {
    method: "POST",
    body: JSON.stringify({ owner_id: ownerId }),
  });
}

export async function joinByInviteCode(inviteCode, userId) {
  return apiFetch(`/groups/join-with-code`, {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      invite_code: inviteCode,
    }),
  });
}

export async function searchCourses(query, limit = 8) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  // Use the same API_BASE + apiFetch as your other calls
  return apiFetch(`/courses/search?${params.toString()}`);
}

