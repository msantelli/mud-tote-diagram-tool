import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { InstallPrompt, PWAStatus } from './components/PWAComponents';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { 
  setDiagramMode,
  setAutoDetectEdges,
  setShowUnmarkedEdges,
  setSelectedTool
} from './store/uiSlice';
import { 
  createDiagram,
  undo,
  redo,
  selectNodes
} from './store/diagramSlice';
import { getAvailableTools } from './utils/diagramUtils';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // UI state selectors
  const diagramMode = useAppSelector(state => state.ui.diagramMode);
  const selectedTool = useAppSelector(state => state.ui.selectedTool);
  const autoDetectEdges = useAppSelector(state => state.ui.autoDetectEdges);
  const showUnmarkedEdges = useAppSelector(state => state.ui.showUnmarkedEdges);
  
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
    // TODO: Implement import functionality
    console.log('Import functionality to be implemented');
  };

  const handleExportJSON = () => {
    // TODO: Implement JSON export
    console.log('JSON export to be implemented');
  };

  const handleExportSVG = () => {
    // TODO: Implement SVG export
    console.log('SVG export to be implemented');
  };

  const handleExportLatex = () => {
    // TODO: Implement LaTeX export
    console.log('LaTeX export to be implemented');
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