import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Node, Edge, Diagram, Point, EntryPoint, ExitPoint } from '../types/all';
import { v4 as uuidv4 } from 'uuid';

interface DiagramState {
  currentDiagram: Diagram | null;
  selectedItems: string[];
  selectedNodes: string[];
  selectedEdges: string[];
  history: {
    past: Diagram[];
    future: Diagram[];
    maxSize: number;
  };
}

const initialState: DiagramState = {
  currentDiagram: null,
  selectedItems: [],
  selectedNodes: [],
  selectedEdges: [],
  history: {
    past: [],
    future: [],
    maxSize: 50
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
        entryPoints: [],
        exitPoints: [],
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
    
    updateEdge: (state, action: PayloadAction<{ id: string; updates: Partial<Edge> }>) => {
      if (state.currentDiagram) {
        const edgeIndex = state.currentDiagram.edges.findIndex(e => e.id === action.payload.id);
        if (edgeIndex !== -1) {
          state.currentDiagram.edges[edgeIndex] = {
            ...state.currentDiagram.edges[edgeIndex],
            ...action.payload.updates
          } as Edge;
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
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
      state.selectedNodes = [];
      state.selectedEdges = [];
      state.history = { past: [], future: [], maxSize: 50 };
    },
    
    // Enhanced selection management
    selectNodes: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload;
      state.selectedItems = [...action.payload, ...state.selectedEdges];
    },
    
    selectEdges: (state, action: PayloadAction<string[]>) => {
      state.selectedEdges = action.payload;
      state.selectedItems = [...state.selectedNodes, ...action.payload];
    },
    
    selectAll: (state) => {
      if (state.currentDiagram) {
        state.selectedNodes = state.currentDiagram.nodes.map(n => n.id);
        state.selectedEdges = state.currentDiagram.edges.map(e => e.id);
        state.selectedItems = [...state.selectedNodes, ...state.selectedEdges];
      }
    },
    
    // History management
    saveToHistory: (state) => {
      if (state.currentDiagram) {
        // Clone the current diagram for history
        const diagramSnapshot = JSON.parse(JSON.stringify(state.currentDiagram));
        
        // Add to past, remove oldest if over limit
        state.history.past.push(diagramSnapshot);
        if (state.history.past.length > state.history.maxSize) {
          state.history.past.shift();
        }
        
        // Clear future when new action is taken
        state.history.future = [];
      }
    },
    
    undo: (state) => {
      if (state.history.past.length > 0 && state.currentDiagram) {
        // Save current state to future
        const currentSnapshot = JSON.parse(JSON.stringify(state.currentDiagram));
        state.history.future.unshift(currentSnapshot);
        
        // Restore from past
        const previousState = state.history.past.pop()!;
        state.currentDiagram = previousState;
        
        // Clear selections
        state.selectedItems = [];
        state.selectedNodes = [];
        state.selectedEdges = [];
      }
    },
    
    redo: (state) => {
      if (state.history.future.length > 0 && state.currentDiagram) {
        // Save current state to past
        const currentSnapshot = JSON.parse(JSON.stringify(state.currentDiagram));
        state.history.past.push(currentSnapshot);
        
        // Restore from future
        const nextState = state.history.future.shift()!;
        state.currentDiagram = nextState;
        
        // Clear selections
        state.selectedItems = [];
        state.selectedNodes = [];
        state.selectedEdges = [];
      }
    },
    
    setHistoryMaxSize: (state, action: PayloadAction<number>) => {
      state.history.maxSize = Math.max(1, action.payload);
      // Trim if necessary
      while (state.history.past.length > state.history.maxSize) {
        state.history.past.shift();
      }
    },

    // Entry/Exit point management
    addEntryPoint: (state, action: PayloadAction<Omit<EntryPoint, 'id'>>) => {
      if (state.currentDiagram) {
        const newEntryPoint: EntryPoint = {
          id: uuidv4(),
          ...action.payload
        };
        state.currentDiagram.entryPoints.push(newEntryPoint);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    addExitPoint: (state, action: PayloadAction<Omit<ExitPoint, 'id'>>) => {
      if (state.currentDiagram) {
        const newExitPoint: ExitPoint = {
          id: uuidv4(),
          ...action.payload
        };
        state.currentDiagram.exitPoints.push(newExitPoint);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    deleteEntryPoint: (state, action: PayloadAction<string>) => {
      if (state.currentDiagram) {
        state.currentDiagram.entryPoints = state.currentDiagram.entryPoints.filter(ep => ep.id !== action.payload);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    deleteExitPoint: (state, action: PayloadAction<string>) => {
      if (state.currentDiagram) {
        state.currentDiagram.exitPoints = state.currentDiagram.exitPoints.filter(ep => ep.id !== action.payload);
        state.currentDiagram.metadata.modified = new Date().toISOString();
      }
    },

    updateEntryPoint: (state, action: PayloadAction<Partial<EntryPoint> & { id: string }>) => {
      if (state.currentDiagram) {
        const index = state.currentDiagram.entryPoints.findIndex(ep => ep.id === action.payload.id);
        if (index !== -1) {
          state.currentDiagram.entryPoints[index] = { ...state.currentDiagram.entryPoints[index], ...action.payload };
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
    },

    updateExitPoint: (state, action: PayloadAction<Partial<ExitPoint> & { id: string }>) => {
      if (state.currentDiagram) {
        const index = state.currentDiagram.exitPoints.findIndex(ep => ep.id === action.payload.id);
        if (index !== -1) {
          state.currentDiagram.exitPoints[index] = { ...state.currentDiagram.exitPoints[index], ...action.payload };
          state.currentDiagram.metadata.modified = new Date().toISOString();
        }
      }
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
  updateEdge,
  selectItems,
  selectItem,
  addToSelection,
  clearSelection,
  loadDiagram,
  selectNodes,
  selectEdges,
  selectAll,
  saveToHistory,
  undo,
  redo,
  setHistoryMaxSize,
  addEntryPoint,
  addExitPoint,
  deleteEntryPoint,
  deleteExitPoint,
  updateEntryPoint,
  updateExitPoint
} = diagramSlice.actions;

export default diagramSlice.reducer;