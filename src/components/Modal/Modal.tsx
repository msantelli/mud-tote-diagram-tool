import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '400px',
  zIndex = 2000
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          maxWidth,
          minWidth: '300px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px',
              borderRadius: '4px'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#f0f0f0'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = 'none'}
            title="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};