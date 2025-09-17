import React from 'react';

interface HeaderProps {
  // Mode and settings
  diagramMode: 'MUD' | 'TOTE' | 'HYBRID';
  onModeChange: (mode: 'MUD' | 'TOTE' | 'HYBRID') => void;
  autoDetectEdges: boolean;
  onAutoDetectChange: (value: boolean) => void;
  showUnmarkedEdges: boolean;
  onUnmarkedEdgesChange: (value: boolean) => void;
  
  // Grid settings
  showGrid: boolean;
  onShowGridChange: (value: boolean) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (value: boolean) => void;
  gridSpacing: number;
  onGridSpacingChange: (value: number) => void;
  
  // Tools
  selectedTool: string;
  availableTools: string[];
  onToolSelect: (tool: string) => void;
  
  // Actions
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: () => void;
  onExportJSON: () => void;
  onExportSVG: () => void;
  onExportLatex: () => void;
  
  // State
  hasNodes: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  diagramMode,
  onModeChange,
  autoDetectEdges,
  onAutoDetectChange,
  showUnmarkedEdges,
  onUnmarkedEdgesChange,
  showGrid,
  onShowGridChange,
  snapToGrid,
  onSnapToGridChange,
  gridSpacing,
  onGridSpacingChange,
  selectedTool,
  availableTools,
  onToolSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onImport,
  onExportJSON,
  onExportSVG,
  onExportLatex,
  hasNodes
}) => {
  return (
    <div style={{ 
      background: '#1976D2', 
      color: 'white', 
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h1 style={{ margin: 0 }}>MUD & TOTE Diagram Tool</h1>
          <a 
            href="https://orcid.org/0000-0002-4422-3535" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.7)', 
              textDecoration: 'none',
              marginTop: '2px'
            }}
            onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
          >
            by Mauro Santelli
          </a>
        </div>
        
        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px' }}>
          {(['MUD', 'TOTE', 'HYBRID'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              style={{
                padding: '0.3rem 0.8rem',
                border: 'none',
                background: diagramMode === mode ? 'rgba(255,255,255,0.9)' : 'transparent',
                color: diagramMode === mode ? '#1976D2' : 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: diagramMode === mode ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              {mode}
            </button>
          ))}
        </div>
        
        {/* Auto-detection toggle for MUD mode */}
        {diagramMode === 'MUD' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
            <input
              type="checkbox"
              id="auto-detect"
              checked={autoDetectEdges}
              onChange={(e) => onAutoDetectChange(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="auto-detect"
              style={{
                color: 'white',
                fontSize: '0.9rem',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              Auto-detect edges
            </label>
          </div>
        )}

        {/* Unmarked edges toggle - available in all modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
          <input
            type="checkbox"
            id="unmarked-edges"
            checked={showUnmarkedEdges}
            onChange={(e) => onUnmarkedEdgesChange(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer'
            }}
          />
          <label
            htmlFor="unmarked-edges"
            style={{
              color: 'white',
              fontSize: '0.9rem',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            Unmarked edges
          </label>
        </div>

        {/* Grid controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', padding: '0 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
          {/* Show Grid Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="show-grid"
              checked={showGrid}
              onChange={(e) => onShowGridChange(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="show-grid"
              style={{
                color: 'white',
                fontSize: '0.9rem',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              Grid
            </label>
          </div>

          {/* Snap to Grid Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="snap-to-grid"
              checked={snapToGrid}
              onChange={(e) => onSnapToGridChange(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="snap-to-grid"
              style={{
                color: 'white',
                fontSize: '0.9rem',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              Snap
            </label>
          </div>

          {/* Grid Spacing Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label
              htmlFor="grid-spacing"
              style={{
                color: 'white',
                fontSize: '0.9rem',
                userSelect: 'none'
              }}
            >
              Spacing:
            </label>
            <input
              type="range"
              id="grid-spacing"
              min="10"
              max="200"
              value={gridSpacing}
              onChange={(e) => onGridSpacingChange(Number(e.target.value))}
              style={{
                width: '80px',
                cursor: 'pointer'
              }}
            />
            <span style={{ color: 'white', fontSize: '0.8rem', minWidth: '30px' }}>
              {gridSpacing}
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* Tools - filtered by mode */}
        {availableTools.map(tool => (
          <button
            key={tool}
            onClick={() => onToolSelect(tool)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255,255,255,0.3)',
              background: selectedTool === tool ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tool}
          </button>
        ))}
        
        {/* Separator */}
        <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.3)', margin: '0 0.5rem' }} />
        
        {/* Undo/Redo buttons */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255,255,255,0.3)',
            background: !canUndo ? 'rgba(255,255,255,0.05)' : 'rgba(96,125,139,0.8)',
            color: !canUndo ? 'rgba(255,255,255,0.3)' : 'white',
            borderRadius: '4px',
            cursor: !canUndo ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          ↶ Undo
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255,255,255,0.3)',
            background: !canRedo ? 'rgba(255,255,255,0.05)' : 'rgba(96,125,139,0.8)',
            color: !canRedo ? 'rgba(255,255,255,0.3)' : 'white',
            borderRadius: '4px',
            cursor: !canRedo ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          ↷ Redo
        </button>
        
        {/* Import button */}
        <button
          onClick={onImport}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(156,39,176,0.8)',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          📁 Import
        </button>
        
        {/* Export buttons */}
        <button
          onClick={onExportJSON}
          disabled={!hasNodes}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255,255,255,0.3)',
            background: !hasNodes ? 'rgba(255,255,255,0.05)' : 'rgba(76,175,80,0.8)',
            color: !hasNodes ? 'rgba(255,255,255,0.5)' : 'white',
            borderRadius: '4px',
            cursor: !hasNodes ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          JSON
        </button>
        
        <button
          onClick={onExportSVG}
          disabled={!hasNodes}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255,255,255,0.3)',
            background: !hasNodes ? 'rgba(255,255,255,0.05)' : 'rgba(255,152,0,0.8)',
            color: !hasNodes ? 'rgba(255,255,255,0.5)' : 'white',
            borderRadius: '4px',
            cursor: !hasNodes ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          SVG
        </button>
        
        <button
          onClick={onExportLatex}
          disabled={!hasNodes}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255,255,255,0.3)',
            background: !hasNodes ? 'rgba(255,255,255,0.05)' : 'rgba(233,30,99,0.8)',
            color: !hasNodes ? 'rgba(255,255,255,0.5)' : 'white',
            borderRadius: '4px',
            cursor: !hasNodes ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          LaTeX
        </button>
      </div>
    </div>
  );
};