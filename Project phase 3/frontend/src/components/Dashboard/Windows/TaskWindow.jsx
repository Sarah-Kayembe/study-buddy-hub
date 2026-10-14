// TaskWindow.jsx
// Focus Den task panel with tag colors

import React, { useState } from "react";
import AddTaskModal from "./AddTaskModal";

import { API_BASE } from "../../../api/base";

const API_BASE_URL = `${API_BASE}/api/focus`;

export default function TaskWindow({ tasks, onClose, onRefreshData }) {
  const [localTasks, setLocalTasks] = useState(Array.isArray(tasks) ? tasks : []);
  const [syncedTasks, setSyncedTasks] = useState(tasks);
  const [showAddModal, setShowAddModal] = useState(false);

  // Sync props → local state whenever the parent passes a new task list
  if (tasks !== syncedTasks) {
    setSyncedTasks(tasks);
    setLocalTasks(Array.isArray(tasks) ? tasks : []);
  }

  const completedCount = localTasks.filter(
    (t) => t.status === "done"
  ).length;

  // --------------------------------------------------
  // Toggle task status
  // --------------------------------------------------
  async function handleToggleTask(task) {
    const taskId = task.task_id;
    if (!taskId) return;

    const newStatus =
      task.status === "done" ? "in_progress" : "done";

    try {
      const res = await fetch(
        `${API_BASE_URL}/tasks/${taskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.task_id === taskId
              ? { ...t, status: newStatus }
              : t
          )
        );
        onRefreshData();
      }
    } catch (err) {
      console.error("Task toggle failed:", err);
    }
  }

  // --------------------------------------------------
  // Delete task
  // --------------------------------------------------
  async function handleDeleteTask(taskId) {
    if (!taskId) return;
    if (!window.confirm("Delete this task?")) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/tasks/${taskId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();
      if (data.success) {
        setLocalTasks((prev) =>
          prev.filter((t) => t.task_id !== taskId)
        );
        onRefreshData();
      }
    } catch (err) {
      console.error("Task delete failed:", err);
    }
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <>
      <div className="den-window task-window-small">
        <div className="window-header">
          <span className="window-title">
            Completed: {completedCount} / {localTasks.length}
          </span>
          <button onClick={onClose} className="close-btn">
            ✖
          </button>
        </div>

        <div className="window-content task-list-content">
          {localTasks.length === 0 ? (
            <div className="task-empty-state">
              <p>No tasks yet.</p>
            </div>
          ) : (
            localTasks.map((task) => (
              <div
                key={task.task_id}
                className={`task-row ${
                  task.status === "done" ? "done" : ""
                }`}
              >
                {/* Checkbox */}
                <button
                  className="task-checkbox"
                  onClick={() => handleToggleTask(task)}
                >
                  {task.status === "done" && (
                    <span className="task-checkbox-tick">✓</span>
                  )}
                </button>

                {/* Task content */}
                <div className="task-main">
                  <p className="task-title-text">
                    {task.title}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                      fontSize: "0.7rem",
                      color: "rgba(229,231,235,0.8)",
                    }}
                  >
                    {/* Tag color dot */}
                    {task.color_hex && (
                      <span
                        title={task.tag_name}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: task.color_hex,
                          boxShadow: `0 0 6px ${task.color_hex}`,
                          border: "1px solid rgba(255,255,255,0.6)",
                        }}
                      />
                    )}

                    {/* Tag name */}
                    {task.tag_name && (
                      <span style={{ fontWeight: 600 }}>
                        {task.tag_name}
                      </span>
                    )}

                    {/* Due date */}
                    {task.due_date && (
                      <span>
                        • Due{" "}
                        {new Date(
                          task.due_date
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  className="task-delete-btn"
                  onClick={() =>
                    handleDeleteTask(task.task_id)
                  }
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="task-add-footer">
          <button
            className="task-add-button"
            onClick={() => setShowAddModal(true)}
          >
            + Add Task
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onTaskCreated={() => {
            setShowAddModal(false);
            onRefreshData();
          }}
        />
      )}
    </>
  );
}
