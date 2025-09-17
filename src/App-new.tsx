import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { InstallPrompt, PWAStatus } from './components/PWAComponents';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { EdgeTypeSelector } from './components/EdgeTypeSelector';
import { NodeCustomizationPanel } from './components/NodeCustomizationPanel';
import { EdgeModificationPanel } from './components/EdgeModificationPanel';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { 
  setDiagramMode,
  setAutoDetectEdges,
  setShowUnmarkedEdges,
  setShowGrid,
  setSnapToGrid,
  setGridSpacing,
  setSelectedTool,
  setShowEdgeTypeSelector,
  setShowCustomizationPanel,
  setShowEdgeModificationPanel
} from './store/uiSlice';
import { 
  createDiagram,
  undo,
  redo,
  selectNodes,
  loadDiagram
} from './store/diagramSlice';
import { getAvailableTools } from './utils/diagramUtils';
import { exportAsJSON, exportAsSVG, exportAsLaTeX, importFromJSON } from './utils/exportUtils';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // UI state selectors
  const diagramMode = useAppSelector(state => state.ui.diagramMode);
  const selectedTool = useAppSelector(state => state.ui.selectedTool);
  const autoDetectEdges = useAppSelector(state => state.ui.autoDetectEdges);
  const showUnmarkedEdges = useAppSelector(state => state.ui.showUnmarkedEdges);
  const showGrid = useAppSelector(state => state.ui.showGrid);
  const snapToGrid = useAppSelector(state => state.ui.snapToGrid);
  const gridSpacing = useAppSelector(state => state.ui.gridSpacing);
  const showEdgeTypeSelector = useAppSelector(state => state.ui.showEdgeTypeSelector);
  const showCustomizationPanel = useAppSelector(state => state.ui.showCustomizationPanel);
  const showEdgeModificationPanel = useAppSelector(state => state.ui.showEdgeModificationPanel);
  
  // Diagram state selectors
  const currentDiagram = useAppSelector(state => state.diagram.currentDiagram);
  const canUndo = useAppSelector(state => state.diagram.history.past.length > 0);
  const canRedo = useAppSelector(state => state.diagram.history.future.length > 0);
  const hasNodes = useAppSelector(state => (state.diagram.currentDiagram?.nodes.length ?? 0) > 0);

  // Initialize diagram if none exists
  React.useEffect(() => {
    if (!currentDiagram) {
      dispatch(createDiagram({ name: 'Untitled Diagram', type: diagramMode }));
    }
  }, [currentDiagram, diagramMode, dispatch]);

  // Header event handlers
  const handleModeChange = (mode: 'MUD' | 'TOTE' | 'HYBRID') => {
    dispatch(setDiagramMode(mode));
    // Reset tool to select when changing modes
    dispatch(setSelectedTool('select'));
  };

  const handleAutoDetectChange = (value: boolean) => {
    dispatch(setAutoDetectEdges(value));
  };

  const handleUnmarkedEdgesChange = (value: boolean) => {
    dispatch(setShowUnmarkedEdges(value));
  };

  const handleShowGridChange = (value: boolean) => {
    dispatch(setShowGrid(value));
  };

  const handleSnapToGridChange = (value: boolean) => {
    dispatch(setSnapToGrid(value));
  };

  const handleGridSpacingChange = (value: number) => {
    dispatch(setGridSpacing(value));
  };

  const handleToolSelect = (tool: string) => {
    dispatch(setSelectedTool(tool as any));
    // Clear selections when switching tools
    dispatch(selectNodes([]));
  };

  const handleUndo = () => {
    dispatch(undo());
  };

  const handleRedo = () => {
    dispatch(redo());
  };

  const handleImport = () => {
    importFromJSON((diagram) => {
      dispatch(loadDiagram(diagram));
    });
  };

  const handleExportJSON = () => {
    if (currentDiagram) {
      exportAsJSON(currentDiagram);
    }
  };

  const handleExportSVG = () => {
    if (currentDiagram) {
      exportAsSVG(currentDiagram);
    }
  };

  const handleExportLatex = () => {
    if (currentDiagram) {
      exportAsLaTeX(currentDiagram);
    }
  };

  const handleCloseEdgeTypeSelector = () => {
    dispatch(setShowEdgeTypeSelector(false));
  };

  const handleCloseCustomizationPanel = () => {
    dispatch(setShowCustomizationPanel(false));
  };

  const handleCloseEdgeModificationPanel = () => {
    dispatch(setShowEdgeModificationPanel(false));
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* PWA Components */}
      <PWAStatus />
      <InstallPrompt />
      
      {/* Header */}
      <Header
        diagramMode={diagramMode}
        onModeChange={handleModeChange}
        autoDetectEdges={autoDetectEdges}
        onAutoDetectChange={handleAutoDetectChange}
        showUnmarkedEdges={showUnmarkedEdges}
        onUnmarkedEdgesChange={handleUnmarkedEdgesChange}
        showGrid={showGrid}
        onShowGridChange={handleShowGridChange}
        snapToGrid={snapToGrid}
        onSnapToGridChange={handleSnapToGridChange}
        gridSpacing={gridSpacing}
        onGridSpacingChange={handleGridSpacingChange}
        selectedTool={selectedTool}
        availableTools={[...getAvailableTools(diagramMode)]}
        onToolSelect={handleToolSelect}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onImport={handleImport}
        onExportJSON={handleExportJSON}
        onExportSVG={handleExportSVG}
        onExportLatex={handleExportLatex}
        hasNodes={hasNodes}
      />
      
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas />
        </div>
        
        {/* TODO: Add side panels for properties, etc. */}
      </div>
      
      {/* Modals */}
      <EdgeTypeSelector 
        isOpen={showEdgeTypeSelector}
        onClose={handleCloseEdgeTypeSelector}
      />
      <NodeCustomizationPanel
        isOpen={showCustomizationPanel}
        onClose={handleCloseCustomizationPanel}
      />
      <EdgeModificationPanel
        isOpen={showEdgeModificationPanel}
        onClose={handleCloseEdgeModificationPanel}
      />
    </div>
  );
};

// Main App component with Redux Provider
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;