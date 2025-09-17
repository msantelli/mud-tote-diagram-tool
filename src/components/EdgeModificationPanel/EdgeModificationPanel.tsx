import React from 'react';
import { Modal } from '../Modal';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setSelectedEdgeForModification } from '../../store/uiSlice';
import { updateEdge, deleteEdge as removeEdge, saveToHistory } from '../../store/diagramSlice';
import { getAvailableEdgeTypes, getEdgeColor, getEdgeTypeDescription } from '../../utils/edgeUtils';
import type { Edge } from '../../types/all';

interface EdgeModificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EdgeModificationPanel: React.FC<EdgeModificationPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const selectedEdgeForModification = useAppSelector(state => state.ui.selectedEdgeForModification);
  const diagramMode = useAppSelector(state => state.ui.diagramMode);
  const autoDetectEdges = useAppSelector(state => state.ui.autoDetectEdges);
  const currentDiagram = useAppSelector(state => state.diagram.currentDiagram);
  
  const edge = currentDiagram?.edges.find(e => e.id === selectedEdgeForModification);
  const sourceNode = currentDiagram?.nodes.find(n => n.id === edge?.source);
  const targetNode = currentDiagram?.nodes.find(n => n.id === edge?.target);

  const updateEdgeType = (newType: Edge['type']) => {
    if (!edge) return;
    
    // Save state before updating edge type
    dispatch(saveToHistory());
    
    dispatch(updateEdge({
      id: edge.id,
      updates: { type: newType }
    }));
  };

  const toggleEdgeResultant = (isResultant: boolean) => {
    if (!edge) return;
    
    // Save state before toggling resultant
    dispatch(saveToHistory());
    
    dispatch(updateEdge({
      id: edge.id,
      updates: { isResultant }
    }));
  };

  const deleteEdge = () => {
    if (!edge) return;
    
    dispatch(saveToHistory());
    dispatch(removeEdge(edge.id));
    dispatch(setSelectedEdgeForModification(null));
    onClose();
  };

  const handleClose = () => {
    dispatch(setSelectedEdgeForModification(null));
    onClose();
  };

  if (!edge) return null;

  const availableEdgeTypes = getAvailableEdgeTypes(diagramMode, sourceNode?.type, targetNode?.type, autoDetectEdges);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Modify Edge: ${edge.type}`}
      maxWidth="400px"
    >
      {sourceNode && targetNode && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          {sourceNode.label} → {targetNode.label}
        </div>
      )}
      
      {/* Edge Type Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#666' }}>
          Edge Type:
        </label>
        <div style={{ display: 'grid', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
          {availableEdgeTypes.map(edgeType => (
            <button
              key={edgeType}
              onClick={() => updateEdgeType(edgeType)}
              style={{
                padding: '8px 12px',
                border: `2px solid ${edge.type === edgeType ? '#2196F3' : '#ddd'}`,
                background: edge.type === edgeType ? '#E3F2FD' : '#f9f9f9',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: edge.type === edgeType ? 'bold' : 'normal'
              }}
            >
              <div style={{ color: getEdgeColor(edgeType), fontWeight: 'bold' }}>{edgeType}</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                {getEdgeTypeDescription(edgeType)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Resultant Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: 'pointer',
          padding: '12px',
          border: '2px solid #ddd',
          borderRadius: '6px',
          background: edge.isResultant ? '#E8F5E8' : '#f9f9f9',
          transition: 'all 0.2s ease'
        }}>
          <input
            type="checkbox"
            checked={edge.isResultant || false}
            onChange={(e) => toggleEdgeResultant(e.target.checked)}
            style={{ 
              width: '18px', 
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontWeight: 'bold', color: '#666' }}>
            Resultant Relationship
          </span>
        </label>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', marginLeft: '26px' }}>
          {edge.isResultant ? 
            'This relationship is derived/indirect (dotted line)' : 
            'This relationship is direct (solid line)'}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
        <button
          onClick={deleteEdge}
          style={{
            padding: '10px 16px',
            border: '2px solid #f44336',
            background: '#ffebee',
            color: '#f44336',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🗑️ Delete
        </button>
        <button
          onClick={handleClose}
          style={{
            padding: '10px 16px',
            border: '2px solid #2196F3',
            background: '#2196F3',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Done
        </button>
      </div>
    </Modal>
  );
};