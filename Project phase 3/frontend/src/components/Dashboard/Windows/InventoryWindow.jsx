import React from 'react';

// Starter Items (In a real app, you would fetch this via GET /api/focus/inventory)
// We match these IDs to what the City Builder expects.
const DEMO_ITEMS = [
    { item_id: 1, name: 'Stone Wall', icon: '🧱' },
    { item_id: 2, name: 'Flower Bush', icon: '🌸' },
    { item_id: 3, name: 'Wooden Bench', icon: '🪑' },
    { item_id: 4, name: 'Street Lamp', icon: '💡' },
    { item_id: 5, name: 'Fountain', icon: '⛲' },
    { item_id: 6, name: 'Tree', icon: '🌳' },
    { item_id: 7, name: 'Books', icon: '📚' },
    { item_id: 8, name: 'Coffee Cart', icon: '☕' },
];

export default function InventoryWindow({ onClose, onSelectItem }) {
  return (
    // The Main Window Container
    <div className="den-window" style={{ width: '500px', height: '450px' }}>
        
        {/* Header */}
        <div className="window-header">
            <span className="window-title" style={{ color: '#fcd34d' }}>🎒 Inventory</span>
            <button onClick={onClose} className="close-btn">✖</button>
        </div>

        {/* Inventory Grid */}
        <div className="window-content custom-scrollbar" style={{ padding: '20px' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '15px' 
            }}>
                {DEMO_ITEMS.map((item) => (
                    <button 
                        key={item.item_id}
                        onClick={() => {
                            onSelectItem(item);
                            onClose(); // Close inventory to switch to "Placement Mode"
                        }}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            aspectRatio: '1/1', // Makes them perfect squares
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            color: 'white'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)'; // Indigo hover
                            e.currentTarget.style.borderColor = '#0284c7';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.3))' }}>
                            {item.icon}
                        </span>
                        <span style={{ 
                            fontSize: '0.65rem', 
                            textTransform: 'uppercase', 
                            fontWeight: 'bold', 
                            color: '#9ca3af' 
                        }}>
                            {item.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
        
        {/* Footer Hint */}
        <div style={{ padding: '15px', background: '#020617', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#666' }}>
                Select an item to place it in StudyVille.
            </span>
        </div>
    </div>
  );
}