import React, { useState, useRef } from 'react';

// Inline all types here to avoid import issues
interface Point {
  x: number;
  y: number;
}

interface Node {
  id: string;
  type: 'vocabulary' | 'practice' | 'test' | 'operate';
  position: Point;
  label: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'PV' | 'VP' | 'PP' | 'VV';
}

function SimpleApp() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'vocabulary' | 'practice' | 'test' | 'operate' | 'edge'>('select');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const addNode = (x: number, y: number) => {
    if (selectedTool === 'select' || selectedTool === 'edge') return;
    
    const newNode: Node = {
      id: Date.now().toString(),
      type: selectedTool,
      position: { x, y },
      label: `${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} ${nodes.length + 1}`
    };
    
    setNodes([...nodes, newNode]);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      addNode(x, y);
      setSelectedNodes([]);
    }
  };

  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (selectedTool === 'edge') {
      if (selectedNodes.length === 0) {
        setSelectedNodes([nodeId]);
      } else if (selectedNodes.length === 1 && selectedNodes[0] !== nodeId) {
        // Create edge
        const sourceNode = nodes.find(n => n.id === selectedNodes[0])!;
        const targetNode = nodes.find(n => n.id === nodeId)!;
        
        let edgeType: 'PV' | 'VP' | 'PP' | 'VV';
        if (sourceNode.type === 'practice' && targetNode.type === 'vocabulary') {
          edgeType = 'PV';
        } else if (sourceNode.type === 'vocabulary' && targetNode.type === 'practice') {
          edgeType = 'VP';
        } else if (sourceNode.type === 'practice' && targetNode.type === 'practice') {
          edgeType = 'PP';
        } else {
          edgeType = 'VV';
        }
        
        const newEdge: Edge = {
          id: Date.now().toString(),
          source: selectedNodes[0],
          target: nodeId,
          type: edgeType
        };
        
        setEdges([...edges, newEdge]);
        setSelectedNodes([]);
      }
    } else {
      setSelectedNodes([nodeId]);
    }
  };

  const handleMouseDown = (nodeId: string, event: React.MouseEvent) => {
    if (selectedTool === 'select') {
      const node = nodes.find(n => n.id === nodeId)!;
      const rect = event.currentTarget.getBoundingClientRect();
      setDraggedNode(nodeId);
      setDragOffset({
        x: event.clientX - rect.left - node.position.x,
        y: event.clientY - rect.top - node.position.y
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (draggedNode && selectedTool === 'select') {
      const rect = event.currentTarget.getBoundingClientRect();
      const newX = event.clientX - rect.left - dragOffset.x;
      const newY = event.clientY - rect.top - dragOffset.y;
      
      setNodes(nodes.map(node =>
        node.id === draggedNode
          ? { ...node, position: { x: newX, y: newY } }
          : node
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  // Node editing functions
  const handleNodeDoubleClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (selectedTool === 'select') {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setEditingNode(nodeId);
        setEditText(node.label);
      }
    }
  };

  const handleEditSubmit = () => {
    if (editingNode && editText.trim()) {
      setNodes(nodes.map(node =>
        node.id === editingNode
          ? { ...node, label: editText.trim() }
          : node
      ));
    }
    setEditingNode(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingNode(null);
    setEditText('');
  };

  // Export functions
  const exportAsJSON = () => {
    const diagram = {
      nodes,
      edges,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0',
        type: 'MUD-TOTE'
      }
    };
    
    const dataStr = JSON.stringify(diagram, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mud-diagram.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const exportAsSVG = () => {
    // Create SVG content
    const svgContent = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="#fafafa"/>
        
        <!-- Edges -->
        ${edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return '';
          
          const color = getEdgeColor(edge.type);
          return `
            <line x1="${sourceNode.position.x}" y1="${sourceNode.position.y}" 
                  x2="${targetNode.position.x}" y2="${targetNode.position.y}" 
                  stroke="${color}" stroke-width="2" marker-end="url(#arrowhead)"/>
            <text x="${(sourceNode.position.x + targetNode.position.x) / 2}" 
                  y="${(sourceNode.position.y + targetNode.position.y) / 2 - 10}" 
                  text-anchor="middle" font-size="12" fill="${color}" font-weight="bold">
              ${edge.type}
            </text>
          `;
        }).join('')}
        
        <!-- Nodes -->
        ${nodes.map(node => {
          const bgColor = node.type === 'vocabulary' ? '#E3F2FD' : 
                         node.type === 'practice' ? '#FFF3E0' :
                         node.type === 'test' ? '#E8F5E8' : '#FFF8E1';
          const borderColor = node.type === 'vocabulary' ? '#1976D2' : 
                             node.type === 'practice' ? '#F57C00' :
                             node.type === 'test' ? '#4CAF50' : '#FFC107';
          
          if (node.type === 'vocabulary') {
            return `
              <ellipse cx="${node.position.x}" cy="${node.position.y}" 
                       rx="50" ry="25" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
              <text x="${node.position.x}" y="${node.position.y + 5}" 
                    text-anchor="middle" font-size="12" font-weight="bold">${node.label}</text>
            `;
          } else if (node.type === 'test') {
            return `
              <g transform="translate(${node.position.x}, ${node.position.y}) rotate(45)">
                <rect x="-35" y="-35" width="70" height="70" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
              </g>
              <text x="${node.position.x}" y="${node.position.y + 5}" 
                    text-anchor="middle" font-size="12" font-weight="bold">${node.label}</text>
            `;
          } else {
            return `
              <rect x="${node.position.x - 50}" y="${node.position.y - 25}" 
                    width="100" height="50" rx="8" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
              <text x="${node.position.x}" y="${node.position.y + 5}" 
                    text-anchor="middle" font-size="12" font-weight="bold">${node.label}</text>
            `;
          }
        }).join('')}
      </svg>
    `;
    
    const dataBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mud-diagram.svg';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const exportAsLaTeX = () => {
    // Generate TikZ code for academic publications
    const tikzCode = generateTikZCode(nodes, edges);
    
    // Create standalone LaTeX document
    const latexDocument = `\\documentclass[border=2mm]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{positioning,shapes.geometric,arrows.meta}

% Define academic-friendly colors
\\definecolor{vocabcolor}{RGB}{25,118,210}
\\definecolor{practicecolor}{RGB}{245,124,0}
\\definecolor{testcolor}{RGB}{76,175,80}
\\definecolor{operatecolor}{RGB}{255,193,7}

\\begin{document}
${tikzCode}
\\end{document}`;

    const dataBlob = new Blob([latexDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mud-diagram.tex';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const generateTikZCode = (nodes: Node[], edges: Edge[]): string => {
    let tikz = '\\begin{tikzpicture}[>=Stealth]\n';
    
    // Define node styles
    tikz += `  % Node styles for academic quality
  \\tikzset{
    vocabulary/.style={ellipse, draw=vocabcolor, fill=vocabcolor!10, thick, minimum width=2.5cm, minimum height=1.2cm, text centered, font=\\\\small},
    practice/.style={rectangle, draw=practicecolor, fill=practicecolor!10, thick, minimum width=2.5cm, minimum height=1.2cm, rounded corners=2mm, text centered, font=\\\\small},
    test/.style={diamond, draw=testcolor, fill=testcolor!10, thick, minimum width=2cm, minimum height=2cm, text centered, font=\\\\small},
    operate/.style={rectangle, draw=operatecolor, fill=operatecolor!10, thick, minimum width=2.5cm, minimum height=1.2cm, text centered, font=\\\\small},
    pv/.style={->, thick, color=testcolor},
    vp/.style={->, thick, color=practicecolor},
    pp/.style={->, thick, color=purple},
    vv/.style={->, thick, color=red},
    resultant/.style={->, thick, dashed, color=gray}
  }

`;
    
    // Convert canvas coordinates to TikZ coordinates (scale and flip Y)
    const scale = 0.02; // Scale factor for academic papers
    const convertX = (x: number) => (x * scale).toFixed(2);
    const convertY = (y: number) => (-(y - 300) * scale).toFixed(2); // Flip Y and center
    
    // Generate nodes
    tikz += '  % Nodes\n';
    nodes.forEach(node => {
      const x = convertX(node.position.x);
      const y = convertY(node.position.y);
      const escapedLabel = node.label.replace(/[{}]/g, '\\$&').replace(/[_^]/g, '\\$&');
      
      tikz += `  \\node[${node.type}] (${node.id}) at (${x}, ${y}) {${escapedLabel}};
`;
    });
    
    tikz += '\n  % Edges\n';
    edges.forEach(edge => {
      const styleMap = {
        'PV': 'pv',
        'VP': 'vp', 
        'PP': 'pp',
        'VV': 'vv',
        'resultant': 'resultant'
      };
      
      const style = styleMap[edge.type] || 'pv';
      const labelText = edge.type;
      
      tikz += `  \\draw[${style}] (${edge.source}) -- (${edge.target}) node[midway, above, font=\\\\tiny, fill=white, inner sep=1pt] {${labelText}};
`;
    });
    
    tikz += '\\end{tikzpicture}\n';
    
    return tikz;
  };

  const clearDiagram = () => {
    if (confirm('Clear all nodes and edges?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNodes([]);
    }
  };

  const getEdgeColor = (type: string) => {
    switch (type) {
      case 'PV': return '#4CAF50'; // Green
      case 'VP': return '#FF9800'; // Orange  
      case 'PP': return '#9C27B0'; // Purple
      case 'VV': return '#F44336'; // Red
      default: return '#666';
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        background: '#1976D2', 
        color: 'white', 
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>MUD & TOTE Diagram Tool</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Tools */}
          {(['select', 'vocabulary', 'practice', 'test', 'operate', 'edge'] as const).map(tool => (
            <button
              key={tool}
              onClick={() => {
                setSelectedTool(tool);
                setSelectedNodes([]);
              }}
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
          
          {/* Export buttons */}
          <button
            onClick={exportAsJSON}
            disabled={nodes.length === 0}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255,255,255,0.3)',
              background: nodes.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(76,175,80,0.8)',
              color: nodes.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
              borderRadius: '4px',
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            JSON
          </button>
          
          <button
            onClick={exportAsSVG}
            disabled={nodes.length === 0}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255,255,255,0.3)',
              background: nodes.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(63,81,181,0.8)',
              color: nodes.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
              borderRadius: '4px',
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            SVG
          </button>
          
          <button
            onClick={exportAsLaTeX}
            disabled={nodes.length === 0}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255,255,255,0.3)',
              background: nodes.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(121,85,72,0.8)',
              color: nodes.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
              borderRadius: '4px',
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            LaTeX
          </button>
          
          <button
            onClick={clearDiagram}
            disabled={nodes.length === 0}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255,255,255,0.3)',
              background: nodes.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(244,67,54,0.8)',
              color: nodes.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
              borderRadius: '4px',
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          flex: 1, 
          background: '#fafafa',
          position: 'relative',
          cursor: selectedTool === 'select' ? 'default' : 
                  selectedTool === 'edge' ? 'crosshair' : 'copy',
          overflow: 'hidden'
        }}
      >
        {/* Render edges first (behind nodes) */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <g key={edge.id}>
                <line
                  x1={sourceNode.position.x}
                  y1={sourceNode.position.y}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y}
                  stroke={getEdgeColor(edge.type)}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={(sourceNode.position.x + targetNode.position.x) / 2}
                  y={(sourceNode.position.y + targetNode.position.y) / 2 - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill={getEdgeColor(edge.type)}
                  fontWeight="bold"
                >
                  {edge.type}
                </text>
              </g>
            );
          })}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
        </svg>

        {/* Render nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            onClick={(e) => handleNodeClick(node.id, e)}
            onDoubleClick={(e) => handleNodeDoubleClick(node.id, e)}
            onMouseDown={(e) => handleMouseDown(node.id, e)}
            style={{
              position: 'absolute',
              left: node.position.x - 50,
              top: node.position.y - 25,
              width: 100,
              height: 50,
              background: node.type === 'vocabulary' ? '#E3F2FD' : 
                         node.type === 'practice' ? '#FFF3E0' :
                         node.type === 'test' ? '#E8F5E8' : '#FFF8E1',
              border: `3px solid ${
                selectedNodes.includes(node.id) ? '#2196F3' :
                node.type === 'vocabulary' ? '#1976D2' : 
                node.type === 'practice' ? '#F57C00' :
                node.type === 'test' ? '#4CAF50' : '#FFC107'
              }`,
              borderRadius: node.type === 'vocabulary' ? '50%' : 
                           node.type === 'test' ? '0' : '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: selectedTool === 'select' ? 'move' : 
                     selectedTool === 'edge' ? 'pointer' : 'default',
              transform: node.type === 'test' ? 'rotate(45deg)' : 'none',
              userSelect: 'none',
              boxShadow: selectedNodes.includes(node.id) ? '0 0 10px rgba(33, 150, 243, 0.5)' : 'none'
            }}
          >
            <span style={{ 
              transform: node.type === 'test' ? 'rotate(-45deg)' : 'none',
              textAlign: 'center',
              wordBreak: 'break-word',
              padding: '2px'
            }}>
              {node.label}
            </span>
          </div>
        ))}
        
        {/* Inline editor */}
        {editingNode && (
          <div style={{
            position: 'absolute',
            left: nodes.find(n => n.id === editingNode)!.position.x - 60,
            top: nodes.find(n => n.id === editingNode)!.position.y - 40,
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              border: '2px solid #2196F3',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditSubmit();
                  } else if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
                style={{
                  width: '120px',
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '4px'
                }}
                autoFocus
                placeholder="Enter node label"
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleEditSubmit}
                  style={{
                    padding: '2px 8px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={handleEditCancel}
                  style={{
                    padding: '2px 8px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#666'
          }}>
            <h2>MUD & TOTE Diagram Creator</h2>
            <p><strong>1. Create Nodes:</strong> Select a tool and click on canvas</p>
            <p><strong>2. Move Nodes:</strong> Use Select tool and drag nodes</p>
            <p><strong>3. Edit Labels:</strong> Double-click any node to edit its label</p>
            <p><strong>4. Create Edges:</strong> Select Edge tool, click source node, then target node</p>
            <p><strong>5. Export:</strong> Use JSON, SVG, or LaTeX buttons to save your diagram</p>
            <div style={{ marginTop: '20px', fontSize: '14px' }}>
              <p>• <strong>Vocabulary</strong> = Blue oval (concepts/language)</p>
              <p>• <strong>Practice</strong> = Orange rectangle (abilities/actions)</p>
              <p>• <strong>Test</strong> = Green diamond (TOTE conditions)</p>
              <p>• <strong>Operate</strong> = Yellow rectangle (TOTE operations)</p>
            </div>
          </div>
        )}
        
        {/* Edge creation feedback */}
        {selectedTool === 'edge' && selectedNodes.length === 1 && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            Click another node to create an edge
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleApp;