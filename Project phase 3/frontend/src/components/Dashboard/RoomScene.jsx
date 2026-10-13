import React from 'react';
import chillBG from "../../assets/Chill_background.webp"; 
import focusBG from "../../assets/focus_background.webp"; 
// adjust the path if RoomScene.jsx is in a different folder level

const BACKGROUNDS = {
    focus: focusBG,
    break: chillBG,

    // LOCAL FILE for Chill Mode
    chill: chillBG
};

export default function RoomScene({ mode }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
       <img 
        src={BACKGROUNDS[mode] || BACKGROUNDS.focus} 
        alt={`${mode} mode`}
        className="spirit-room-image" 
       />

       {/* Dark Overlay */}
       <div 
         style={{ 
           position: 'absolute', 
           inset: 0, 
           background: 'rgba(0,0,0,0.2)' 
         }} 
       />
    </div>
  );
}
