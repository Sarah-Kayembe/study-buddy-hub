// AddTaskModal.jsx
// Spirit City — Task creation modal (DB-accurate, enhanced)

import React, { useEffect, useState } from "react";

import { API_BASE } from "../../../api/base";

const API_BASE_URL = `${API_BASE}/api/focus`;

export default function AddTaskModal({ onClose, onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  // REQUIRED
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // OPTIONAL
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [topicId, setTopicId] = useState("");

  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // --------------------------------------------------
  // Fetch tags (REQUIRED)
  // --------------------------------------------------
  useEffect(() => {
    fetch(`${API_BASE_URL}/tags`)
      .then((res) => res.json())
      .then(setTags)
      .catch(console.error);
  }, []);

  // --------------------------------------------------
  // Fetch courses (OPTIONAL)
  // --------------------------------------------------
  useEffect(() => {
    fetch(`${API_BASE_URL}/courses`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setCourses(data))
      .catch(() => setCourses([]));
  }, []);

  // --------------------------------------------------
  // Fetch topics when course selected
  // --------------------------------------------------
  useEffect(() => {
    if (!courseId) return;

    fetch(`${API_BASE_URL}/topics?course_id=${courseId}`)
      .then((res) => res.json())
      .then(setTopics)
      .catch(console.error);
  }, [courseId]);

  // --------------------------------------------------
  // Save Task
  // --------------------------------------------------
  async function handleSaveTask() {
    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    if (!selectedTag) {
      alert("Please select a tag.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          due_date: dueDate ? `${dueDate} 00:00:00` : null,
          tag_id: selectedTag.tag_id,
          course_id: courseId || null,
          topic_id: topicId || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onTaskCreated();
      } else {
        alert(data.error || "Failed to create task.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving task.");
    }

    setSaving(false);
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="spirit-window-overlay">
      <div className="spirit-window" style={{ width: 460 }}>
        <div className="window-header">
          <span className="window-title">Add New Task</span>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="window-content">

          {/* TITLE */}
          <label className="task-label">Task Title</label>
          <input
            className="spirit-input"
            placeholder="What do you want to work on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* TAGS (REQUIRED) */}
          <label className="task-label" style={{ marginTop: 16 }}>
            Tag (required)
          </label>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {tags.map((tag) => {
              const active = selectedTag?.tag_id === tag.tag_id;

              return (
                <div
                  key={tag.tag_id}
                  style={{ textAlign: "center", cursor: "pointer" }}
                  onClick={() => setSelectedTag(tag)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: tag.color_hex,
                      border: active
                        ? "3px solid white"
                        : "2px solid rgba(255,255,255,0.4)",
                      boxShadow: active
                        ? `0 0 16px ${tag.color_hex}`
                        : "0 0 6px rgba(0,0,0,0.6)",
                      marginBottom: 4,
                    }}
                  />
                  <div
                    style={{
                      fontSize: "0.65rem",
                      opacity: active ? 1 : 0.7,
                    }}
                  >
                    {tag.tag_name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SELECTED TAG PREVIEW */}
          {selectedTag && (
            <div
              style={{
                marginTop: 8,
                fontSize: "0.75rem",
                opacity: 0.85,
              }}
            >
              Selected: <strong>{selectedTag.tag_name}</strong>
            </div>
          )}

          {/* COURSE (OPTIONAL) */}
          <label className="task-label" style={{ marginTop: 16 }}>
            Course (optional)
          </label>
          <select
            className="spirit-input"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setTopics([]);
              setTopicId("");
            }}
          >
            <option value="">— No course —</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_name}
              </option>
            ))}
          </select>

          {/* TOPIC (OPTIONAL) */}
          {courseId && (
            <>
              <label className="task-label" style={{ marginTop: 10 }}>
                Topic (optional)
              </label>
              <select
                className="spirit-input"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
              >
                <option value="">— No topic —</option>
                {topics.map((t) => (
                  <option key={t.topic_id} value={t.topic_id}>
                    {t.topic_name}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* DUE DATE */}
          <label className="task-label" style={{ marginTop: 16 }}>
            Due Date (optional)
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.6)",
              borderRadius: 10,
              padding: "10px 12px",
              boxShadow: "0 0 14px rgba(14, 165, 233,0.25)",
            }}
          >
            <span style={{ opacity: 0.7 }}>📅</span>
            <input
              type="date"
              className="spirit-input"
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
              }}
              min={today}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* SAVE */}
          <button
            className="spirit-btn-primary"
            style={{ marginTop: 22 }}
            onClick={handleSaveTask}
            disabled={saving}
          >
            {saving ? "Saving..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
