// src/pages/ChatPage.jsx
import { useEffect, useState, useRef } from "react";
import { getChatMessages, sendChatMessage } from "../api/chat.js";

export default function ChatPage({ groupId, groupName, userId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await getChatMessages(groupId, 50);
      console.log("Loaded messages:", data);
      setMessages(Array.isArray(data) ? [...data].reverse() : []);
    } catch (err) {
      console.error("Error loading chat:", err);
      setError(err.message || "Failed to load chat messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const id = setInterval(loadMessages, 5000); // poll every 5s
    return () => clearInterval(id);
  }, [groupId]);

  // auto-scroll whenever messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setError("");
    try {
      await sendChatMessage(groupId, userId, input.trim());
      setInput("");
      await loadMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    }
  };

  return (
    <div className="app-shell">
      <button className="btn btn-ghost" onClick={onBack}>
        ← Back to Groups
      </button>

      <h1 className="page-title">{groupName}</h1>


      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="card chat-card">
        <div className="chat-log">
          {messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m.message_id} className="chat-message">
                  <div>
                    <strong>User {m.user_id}</strong>: {m.content}
                  </div>
                  <div className="chat-timestamp">
                    {m.sent_time
                      ? new Date(m.sent_time).toLocaleString()
                      : "no timestamp"}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSend} className="chat-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
          />
          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
