import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge, Diagram, Point } from '../types/all';
import { v4 as uuidv4 } from 'uuid';

interface DiagramState {
  currentDiagram: Diagram | null;
  selectedItems: string[];
  history: {
    past: Diagram[];
    future: Diagram[];
  };
}

const initialState: DiagramState = {
  currentDiagram: null,
  selectedItems: [],
  history: {
    past: [],
    future: []
  }
};

const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    createDiagram: (state, action: PayloadAction<{ name: string; type: Diagram['type'] }>) => {
      state.currentDiagram = {
        id: uuidv4(),
        name: action.payload.name,
        type: action.payload.type,
        nodes: [],
        edges: [],
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      };
      state.selectedItems = [];
    },
    
    addNode: (state, action: PayloadAction<Omit<Node, 'id'>>) => {
      if (state.currentDiagram) {
        const newNode: Node = {
          ...action.payload,
          id: uuidv4()
        } as Node;
        state.currentDiagram.nodes.push(newNode);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },
    
    addEdge: (state, action: PayloadAction<Omit<Edge, 'id'>>) => {
      if (state.currentDiagram) {
        const newEdge: Edge = {
          ...action.payload,
          id: uuidv4()
        };
        state.currentDiagram.edges.push(newEdge);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },
    
    updateNode: (state, action: PayloadAction<{ id: string; updates: Partial<Node> }>) => {
      if (state.currentDiagram) {
        const nodeIndex = state.currentDiagram.nodes.findIndex(n => n.id === action.payload.id);
        if (nodeIndex !== -1) {
          state.currentDiagram.nodes[nodeIndex] = {
            ...state.currentDiagram.nodes[nodeIndex],
            ...action.payload.updates
          } as Node;
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
    },
    
    updateNodePosition: (state, action: PayloadAction<{ id: string; position: Point }>) => {
      if (state.currentDiagram) {
        const nodeIndex = state.currentDiagram.nodes.findIndex(n => n.id === action.payload.id);
        if (nodeIndex !== -1) {
          state.currentDiagram.nodes[nodeIndex].position = action.payload.position;
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
    },
    
    deleteNode: (state, action: PayloadAction<string>) => {
      if (state.currentDiagram) {
        const nodeId = action.payload;
        state.currentDiagram.nodes = state.currentDiagram.nodes.filter(n => n.id !== nodeId);
        // Remove edges connected to this node
        state.currentDiagram.edges = state.currentDiagram.edges.filter(
          e => e.source !== nodeId && e.target !== nodeId
        );
        state.selectedItems = state.selectedItems.filter(id => id !== nodeId);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },
    
    deleteEdge: (state, action: PayloadAction<string>) => {
      if (state.currentDiagram) {
        const edgeId = action.payload;
        state.currentDiagram.edges = state.currentDiagram.edges.filter(e => e.id !== edgeId);
        state.selectedItems = state.selectedItems.filter(id => id !== edgeId);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },
    
    selectItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload;
    },
    
    selectItem: (state, action: PayloadAction<string>) => {
      state.selectedItems = [action.payload];
    },
    
    addToSelection: (state, action: PayloadAction<string>) => {
      if (!state.selectedItems.includes(action.payload)) {
        state.selectedItems.push(action.payload);
      }
    },
    
    clearSelection: (state) => {
      state.selectedItems = [];
    },
    
    loadDiagram: (state, action: PayloadAction<Diagram>) => {
      state.currentDiagram = action.payload;
      state.selectedItems = [];
      state.history = { past: [], future: [] };
    }
  }
});

export const { 
  createDiagram, 
  addNode, 
  addEdge, 
  updateNode, 
  updateNodePosition,
  deleteNode,
  deleteEdge,
  selectItems,
  selectItem,
  addToSelection,
  clearSelection,
  loadDiagram
} = diagramSlice.actions;

export default diagramSlice.reducer;