// jacob craig

import { API_BASE } from "./base";

export async function getChatMessages(groupId, limit = 50) {
  const res = await fetch(`${API_BASE}/groups/${groupId}/chat?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load chat");
  return res.json();
}

export async function sendChatMessage(groupId, userId, content) {
  const res = await fetch(`${API_BASE}/groups/${groupId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, content }),
  });

  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

