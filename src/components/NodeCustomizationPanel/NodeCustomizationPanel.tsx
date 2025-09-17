import React from 'react';
import { Modal } from '../Modal';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setSelectedNodeForCustomization } from '../../store/uiSlice';
import { updateNode, deleteNode as removeNode, saveToHistory } from '../../store/diagramSlice';
import { getNodeColors } from '../../utils/nodeUtils';
import type { NodeStyle } from '../../types/all';

interface NodeCustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NodeCustomizationPanel: React.FC<NodeCustomizationPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const selectedNodeForCustomization = useAppSelector(state => state.ui.selectedNodeForCustomization);
  const currentDiagram = useAppSelector(state => state.diagram.currentDiagram);
  
  const node = currentDiagram?.nodes.find(n => n.id === selectedNodeForCustomization);

  const updateNodeStyle = (styleUpdate: Partial<NodeStyle>) => {
    if (!node) return;
    
    // Save state before styling
    dispatch(saveToHistory());
    
    dispatch(updateNode({
      id: node.id,
      updates: {
        style: { ...node.style, ...styleUpdate }
      }
    }));
  };

  const updateNodeLabel = (label: string) => {
    if (!node) return;
    
    // Save state before updating label
    dispatch(saveToHistory());
    
    dispatch(updateNode({
      id: node.id,
      updates: { label }
    }));
  };

  const resetNodeStyle = () => {
    if (!node) return;
    
    // Save state before resetting style
    dispatch(saveToHistory());
    
    dispatch(updateNode({
      id: node.id,
      updates: {
        style: undefined
      }
    }));
  };

  const deleteNode = () => {
    if (!node) return;
    
    dispatch(saveToHistory());
    dispatch(removeNode(node.id));
    dispatch(setSelectedNodeForCustomization(null));
    onClose();
  };

  const handleClose = () => {
    dispatch(setSelectedNodeForCustomization(null));
    onClose();
  };

  if (!node) return null;

  const currentStyle = node.style || { size: 'medium' };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Customize ${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node`}
      maxWidth="480px"
    >
      {/* Label/Caption Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
          Caption:
        </label>
        <input
          type="text"
          value={node.label}
          onChange={(e) => updateNodeLabel(e.target.value)}
          placeholder="Enter node caption..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Size Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
          Size:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['small', 'medium', 'large'] as const).map(size => (
            <button
              key={size}
              onClick={() => updateNodeStyle({ size })}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: `2px solid ${currentStyle.size === size ? '#4CAF50' : '#ddd'}`,
                background: currentStyle.size === size ? '#E8F5E8' : '#f9f9f9',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: currentStyle.size === size ? 'bold' : 'normal'
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
          Background Color:
        </label>
        <input
          type="color"
          value={getNodeColors(node).background}
          onChange={(e) => updateNodeStyle({ backgroundColor: e.target.value })}
          style={{
            width: '100%',
            height: '40px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Border Color */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
          Border Color:
        </label>
        <input
          type="color"
          value={getNodeColors(node).border}
          onChange={(e) => updateNodeStyle({ borderColor: e.target.value })}
          style={{
            width: '100%',
            height: '40px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Text Color */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
          Text Color:
        </label>
        <input
          type="color"
          value={node.style?.textColor || '#000000'}
          onChange={(e) => updateNodeStyle({ textColor: e.target.value })}
          style={{
            width: '100%',
            height: '40px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={resetNodeStyle}
          style={{
            flex: '1',
            minWidth: '120px',
            padding: '10px 16px',
            border: '2px solid #FF9800',
            background: '#FFF3E0',
            color: '#FF9800',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          Reset Style
        </button>
        <button
          onClick={deleteNode}
          style={{
            flex: '1',
            minWidth: '120px',
            padding: '10px 16px',
            border: '2px solid #f44336',
            background: '#ffebee',
            color: '#f44336',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          🗑️ Delete
        </button>
        <button
          onClick={handleClose}
          style={{
            flex: '1',
            minWidth: '120px',
            padding: '10px 16px',
            border: '2px solid #4CAF50',
            background: '#4CAF50',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          Done
        </button>
      </div>
    </Modal>
  );
};