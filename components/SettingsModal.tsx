'use client';
import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  setSlippage: (val: number) => void;
  isPrivacyMode: boolean;
  setPrivacyMode: (val: boolean) => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
}

export const SettingsModal = ({ isOpen, onClose, slippage, setSlippage, isPrivacyMode, setPrivacyMode, audioEnabled, setAudioEnabled }: SettingsModalProps) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }} onClick={onClose}>
      <div style={{ width: '400px', backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Settings</h2>

        {/* Slippage */}
        <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#a1a1aa', fontSize: '14px', display: 'block', marginBottom: '12px' }}>Max Slippage</label>
            <div style={{ display: 'flex', gap: '8px' }}>
                {[0.1, 0.5, 1.0].map(val => (
                    <button key={val} onClick={() => setSlippage(val)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #27272a', backgroundColor: slippage === val ? '#3b82f6' : 'transparent', color: slippage === val ? 'white' : '#71717a', cursor: 'pointer' }}>
                        {val}%
                    </button>
                ))}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', backgroundColor: 'transparent', border: '1px solid #27272a', borderRadius: '6px', color: 'white' }}>
                   Custom
                </div>
            </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white' }}>Audio Effects</span>
                <input type="checkbox" checked={audioEnabled} onChange={(e) => setAudioEnabled(e.target.checked)} style={{ accentColor: '#3b82f6', transform: 'scale(1.2)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white' }}>Privacy Mode (Hide Balance)</span>
                <input type="checkbox" checked={isPrivacyMode} onChange={(e) => setPrivacyMode(e.target.checked)} style={{ accentColor: '#3b82f6', transform: 'scale(1.2)' }} />
            </div>
        </div>

        <button onClick={onClose} style={{ width: '100%', marginTop: '32px', padding: '12px', backgroundColor: '#27272a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );
};