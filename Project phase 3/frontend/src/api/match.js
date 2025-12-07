// src/api/match.js

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

/**
 * Get the current user's StudyBuddy match profile + courses.
 */
export async function fetchMatchProfile(userId) {
  const params = new URLSearchParams({
    user_id: String(userId),
  });

  return apiFetch(`/match/profile?${params.toString()}`);
}

export async function saveMatchProfile(payload) {
  return apiFetch("/match/profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Upload a profile image file
 * Returns: { url }
 */
export async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/match/profile/image`, {
    method: "POST",
    body: formData,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data.detail || "Upload failed";
    throw new Error(msg);
  }

  return data; // { url }
}

export async function fetchMatchSuggestions(userId, limit = 20) {
  const params = new URLSearchParams({
    user_id: String(userId),
    limit: String(limit),
  });

  return apiFetch(`/match/suggestions?${params.toString()}`);
}

export async function startConversation(requesterUserId, targetUserId) {
  return apiFetch("/dm/start", {
    method: "POST",
    body: JSON.stringify({
      requester_user_id: requesterUserId,
      target_user_id: targetUserId,
    }),
  });
}

export async function fetchDirectMessages(conversationId, limit = 50) {
  const params = new URLSearchParams({
    limit: String(limit),
  });
  return apiFetch(`/dm/${conversationId}/messages?${params.toString()}`);
}

export async function sendDirectMessage(conversationId, senderUserId, content) {
  return apiFetch(`/dm/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      sender_user_id: senderUserId,
      content,
    }),
  });
}

export async function fetchInbox(userId, limit = 50) {
  const params = new URLSearchParams({
    user_id: String(userId),
    limit: String(limit),
  });
  return apiFetch(`/dm/inbox?${params.toString()}`);
}

export async function fetchMessageRequests(userId, limit = 50) {
  const params = new URLSearchParams({
    user_id: String(userId),
    limit: String(limit),
  });
  return apiFetch(`/dm/requests?${params.toString()}`);
}

export async function respondToMessageRequest(requestId, action, userId) {
  const res = await fetch(
    `${API_BASE}/dm/requests/${requestId}/${action}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update message request");
  }
  return res.json();
}






