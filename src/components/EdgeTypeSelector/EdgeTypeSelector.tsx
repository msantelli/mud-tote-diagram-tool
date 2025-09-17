import React from 'react';
import { Modal } from '../Modal';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearPendingEdge } from '../../store/uiSlice';
import { addEdge, saveToHistory } from '../../store/diagramSlice';
import { getAvailableEdgeTypes, getEdgeColor, getEdgeTypeDescription } from '../../utils/edgeUtils';
import type { Edge } from '../../types/all';

interface EdgeTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EdgeTypeSelector: React.FC<EdgeTypeSelectorProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const diagramMode = useAppSelector(state => state.ui.diagramMode);
  const autoDetectEdges = useAppSelector(state => state.ui.autoDetectEdges);
  const pendingEdge = useAppSelector(state => state.ui.pendingEdge);

  const handleEdgeTypeSelect = (edgeType: Edge['type']) => {
    if (pendingEdge) {
      // Save state before creating edge
      dispatch(saveToHistory());
      
      const newEdge = {
        source: pendingEdge.source,
        target: pendingEdge.target,
        type: edgeType
      };
      
      dispatch(addEdge(newEdge));
      dispatch(clearPendingEdge());
      onClose();
    }
  };

  const handleCancel = () => {
    dispatch(clearPendingEdge());
    onClose();
  };

  const availableEdgeTypes = getAvailableEdgeTypes(diagramMode, undefined, undefined, autoDetectEdges);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Select Edge Type"
      maxWidth="400px"
    >
      <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
        {availableEdgeTypes.map(edgeType => (
          <button
            key={edgeType}
            onClick={() => handleEdgeTypeSelect(edgeType)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e0e0e0',
              background: '#fafafa',
              borderRadius: '6px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              color: getEdgeColor(edgeType),
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.borderColor = getEdgeColor(edgeType);
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#fafafa';
              e.currentTarget.style.borderColor = '#e0e0e0';
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>{edgeType}</div>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
              {getEdgeTypeDescription(edgeType)}
            </div>
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleCancel}
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            background: '#f5f5f5',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};