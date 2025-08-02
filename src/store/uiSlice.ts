import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NodeType } from '../types/all';

interface UIState {
  selectedTool: 'select' | 'vocabulary' | 'practice' | 'test' | 'operate' | 'edge';
  isPropertyPanelOpen: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  canvasSize: { width: number; height: number };
  isDragging: boolean;
  draggedItemId?: string;
}

const initialState: UIState = {
  selectedTool: 'select',
  isPropertyPanelOpen: false,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  canvasSize: { width: 800, height: 600 },
  isDragging: false,
  draggedItemId: undefined
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
  resetView
} = uiSlice.actions;

export default uiSlice.reducer;