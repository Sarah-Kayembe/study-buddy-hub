import React, { useState, useEffect } from 'react';

import { API_BASE } from "../../../api/base";

const API_BASE_URL = `${API_BASE}/api/focus`;

export default function LeaderboardWindow({ onClose }) {
  const [leaders, setLeaders] = useState([]);
  const [period, setPeriod] = useState('weekly'); // 'daily', 'weekly', 'all_time'
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Leaderboard Data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/leaderboard?period=${period}`, { credentials: "include" });
        if (res.ok) {
            const data = await res.json();
            setLeaders(data || []);
        }
      } catch (e) {
        console.error("Leaderboard error", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  return (
    // The Main Window Container
    <div className="spirit-window" style={{ width: '400px', height: '600px' }}>
        
        {/* Header */}
        <div className="window-header">
            <span className="window-title" style={{ color: '#facc15' }}>🏆 Top Students</span>
            <button onClick={onClose} className="close-btn">✖</button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '10px', background: '#141218', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {['daily', 'weekly', 'all_time'].map((p) => (
                <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                        background: period === p ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: period === p ? 'white' : '#888',
                        transition: 'all 0.2s'
                    }}
                >
                    {p.replace('_', ' ')}
                </button>
            ))}
        </div>

        {/* Leaderboard List */}
        <div className="window-content custom-scrollbar" style={{ padding: '15px' }}>
            {isLoading ? (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>Loading...</div>
            ) : leaders.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>No data for this period.</div>
            ) : (
                leaders.map((user, index) => (
                    <div 
                        key={index} 
                        style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '15px', 
                            padding: '12px', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '12px', 
                            marginBottom: '8px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        {/* Rank Badge */}
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '0.9rem',
                            background: index === 0 ? '#eab308' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : '#333',
                            color: index <= 2 ? 'black' : '#ccc'
                        }}>
                            {index + 1}
                        </div>
                        
                        {/* User Info */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>
                                {user.username}
                            </div>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#888', fontWeight: 'bold' }}>
                                {user.total_sessions} Sessions
                            </div>
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#818cf8', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem' }}>
                                {user.total_focus_min}m
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
}