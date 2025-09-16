import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  addNode, 
  addEdge, 
  updateNodePosition, 
  selectItem, 
  clearSelection,
  createDiagram,
  saveToHistory
} from '../store/diagramSlice';
import { setSelectedTool } from '../store/uiSlice';
import type { Edge, Point, NodeType } from '../types/all';

export const useDiagram = () => {
  const dispatch = useAppDispatch();
  const currentDiagram = useAppSelector(state => state.diagram.currentDiagram);
  const selectedItems = useAppSelector(state => state.diagram.selectedItems);
  const selectedTool = useAppSelector(state => state.ui.selectedTool);

  const nodes = currentDiagram?.nodes || [];
  const edges = currentDiagram?.edges || [];

  const createNewDiagram = (name: string, type: 'MUD' | 'TOTE' | 'HYBRID') => {
    dispatch(createDiagram({ name, type }));
  };

  const addNewNode = (type: NodeType, position: Point, label: string = '') => {
    // Save current state to history before making changes
    dispatch(saveToHistory());
    
    const newNode = {
      type,
      position,
      label: label || `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
    };
    dispatch(addNode(newNode));
  };

  const addNewEdge = (sourceId: string, targetId: string, type: Edge['type']) => {
    // Save current state to history before making changes
    dispatch(saveToHistory());
    
    const newEdge = {
      source: sourceId,
      target: targetId,
      type,
    };
    dispatch(addEdge(newEdge));
  };

  const moveNode = (nodeId: string, position: Point, saveHistory = true) => {
    if (saveHistory) {
      // Save current state to history before making changes
      dispatch(saveToHistory());
    }
    dispatch(updateNodePosition({ id: nodeId, position }));
  };

  const selectNode = (nodeId: string) => {
    dispatch(selectItem(nodeId));
  };

  const clearCurrentSelection = () => {
    dispatch(clearSelection());
  };

  const setTool = (tool: typeof selectedTool) => {
    dispatch(setSelectedTool(tool));
  };

  return {
    currentDiagram,
    nodes,
    edges,
    selectedItems,
    selectedTool,
    createNewDiagram,
    addNewNode,
    addNewEdge,
    moveNode,
    selectNode,
    clearCurrentSelection,
    setTool
  };
};
