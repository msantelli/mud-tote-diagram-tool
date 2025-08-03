import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  
  if (isOnline) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: '#ff9800',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 'bold',
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }}>
      📡 Offline Mode
    </div>
  );
};

export const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  
  if (!isInstallable || isInstalled || isDismissed) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#2196f3',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '400px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Install MUD & TOTE Tool
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Install this app for offline access and a better experience
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={promptInstall}
          style={{
            backgroundColor: 'white',
            color: '#2196f3',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Install
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.5)',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
};

export const PWAStatus: React.FC = () => {
  const { isInstalled, isOnline } = usePWA();
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      display: 'flex',
      gap: '8px',
      zIndex: 1000
    }}>
      {isInstalled && (
        <div style={{
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          📱 Installed
        </div>
      )}
      <div style={{
        backgroundColor: isOnline ? '#4caf50' : '#ff9800',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {isOnline ? '🌐 Online' : '📡 Offline'}
      </div>
    </div>
  );
};