import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  selectedTool: 'select' | 'vocabulary' | 'practice' | 'test' | 'operate' | 'edge' | 'entry' | 'exit';
  isPropertyPanelOpen: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  canvasSize: { width: number; height: number };
  isDragging: boolean;
  draggedItemId?: string;
  
  // Diagram mode and settings
  diagramMode: 'MUD' | 'TOTE' | 'HYBRID';
  autoDetectEdges: boolean;
  showUnmarkedEdges: boolean;
  
  // Grid settings
  showGrid: boolean;
  snapToGrid: boolean;
  gridSpacing: number;
  
  // Multi-step workflows
  pendingEdge: { source: string; target: string } | null;
  pendingEntryExit: { type: 'entry' | 'exit'; nodeId?: string } | null;
  
  // Modal states
  showEdgeTypeSelector: boolean;
  showCustomizationPanel: boolean;
  showEdgeModificationPanel: boolean;
  selectedNodeForCustomization: string | null;
  selectedEdgeForModification: string | null;
}

const initialState: UIState = {
  selectedTool: 'select',
  isPropertyPanelOpen: false,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  canvasSize: { width: 800, height: 600 },
  isDragging: false,
  draggedItemId: undefined,
  
  // Diagram mode and settings
  diagramMode: 'HYBRID',
  autoDetectEdges: true,
  showUnmarkedEdges: false,
  
  // Grid settings
  showGrid: false,
  snapToGrid: false,
  gridSpacing: 50,
  
  // Multi-step workflows
  pendingEdge: null,
  pendingEntryExit: null,
  
  // Modal states
  showEdgeTypeSelector: false,
  showCustomizationPanel: false,
  showEdgeModificationPanel: false,
  selectedNodeForCustomization: null,
  selectedEdgeForModification: null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedTool: (state, action: PayloadAction<UIState['selectedTool']>) => {
      state.selectedTool = action.payload;
    },
    
    togglePropertyPanel: (state) => {
      state.isPropertyPanelOpen = !state.isPropertyPanelOpen;
    },
    
    setPropertyPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.isPropertyPanelOpen = action.payload;
    },
    
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(0.1, Math.min(4, action.payload));
    },
    
    setPanOffset: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.panOffset = action.payload;
    },
    
    setCanvasSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.canvasSize = action.payload;
    },
    
    setDragging: (state, action: PayloadAction<{ isDragging: boolean; itemId?: string }>) => {
      state.isDragging = action.payload.isDragging;
      state.draggedItemId = action.payload.itemId;
    },
    
    resetView: (state) => {
      state.zoom = 1;
      state.panOffset = { x: 0, y: 0 };
    },
    
    // Diagram mode and settings
    setDiagramMode: (state, action: PayloadAction<'MUD' | 'TOTE' | 'HYBRID'>) => {
      state.diagramMode = action.payload;
    },
    
    setAutoDetectEdges: (state, action: PayloadAction<boolean>) => {
      state.autoDetectEdges = action.payload;
    },
    
    setShowUnmarkedEdges: (state, action: PayloadAction<boolean>) => {
      state.showUnmarkedEdges = action.payload;
    },
    
    // Grid settings
    setShowGrid: (state, action: PayloadAction<boolean>) => {
      state.showGrid = action.payload;
    },
    
    setSnapToGrid: (state, action: PayloadAction<boolean>) => {
      state.snapToGrid = action.payload;
    },
    
    setGridSpacing: (state, action: PayloadAction<number>) => {
      state.gridSpacing = Math.max(10, Math.min(200, action.payload));
    },
    
    // Multi-step workflows
    setPendingEdge: (state, action: PayloadAction<{ source: string; target: string } | null>) => {
      state.pendingEdge = action.payload;
    },
    
    clearPendingEdge: (state) => {
      state.pendingEdge = null;
    },
    
    setPendingEntryExit: (state, action: PayloadAction<{ type: 'entry' | 'exit'; nodeId?: string } | null>) => {
      state.pendingEntryExit = action.payload;
    },
    
    // Modal states
    setShowEdgeTypeSelector: (state, action: PayloadAction<boolean>) => {
      state.showEdgeTypeSelector = action.payload;
    },
    
    setShowCustomizationPanel: (state, action: PayloadAction<boolean>) => {
      state.showCustomizationPanel = action.payload;
      if (!action.payload) {
        state.selectedNodeForCustomization = null;
      }
    },
    
    setShowEdgeModificationPanel: (state, action: PayloadAction<boolean>) => {
      state.showEdgeModificationPanel = action.payload;
      if (!action.payload) {
        state.selectedEdgeForModification = null;
      }
    },
    
    setSelectedNodeForCustomization: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeForCustomization = action.payload;
      if (action.payload) {
        state.showCustomizationPanel = true;
      }
    },
    
    setSelectedEdgeForModification: (state, action: PayloadAction<string | null>) => {
      state.selectedEdgeForModification = action.payload;
      if (action.payload) {
        state.showEdgeModificationPanel = true;
      }
    }
  }
});

export const { 
  setSelectedTool,
  togglePropertyPanel,
  setPropertyPanelOpen,
  setZoom,
  setPanOffset,
  setCanvasSize,
  setDragging,
  resetView,
  setDiagramMode,
  setAutoDetectEdges,
  setShowUnmarkedEdges,
  setShowGrid,
  setSnapToGrid,
  setGridSpacing,
  setPendingEdge,
  clearPendingEdge,
  setPendingEntryExit,
  setShowEdgeTypeSelector,
  setShowCustomizationPanel,
  setShowEdgeModificationPanel,
  setSelectedNodeForCustomization,
  setSelectedEdgeForModification
} = uiSlice.actions;

export default uiSlice.reducer;
