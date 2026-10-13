import React, { useState } from 'react';

import { API_BASE } from "../../../api/base";

const API_BASE_URL = `${API_BASE}/api/focus`;

// Map emojis to your Database IDs (1-6)
const MOOD_OPTIONS = [
    { id: 1, icon: '😊', label: 'Happy' },
    { id: 2, icon: '😐', label: 'Neutral' },
    { id: 3, icon: '😢', label: 'Sad' },
    { id: 4, icon: '😡', label: 'Angry' },
    { id: 5, icon: '😴', label: 'Tired' },
    { id: 6, icon: '🤯', label: 'Stressed' }
];

export default function MoodWindow({ onClose }) {
  const [submitting, setSubmitting] = useState(false);

  const handleMoodSelect = async (moodId) => {
    setSubmitting(true);
    try {
        const res = await fetch(`${API_BASE_URL}/mood`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mood_id: moodId, note: "Quick Check-in" })
        });

        if (res.ok) {
            // Optional: Play a sound or show a "Saved!" animation here
            onClose(); // Close the window on success
        } else {
            console.error("Failed to save mood");
        }
    } catch (e) {
        console.error("Mood API Error", e);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    // Centered Window Overlay (using your CSS classes)
    <div className="spirit-window-overlay">
        <div className="spirit-window" style={{ width: '350px' }}>
            
            {/* Header */}
            <div className="window-header">
                <span className="window-title">Mood Tracker</span>
                <button onClick={onClose} className="close-btn">✖</button>
            </div>

            {/* Content */}
            <div className="window-content" style={{ textAlign: 'center' }}>
                <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1rem' }}>
                    How are you feeling right now?
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    {MOOD_OPTIONS.map((mood) => (
                        <button 
                            key={mood.id} 
                            onClick={() => handleMoodSelect(mood.id)}
                            disabled={submitting}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '15px 0',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: submitting ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if(!submitting) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>{mood.icon}</div>
                            <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', fontWeight: 'bold' }}>{mood.label}</div>
                        </button>
                    ))}
                </div>

                <p style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                    Tracking your mood helps you understand your focus patterns.
                </p>
            </div>
        </div>
    </div>
  );
}