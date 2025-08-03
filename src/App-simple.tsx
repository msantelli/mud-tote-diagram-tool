import React, { useState, useRef, useEffect } from 'react';
import { InstallPrompt, PWAStatus } from './components/PWAComponents';

// Inline all types here to avoid import issues
interface Point {
  x: number;
  y: number;
}

interface NodeStyle {
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

interface Node {
  id: string;
  type: 'vocabulary' | 'practice' | 'test' | 'operate';
  position: Point;
  label: string;
  style?: NodeStyle;
}

interface Edge {
  id: string;
  source: string | null; // null for entry arrows
  target: string | null; // null for exit arrows
  type: 'PV' | 'VP' | 'PP' | 'VV' | 'PV-suff' | 'PV-nec' | 'VP-suff' | 'VP-nec' | 'PP-suff' | 'PP-nec' | 'VV-suff' | 'VV-nec' | 'sequence' | 'feedback' | 'loop' | 'exit' | 'entry';
  isResultant?: boolean; // Toggle for resultant relationships (dotted lines)
  // For entry/exit arrows, store position
  position?: Point;
  // For edges with null source/target, store the endpoint position
  entryPoint?: Point;
  exitPoint?: Point;
}

type DiagramMode = 'MUD' | 'TOTE' | 'HYBRID';

function SimpleApp() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'vocabulary' | 'practice' | 'test' | 'operate' | 'edge' | 'entry' | 'exit'>('select');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [diagramMode, setDiagramMode] = useState<DiagramMode>('HYBRID');
  const [showEdgeTypeSelector, setShowEdgeTypeSelector] = useState<boolean>(false);
  const [pendingEdge, setPendingEdge] = useState<{source: string, target: string} | null>(null);
  const [autoDetectEdges, setAutoDetectEdges] = useState<boolean>(true);
  const [selectedNodeForCustomization, setSelectedNodeForCustomization] = useState<string | null>(null);
  const [showCustomizationPanel, setShowCustomizationPanel] = useState<boolean>(false);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [selectedEdgeForModification, setSelectedEdgeForModification] = useState<string | null>(null);
  const [showEdgeModificationPanel, setShowEdgeModificationPanel] = useState<boolean>(false);
  
  // Canvas navigation state
  const [canvasPan, setCanvasPan] = useState<Point>({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState<number>(1.0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Global mouse event handling for better drag behavior
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (draggedNode && selectedTool === 'select' && canvasRef.current) {
        event.preventDefault();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const screenPos = { x: event.clientX - canvasRect.left, y: event.clientY - canvasRect.top };
        const worldPos = screenToWorld(screenPos);
        
        setNodes(prevNodes => prevNodes.map(node =>
          node.id === draggedNode
            ? { ...node, position: { x: worldPos.x - dragOffset.x, y: worldPos.y - dragOffset.y } }
            : node
        ));
      } else if (isPanning && canvasRef.current) {
        event.preventDefault();
        const deltaX = event.clientX - panStart.x;
        const deltaY = event.clientY - panStart.y;
        
        setCanvasPan(prevPan => ({
          x: prevPan.x + deltaX,
          y: prevPan.y + deltaY
        }));
        
        setPanStart({ x: event.clientX, y: event.clientY });
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggedNode(null);
      setIsPanning(false);
    };

    if (draggedNode || isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedNode, selectedTool, dragOffset, isPanning, panStart, canvasPan, canvasZoom]);

  // Keyboard event handling for deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle delete keys if user is editing a node name
      if (editingNode) return;
      
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        
        // Delete selected nodes
        if (selectedNodes.length > 0) {
          selectedNodes.forEach(nodeId => {
            deleteNode(nodeId);
          });
        }
        
        // Delete selected edges
        if (selectedEdges.length > 0) {
          selectedEdges.forEach(edgeId => {
            setEdges(edges.filter(edge => edge.id !== edgeId));
          });
          setSelectedEdges([]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodes, selectedEdges, nodes, edges, editingNode]);

  // Mode-specific helper functions
  const getAvailableTools = (mode: DiagramMode) => {
    switch (mode) {
      case 'MUD':
        return ['select', 'vocabulary', 'practice', 'edge'] as const;
      case 'TOTE':
        return ['select', 'test', 'operate', 'edge', 'entry', 'exit'] as const;
      case 'HYBRID':
        return ['select', 'vocabulary', 'practice', 'test', 'operate', 'edge', 'entry', 'exit'] as const;
    }
  };

  const getModeDescription = (mode: DiagramMode) => {
    switch (mode) {
      case 'MUD':
        return 'Meaning-Use Diagrams: Focus on vocabularies, practices, and semantic relations';
      case 'TOTE':
        return 'Test-Operate-Test-Exit: Focus on goal-directed behavioral cycles';
      case 'HYBRID':
        return 'Combined mode: All node types and relations available';
    }
  };

  // Coordinate transformation functions
  const screenToWorld = (screenPoint: Point): Point => {
    return {
      x: (screenPoint.x - canvasPan.x) / canvasZoom,
      y: (screenPoint.y - canvasPan.y) / canvasZoom
    };
  };

  const worldToScreen = (worldPoint: Point): Point => {
    return {
      x: worldPoint.x * canvasZoom + canvasPan.x,
      y: worldPoint.y * canvasZoom + canvasPan.y
    };
  };

  // Calculate diagram bounds for centering and export
  const calculateDiagramBounds = () => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Check all nodes
    nodes.forEach(node => {
      const dimensions = getNodeDimensions(node);
      const halfWidth = dimensions.width / 2;
      const halfHeight = dimensions.height / 2;
      
      minX = Math.min(minX, node.position.x - halfWidth);
      maxX = Math.max(maxX, node.position.x + halfWidth);
      minY = Math.min(minY, node.position.y - halfHeight);
      maxY = Math.max(maxY, node.position.y + halfHeight);
    });

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const centerDiagram = () => {
    if (!canvasRef.current) return;
    
    const bounds = calculateDiagramBounds();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calculate the center of the canvas
    const canvasCenterX = canvasRect.width / 2;
    const canvasCenterY = canvasRect.height / 2;
    
    // Calculate the center of the diagram
    const diagramCenterX = (bounds.minX + bounds.maxX) / 2;
    const diagramCenterY = (bounds.minY + bounds.maxY) / 2;
    
    // Calculate the optimal zoom to fit the diagram
    const scaleX = (canvasRect.width * 0.8) / bounds.width;
    const scaleY = (canvasRect.height * 0.8) / bounds.height;
    const optimalZoom = Math.min(scaleX, scaleY, 2.0); // Cap at 2x zoom
    
    // Set the pan to center the diagram
    setCanvasZoom(optimalZoom);
    setCanvasPan({
      x: canvasCenterX - diagramCenterX * optimalZoom,
      y: canvasCenterY - diagramCenterY * optimalZoom
    });
  };

  const getAvailableEdgeTypes = (mode: DiagramMode, _sourceType?: string, _targetType?: string, isAutoDetect: boolean = true): Edge['type'][] => {
    if (mode === 'MUD') {
      if (isAutoDetect) {
        return ['PV', 'VP', 'PP', 'VV'];
      } else {
        // Manual mode: return qualified types
        return ['PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec'];
      }
    } else if (mode === 'TOTE') {
      return ['sequence', 'feedback', 'loop', 'exit', 'entry'];
    } else {
      // HYBRID mode
      const mudTypes = isAutoDetect ? ['PV', 'VP', 'PP', 'VV'] : ['PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec'];
      return [...mudTypes, 'sequence', 'feedback', 'loop', 'exit', 'entry'];
    }
  };

  // Helper functions for node styling
  const getNodeDimensions = (node: Node) => {
    const size = node.style?.size || 'medium';
    const sizeMultiplier = size === 'small' ? 0.8 : size === 'large' ? 1.3 : 1;
    
    if (node.type === 'test') {
      const baseSize = 70;
      const adjustedSize = Math.round(baseSize * sizeMultiplier);
      return {
        width: adjustedSize,
        height: adjustedSize,
        radius: adjustedSize / 2
      };
    } else {
      const baseWidth = 100;
      const baseHeight = 50;
      return {
        width: Math.round(baseWidth * sizeMultiplier),
        height: Math.round(baseHeight * sizeMultiplier),
        radius: Math.round(baseWidth * sizeMultiplier / 2)
      };
    }
  };

  const getNodeColors = (node: Node) => {
    const defaultColors = {
      vocabulary: { background: '#E3F2FD', border: '#1976D2' },
      practice: { background: '#FFF3E0', border: '#F57C00' },
      test: { background: '#E8F5E8', border: '#4CAF50' },
      operate: { background: '#FFF8E1', border: '#FFC107' }
    };

    const defaults = defaultColors[node.type];
    return {
      background: node.style?.backgroundColor || defaults.background,
      border: node.style?.borderColor || defaults.border
    };
  };

  // Helper functions for qualified edge types
  const isQualifiedMudEdge = (edgeType: string): boolean => {
    return edgeType.includes('-suff') || edgeType.includes('-nec');
  };

  const getBaseEdgeType = (edgeType: string): string => {
    return edgeType.replace('-suff', '').replace('-nec', '');
  };

  const getEdgeQualifier = (edgeType: string): 'suff' | 'nec' | null => {
    if (edgeType.includes('-suff')) return 'suff';
    if (edgeType.includes('-nec')) return 'nec';
    return null;
  };

  const shouldShowArrowhead = (edgeType: string): boolean => {
    // Show arrowheads on all edges except entry arrows (which have no source)
    return edgeType !== 'entry';
  };

  // Helper function to calculate edge endpoints at node borders with parallel spacing
  const calculateEdgeOffset = (edge: Edge, allEdges: Edge[]): { x1: number, y1: number, x2: number, y2: number } => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) {
      return { x1: 0, y1: 0, x2: 0, y2: 0 };
    }

    // Find edges in the same direction (truly parallel)
    const sameDirectionEdges = allEdges.filter(e => 
      e.id !== undefined && e.source && e.target && // Only consider valid edges with both source and target
      e.source === edge.source && e.target === edge.target
    );
    
    // Find edges in the opposite direction (bidirectional)
    const oppositeDirectionEdges = allEdges.filter(e => 
      e.id !== undefined && e.source && e.target && // Only consider valid edges with both source and target
      e.source === edge.target && e.target === edge.source
    );
    
    // Sort by ID for consistent ordering
    sameDirectionEdges.sort((a, b) => a.id.localeCompare(b.id));
    oppositeDirectionEdges.sort((a, b) => a.id.localeCompare(b.id));

    // Handle self-referencing edges (loops) specially
    if (sourceNode.id === targetNode.id) {
      // Create a loop that curves above the node
      const nodeDim = getNodeDimensions(sourceNode);
      const radius = Math.max(nodeDim.width, nodeDim.height) / 2;
      
      // Find all self-referencing edges for this node to space them
      const selfEdges = allEdges.filter(e => 
        e.id !== undefined && e.source === sourceNode.id && e.target === sourceNode.id
      );
      selfEdges.sort((a, b) => a.id.localeCompare(b.id));
      const edgeIndex = selfEdges.findIndex(e => e.id === edge.id);
      
      // Position loops at different angles around the node
      const angleOffset = (edgeIndex * 60) - ((selfEdges.length - 1) * 30); // Spread loops around node
      const angle = (angleOffset * Math.PI) / 180; // Convert to radians
      
      // Calculate loop start and end points
      const startAngle = angle - 0.3; // Start slightly before the main angle
      const endAngle = angle + 0.3;   // End slightly after the main angle
      
      const x1 = sourceNode.position.x + (radius + 10) * Math.cos(startAngle);
      const y1 = sourceNode.position.y + (radius + 10) * Math.sin(startAngle);
      const x2 = sourceNode.position.x + (radius + 10) * Math.cos(endAngle);
      const y2 = sourceNode.position.y + (radius + 10) * Math.sin(endAngle);
      
      return { x1, y1, x2, y2 };
    }

    // Calculate base line vector from center to center
    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return { x1: sourceNode.position.x, y1: sourceNode.position.y, x2: targetNode.position.x, y2: targetNode.position.y };

    // Normalized direction vector
    const dirX = dx / length;
    const dirY = dy / length;

    // Calculate perpendicular offset for parallel edges
    let perpOffset = 0;
    
    // Handle same-direction (parallel) edges
    if (sameDirectionEdges.length > 1) {
      const edgeIndex = sameDirectionEdges.findIndex(e => e.id === edge.id);
      if (edgeIndex !== -1) {
        const totalEdges = Math.min(sameDirectionEdges.length, 3); // Limit to 3 for performance
        const spacing = totalEdges === 2 ? 25 : 30;
        perpOffset = (edgeIndex - (totalEdges - 1) / 2) * spacing;
      }
    }
    
    // Handle bidirectional edges (opposite directions) - curve them to opposite sides
    if (oppositeDirectionEdges.length > 0) {
      // If there are opposite direction edges, curve this edge to one side
      // and the opposite direction edges will curve to the other side
      const hasOppositeEdges = oppositeDirectionEdges.length > 0;
      
      if (hasOppositeEdges) {
        // Curve same-direction edges to one side (positive offset)
        const baseCurve = 35; // Base curve amount for bidirectional separation
        if (sameDirectionEdges.length === 1) {
          // Single edge in this direction, curve moderately
          perpOffset = baseCurve;
        } else {
          // Multiple edges in same direction, combine parallel spacing with bidirectional curve
          perpOffset += baseCurve;
        }
      }
    }

    // Get node dimensions for border calculation
    const sourceDim = getNodeDimensions(sourceNode);
    const targetDim = getNodeDimensions(targetNode);

    // Calculate proper intersection distance based on node shape and direction
    const calculateIntersectionDistance = (node: Node, dim: { width: number; height: number; radius: number }, dirX: number, dirY: number) => {
      if (node.type === 'vocabulary') {
        // Ellipse intersection: use correct parametric calculation
        const rx = dim.width / 2; // Half width
        const ry = dim.height / 2; // Half height
        
        // For ellipse intersection: t = 1 / sqrt((cos²θ/a²) + (sin²θ/b²))
        // where θ is angle from center to point, a=rx, b=ry
        const cosTheta = Math.abs(dirX);
        const sinTheta = Math.abs(dirY);
        return 1 / Math.sqrt((cosTheta * cosTheta) / (rx * rx) + (sinTheta * sinTheta) / (ry * ry));
      } else if (node.type === 'test') {
        // Diamond shape needs special handling
        return dim.radius * 1.2;
      } else {
        // Rectangle intersection (practice, operate) - use same logic as PP (working correctly)
        const halfWidth = dim.width / 2;
        const halfHeight = dim.height / 2;
        
        // Calculate intersection with rectangle border using consistent method
        if (Math.abs(dirX) > Math.abs(dirY)) {
          // Hit left/right edge
          return halfWidth / Math.abs(dirX);
        } else {
          // Hit top/bottom edge  
          return halfHeight / Math.abs(dirY);
        }
      }
    };

    const sourceRadius = calculateIntersectionDistance(sourceNode, sourceDim, dirX, dirY);
    const targetRadius = calculateIntersectionDistance(targetNode, targetDim, dirX, dirY);

    // Calculate offset centers for parallel edges
    const sourceCenterX = sourceNode.position.x + (perpOffset * -dy / length);
    const sourceCenterY = sourceNode.position.y + (perpOffset * dx / length);
    const targetCenterX = targetNode.position.x + (perpOffset * -dy / length);
    const targetCenterY = targetNode.position.y + (perpOffset * dx / length);

    // Calculate edge start/end points at node borders (arrows touch nodes)
    const x1 = sourceCenterX + dirX * sourceRadius; // Start at border
    const y1 = sourceCenterY + dirY * sourceRadius;
    const x2 = targetCenterX - dirX * targetRadius; // End at border (arrow touches)
    const y2 = targetCenterY - dirY * targetRadius;

    return { x1, y1, x2, y2 };
  };

  const handleModeChange = (newMode: DiagramMode) => {
    setDiagramMode(newMode);
    // Reset to select tool when changing modes
    setSelectedTool('select');
    setSelectedNodes([]);
  };

  const addNode = (x: number, y: number) => {
    if (selectedTool === 'select' || selectedTool === 'edge') return;
    
    // Handle entry and exit arrows
    if (selectedTool === 'entry' || selectedTool === 'exit') {
      const newEdge: Edge = {
        id: Date.now().toString(),
        source: selectedTool === 'entry' ? null : 'standalone',
        target: selectedTool === 'exit' ? null : 'standalone',
        type: selectedTool,
        position: { x, y },
        entryPoint: selectedTool === 'entry' ? { x, y } : undefined,
        exitPoint: selectedTool === 'exit' ? { x, y } : undefined
      };
      setEdges([...edges, newEdge]);
      return;
    }
    
    const newNode: Node = {
      id: Date.now().toString(),
      type: selectedTool,
      position: { x, y },
      label: `${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} ${nodes.length + 1}`
    };
    
    setNodes([...nodes, newNode]);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && canvasRef.current && selectedTool !== 'select') {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      const worldPos = screenToWorld({ x: screenX, y: screenY });
      addNode(worldPos.x, worldPos.y);
      setSelectedNodes([]);
      setSelectedEdges([]); // Clear edge selections too
    }
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 1 || (event.button === 0 && selectedTool === 'select' && event.target === event.currentTarget)) {
      // Middle mouse button or left click with select tool on empty canvas
      event.preventDefault();
      setIsPanning(true);
      setPanStart({ x: event.clientX, y: event.clientY });
      // Clear selections when panning
      setSelectedNodes([]);
      setSelectedEdges([]);
    }
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (canvasRef.current) {
      event.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Zoom factor
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3.0, canvasZoom * zoomFactor));
      
      // Calculate new pan to zoom around mouse position
      const zoomChange = newZoom / canvasZoom;
      const newPanX = mouseX - (mouseX - canvasPan.x) * zoomChange;
      const newPanY = mouseY - (mouseY - canvasPan.y) * zoomChange;
      
      setCanvasZoom(newZoom);
      setCanvasPan({ x: newPanX, y: newPanY });
    }
  };

  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (selectedTool === 'edge') {
      if (selectedNodes.length === 0) {
        setSelectedNodes([nodeId]);
      } else if (selectedNodes.length === 1 && selectedNodes[0] !== nodeId) {
        const sourceNode = nodes.find(n => n.id === selectedNodes[0])!;
        const targetNode = nodes.find(n => n.id === nodeId)!;
        
        // Use auto-detection if enabled, otherwise show selector
        if (autoDetectEdges && diagramMode === 'MUD') {
          // Auto-detect MUD edge type
          let edgeType: Edge['type'];
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
        } else {
          // Show edge type selector for manual selection (always for TOTE or manual MUD)
          setPendingEdge({ source: selectedNodes[0], target: nodeId });
          setShowEdgeTypeSelector(true);
          setSelectedNodes([]);
        }
      }
    } else {
      setSelectedNodes([nodeId]);
    }
  };

  const handleMouseDown = (nodeId: string, event: React.MouseEvent) => {
    if (selectedTool === 'select' && canvasRef.current) {
      event.preventDefault();
      event.stopPropagation();
      const node = nodes.find(n => n.id === nodeId)!;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      setDraggedNode(nodeId);
      const screenPos = { x: event.clientX - canvasRect.left, y: event.clientY - canvasRect.top };
      const worldPos = screenToWorld(screenPos);
      setDragOffset({
        x: worldPos.x - node.position.x,
        y: worldPos.y - node.position.y
      });
    }
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

  const createEdgeWithType = (edgeType: Edge['type']) => {
    if (pendingEdge) {
      const newEdge: Edge = {
        id: Date.now().toString(),
        source: pendingEdge.source,
        target: pendingEdge.target,
        type: edgeType
      };
      
      setEdges([...edges, newEdge]);
      setPendingEdge(null);
      setShowEdgeTypeSelector(false);
    }
  };

  const cancelEdgeCreation = () => {
    setPendingEdge(null);
    setShowEdgeTypeSelector(false);
  };

  // Node customization functions
  const openCustomizationPanel = (nodeId: string) => {
    setSelectedNodeForCustomization(nodeId);
    setShowCustomizationPanel(true);
  };

  const closeCustomizationPanel = () => {
    setSelectedNodeForCustomization(null);
    setShowCustomizationPanel(false);
  };

  const updateNodeStyle = (nodeId: string, styleUpdate: Partial<NodeStyle>) => {
    setNodes(nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          style: { ...node.style, ...styleUpdate }
        };
      }
      return node;
    }));
  };

  const resetNodeStyle = (nodeId: string) => {
    setNodes(nodes.map(node => {
      if (node.id === nodeId) {
        const { style, ...nodeWithoutStyle } = node;
        return nodeWithoutStyle;
      }
      return node;
    }));
  };

  // Edge modification functions
  const handleEdgeClick = (edgeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (selectedTool === 'select') {
      setSelectedEdges([edgeId]);
      setSelectedNodes([]); // Clear node selection when selecting edges
    }
  };

  const openEdgeModificationPanel = (edgeId: string) => {
    setSelectedEdgeForModification(edgeId);
    setShowEdgeModificationPanel(true);
  };

  const closeEdgeModificationPanel = () => {
    setSelectedEdgeForModification(null);
    setShowEdgeModificationPanel(false);
  };

  const updateEdgeType = (edgeId: string, newType: Edge['type']) => {
    setEdges(edges.map(edge => {
      if (edge.id === edgeId) {
        return { ...edge, type: newType };
      }
      return edge;
    }));
  };

  const toggleEdgeResultant = (edgeId: string, isResultant: boolean) => {
    setEdges(edges.map(edge => {
      if (edge.id === edgeId) {
        return { ...edge, isResultant };
      }
      return edge;
    }));
  };

  const deleteEdge = (edgeId: string) => {
    setEdges(edges.filter(edge => edge.id !== edgeId));
    setSelectedEdges([]);
    closeEdgeModificationPanel();
  };

  const deleteNode = (nodeId: string) => {
    // Remove the node
    setNodes(nodes.filter(node => node.id !== nodeId));
    // Remove any edges connected to this node
    setEdges(edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    // Clear selections and editing state
    setSelectedNodes([]);
    if (editingNode === nodeId) {
      setEditingNode(null);
      setEditText('');
    }
    closeCustomizationPanel();
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
    const bounds = calculateDiagramBounds();
    
    // Create SVG content with dynamic sizing
    const svgContent = `
      <svg width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}" xmlns="http://www.w3.org/2000/svg">
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
          
          const color = getEdgeColor(edge.type, edge.isResultant);
          const coords = calculateEdgeOffset(edge, edges);
          const dashArray = edge.isResultant ? 'stroke-dasharray="5,5"' : '';
          const isLoop = sourceNode.id === targetNode.id;
          
          if (isLoop) {
            // Use curved path for self-referencing edges
            return `
              <path d="M ${coords.x1} ${coords.y1} A 30 30 0 1 1 ${coords.x2} ${coords.y2}" 
                    stroke="${color}" stroke-width="2" fill="none" ${dashArray} marker-end="url(#arrowhead)"/>
              <text x="${sourceNode.position.x}" 
                    y="${sourceNode.position.y - 50}" 
                    text-anchor="middle" font-size="12" fill="${color}" font-weight="bold">
                ${edge.type}
              </text>
            `;
          } else {
            // Use straight line for regular edges
            return `
              <line x1="${coords.x1}" y1="${coords.y1}" 
                    x2="${coords.x2}" y2="${coords.y2}" 
                    stroke="${color}" stroke-width="2" ${dashArray} marker-end="url(#arrowhead)"/>
              <text x="${(coords.x1 + coords.x2) / 2}" 
                    y="${(coords.y1 + coords.y2) / 2 - 10}" 
                    text-anchor="middle" font-size="12" fill="${color}" font-weight="bold">
                ${edge.type}
              </text>
            `;
          }
        }).join('')}
        
        <!-- Nodes -->
        ${nodes.map(node => {
          const colors = getNodeColors(node);
          const dimensions = getNodeDimensions(node);
          const bgColor = colors.background;
          const borderColor = colors.border;
          
          if (node.type === 'vocabulary') {
            return `
              <ellipse cx="${node.position.x}" cy="${node.position.y}" 
                       rx="${dimensions.radius}" ry="${dimensions.height/2}" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
              <text x="${node.position.x}" y="${node.position.y + 5}" 
                    text-anchor="middle" font-size="12" font-weight="bold" fill="${node.style?.textColor || '#000000'}">${node.label}</text>
            `;
          } else if (node.type === 'test') {
            const halfSize = dimensions.width / 2;
            return `
              <g transform="translate(${node.position.x}, ${node.position.y}) rotate(45)">
                <rect x="-${halfSize}" y="-${halfSize}" width="${dimensions.width}" height="${dimensions.height}" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
              </g>
              <text x="${node.position.x}" y="${node.position.y + 5}" 
                    text-anchor="middle" font-size="12" font-weight="bold" fill="${node.style?.textColor || '#000000'}">${node.label}</text>
            `;
          } else {
            return `
              <rect x="${node.position.x - dimensions.radius}" y="${node.position.y - dimensions.height/2}" 
                    width="${dimensions.width}" height="${dimensions.height}" rx="8" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
              <text x="${node.position.x}" y="${node.position.y + 5}" 
                    text-anchor="middle" font-size="12" font-weight="bold" fill="${node.style?.textColor || '#000000'}">${node.label}</text>
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
    % MUD relation styles
    pv/.style={->, thick, color=testcolor},
    vp/.style={->, thick, color=practicecolor},
    pp/.style={->, thick, color=purple},
    vv/.style={->, thick, color=red},
    resultant/.style={->, thick, dashed, color=gray},
    % TOTE relation styles
    sequence/.style={->, thick, color=blue},
    feedback/.style={->, thick, color=orange, bend left=20},
    loop/.style={->, thick, color=teal, loop above},
    exit/.style={->, thick, color=brown, double}
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
        // MUD relations
        'PV': 'pv',
        'VP': 'vp', 
        'PP': 'pp',
        'VV': 'vv',
        'resultant': 'resultant',
        // TOTE relations
        'sequence': 'sequence',
        'feedback': 'feedback',
        'loop': 'loop',
        'exit': 'exit'
      };
      
      const style = styleMap[edge.type as keyof typeof styleMap] || 'pv';
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

  const getEdgeColor = (type: string, isResultant: boolean = false) => {
    const baseType = getBaseEdgeType(type);
    const qualifier = getEdgeQualifier(type);
    
    // Base colors for MUD relations
    let baseColor;
    switch (baseType) {
      case 'PV': baseColor = '#4CAF50'; break; // Green
      case 'VP': baseColor = '#FF9800'; break; // Orange  
      case 'PP': baseColor = '#9C27B0'; break; // Purple
      case 'VV': baseColor = '#F44336'; break; // Red
      // TOTE relations
      case 'sequence': baseColor = '#2196F3'; break; // Blue
      case 'feedback': baseColor = '#FF5722'; break; // Deep Orange
      case 'loop': baseColor = '#607D8B'; break; // Blue Grey
      case 'exit': baseColor = '#8BC34A'; break; // Light Green
      case 'entry': baseColor = '#4CAF50'; break; // Green
      default: baseColor = '#666'; break;
    }
    
    // Modify color based on qualifier
    if (qualifier === 'suff') {
      return baseColor; // Keep original color for sufficient
    } else if (qualifier === 'nec') {
      // Darker/more saturated for necessary
      return baseColor.replace('#4CAF50', '#2E7D32') // Darker green
                     .replace('#FF9800', '#E65100') // Darker orange
                     .replace('#9C27B0', '#6A1B9A') // Darker purple
                     .replace('#F44336', '#C62828'); // Darker red
    } else if (isResultant) {
      // Lighter/grayed out for resultant relationships
      return baseColor.replace('#4CAF50', '#81C784') // Lighter green
                     .replace('#FF9800', '#FFB74D') // Lighter orange
                     .replace('#9C27B0', '#BA68C8') // Lighter purple
                     .replace('#F44336', '#E57373'); // Lighter red
    }
    
    return baseColor;
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* PWA Components */}
      <PWAStatus />
      <InstallPrompt />
      {/* Header */}
      <div style={{ 
        background: '#1976D2', 
        color: 'white', 
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>MUD & TOTE Diagram Tool</h1>
          
          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px' }}>
            {(['MUD', 'TOTE', 'HYBRID'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
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
                onChange={(e) => setAutoDetectEdges(e.target.checked)}
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
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Tools - filtered by mode */}
          {getAvailableTools(diagramMode).map(tool => (
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
          
          {/* Navigation button */}
          <button
            onClick={centerDiagram}
            disabled={nodes.length === 0}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255,255,255,0.3)',
              background: nodes.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(156,39,176,0.8)',
              color: nodes.length === 0 ? 'rgba(255,255,255,0.5)' : 'white',
              borderRadius: '4px',
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🎯 Center
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
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleCanvasWheel}
        style={{ 
          flex: 1, 
          background: '#fafafa',
          position: 'relative',
          cursor: selectedTool === 'select' ? 'default' : 
                  selectedTool === 'edge' ? 'crosshair' : 
                  selectedTool === 'entry' || selectedTool === 'exit' ? 'crosshair' : 'copy',
          overflow: 'hidden'
        }}
      >
        {/* Render edges first (behind nodes) */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <g transform={`translate(${canvasPan.x}, ${canvasPan.y}) scale(${canvasZoom})`}>
          {edges.map(edge => {
            // Handle entry and exit arrows
            if (edge.type === 'entry' && edge.entryPoint) {
              return (
                <g key={edge.id}>
                  <line
                    x1={edge.entryPoint.x - 40}
                    y1={edge.entryPoint.y}
                    x2={edge.entryPoint.x}
                    y2={edge.entryPoint.y}
                    stroke={getEdgeColor(edge.type, edge.isResultant)}
                    strokeWidth="3"
                    markerEnd="url(#arrowhead)"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    onClick={(e) => handleEdgeClick(edge.id, e)}
                  />
                  <text
                    x={edge.entryPoint.x - 50}
                    y={edge.entryPoint.y - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill={getEdgeColor(edge.type, edge.isResultant)}
                    fontWeight="bold"
                    style={{ cursor: 'pointer', userSelect: 'none', pointerEvents: 'auto' }}
                    onClick={(e) => handleEdgeClick(edge.id, e)}
                  >
                    ENTRY
                  </text>
                </g>
              );
            }
            
            if (edge.type === 'exit' && edge.exitPoint) {
              return (
                <g key={edge.id}>
                  <line
                    x1={edge.exitPoint.x}
                    y1={edge.exitPoint.y}
                    x2={edge.exitPoint.x + 40}
                    y2={edge.exitPoint.y}
                    stroke={getEdgeColor(edge.type, edge.isResultant)}
                    strokeWidth="3"
                    markerEnd="url(#arrowhead)"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    onClick={(e) => handleEdgeClick(edge.id, e)}
                  />
                  <text
                    x={edge.exitPoint.x + 50}
                    y={edge.exitPoint.y - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill={getEdgeColor(edge.type, edge.isResultant)}
                    fontWeight="bold"
                    style={{ cursor: 'pointer', userSelect: 'none', pointerEvents: 'auto' }}
                    onClick={(e) => handleEdgeClick(edge.id, e)}
                  >
                    EXIT
                  </text>
                </g>
              );
            }
            
            // Regular edges between nodes
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            // Calculate offset coordinates for parallel edge spacing
            const coords = calculateEdgeOffset(edge, edges);
            
            // Check if this is a self-referencing edge (loop)
            const isLoop = sourceNode.id === targetNode.id;
            
            return (
              <g key={edge.id}>
                {isLoop ? (
                  // Curved path for self-referencing edges
                  <>
                    {/* Invisible thicker path for easier clicking */}
                    <path
                      d={`M ${coords.x1} ${coords.y1} A 30 30 0 1 1 ${coords.x2} ${coords.y2}`}
                      stroke="transparent"
                      strokeWidth="12"
                      fill="none"
                      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                      onClick={(e) => handleEdgeClick(edge.id, e)}
                    />
                    {/* Visible curved edge */}
                    <path
                      d={`M ${coords.x1} ${coords.y1} A 30 30 0 1 1 ${coords.x2} ${coords.y2}`}
                      stroke={getEdgeColor(edge.type, edge.isResultant)}
                      strokeWidth={selectedEdges.includes(edge.id) ? "4" : "2"}
                      strokeDasharray={edge.isResultant ? '5,5' : 'none'}
                      fill="none"
                      markerEnd={shouldShowArrowhead(edge.type) ? "url(#arrowhead)" : 'none'}
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                ) : (
                  // Straight line for regular edges
                  <>
                    {/* Invisible thicker line for easier clicking */}
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke="transparent"
                      strokeWidth="12"
                      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                      onClick={(e) => handleEdgeClick(edge.id, e)}
                    />
                    {/* Visible edge line */}
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke={getEdgeColor(edge.type, edge.isResultant)}
                      strokeWidth={selectedEdges.includes(edge.id) ? "4" : "2"}
                      strokeDasharray={edge.isResultant ? '5,5' : 'none'}
                      markerEnd={shouldShowArrowhead(edge.type) ? "url(#arrowhead)" : 'none'}
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                )}
                <text
                  x={isLoop ? sourceNode.position.x : (coords.x1 + coords.x2) / 2}
                  y={isLoop ? sourceNode.position.y - 50 : (coords.y1 + coords.y2) / 2 - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill={getEdgeColor(edge.type, edge.isResultant)}
                  fontWeight="bold"
                  style={{ cursor: 'pointer', userSelect: 'none', pointerEvents: 'auto' }}
                  onClick={(e) => handleEdgeClick(edge.id, e)}
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
          </g>
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
              left: worldToScreen(node.position).x - (getNodeDimensions(node).width * canvasZoom) / 2,
              top: worldToScreen(node.position).y - (getNodeDimensions(node).height * canvasZoom) / 2,
              width: getNodeDimensions(node).width * canvasZoom,
              height: getNodeDimensions(node).height * canvasZoom,
              background: getNodeColors(node).background,
              border: `${3 * canvasZoom}px solid ${
                selectedNodes.includes(node.id) ? '#2196F3' : getNodeColors(node).border
              }`,
              borderRadius: node.type === 'vocabulary' ? '50%' : 
                           node.type === 'test' ? '0' : `${8 * canvasZoom}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${12 * canvasZoom}px`,
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
              padding: '2px',
              color: node.style?.textColor || '#000000'
            }}>
              {node.label}
            </span>
          </div>
        ))}
        
        {/* Inline editor */}
        {editingNode && nodes.find(n => n.id === editingNode) && (
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
            color: '#666',
            maxWidth: '600px'
          }}>
            <h2>MUD & TOTE Diagram Creator</h2>
            <div style={{ 
              background: diagramMode === 'MUD' ? '#E3F2FD' : 
                          diagramMode === 'TOTE' ? '#E8F5E8' : '#F3E5F5',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: `2px solid ${diagramMode === 'MUD' ? '#1976D2' : 
                                   diagramMode === 'TOTE' ? '#4CAF50' : '#9C27B0'}`
            }}>
              <strong>Current Mode: {diagramMode}</strong>
              <br />
              <em style={{ fontSize: '14px' }}>{getModeDescription(diagramMode)}</em>
            </div>
            
            <p><strong>1. Create Nodes:</strong> Select a tool and click on canvas</p>
            <p><strong>2. Move Nodes:</strong> Use Select tool and drag nodes</p>
            <p><strong>3. Edit Labels:</strong> Double-click any node to edit its label</p>
            <p><strong>4. Create Edges:</strong> Select Edge tool, click source node, then target node</p>
            <p><strong>5. Export:</strong> Use JSON, SVG, or LaTeX buttons to save your diagram</p>
            
            <div style={{ marginTop: '20px', fontSize: '14px' }}>
              {diagramMode === 'MUD' && (
                <>
                  <p>• <strong>Vocabulary</strong> = Blue oval (concepts/language)</p>
                  <p>• <strong>Practice</strong> = Orange rectangle (abilities/actions)</p>
                  <p>• <strong>Relations</strong>: PV (green), VP (orange), PP (purple), VV (red)</p>
                </>
              )}
              {diagramMode === 'TOTE' && (
                <>
                  <p>• <strong>Test</strong> = Green diamond (conditions/decisions)</p>
                  <p>• <strong>Operate</strong> = Yellow rectangle (actions/operations)</p>
                  <p>• <strong>Relations</strong>: Sequence (blue), Feedback (orange), Loop (grey)</p>
                </>
              )}
              {diagramMode === 'HYBRID' && (
                <>
                  <p>• <strong>Vocabulary</strong> = Blue oval | <strong>Practice</strong> = Orange rectangle</p>
                  <p>• <strong>Test</strong> = Green diamond | <strong>Operate</strong> = Yellow rectangle</p>
                  <p>• <strong>All relation types available</strong></p>
                </>
              )}
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

        {/* Customize button for selected nodes */}
        {selectedTool === 'select' && selectedNodes.length === 1 && (
          <button
            onClick={() => openCustomizationPanel(selectedNodes[0])}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              zIndex: 1000
            }}
          >
            🎨 Customize Node
          </button>
        )}

        {/* Modify button for selected edges */}
        {selectedTool === 'select' && selectedEdges.length === 1 && (
          <button
            onClick={() => openEdgeModificationPanel(selectedEdges[0])}
            style={{
              position: 'absolute',
              top: '50px',
              right: '10px',
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              zIndex: 1000
            }}
          >
            ⚙️ Modify Edge
          </button>
        )}

        {/* Edge Type Selector Modal */}
        {showEdgeTypeSelector && pendingEdge && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              minWidth: '300px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Select Edge Type</h3>
              
              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                {getAvailableEdgeTypes(diagramMode, undefined, undefined, autoDetectEdges).map(edgeType => {
                  let description = '';
                  // Simple MUD relations
                  if (edgeType === 'PV') description = 'Practice → Vocabulary';
                  else if (edgeType === 'VP') description = 'Vocabulary → Practice';
                  else if (edgeType === 'PP') description = 'Practice → Practice';
                  else if (edgeType === 'VV') description = 'Vocabulary → Vocabulary';
                  // Qualified MUD relations
                  else if (edgeType === 'PV-suff') description = 'Practice → Vocabulary (Sufficient)';
                  else if (edgeType === 'PV-nec') description = 'Practice → Vocabulary (Necessary)';
                  else if (edgeType === 'VP-suff') description = 'Vocabulary → Practice (Sufficient)';
                  else if (edgeType === 'VP-nec') description = 'Vocabulary → Practice (Necessary)';
                  else if (edgeType === 'PP-suff') description = 'Practice → Practice (Sufficient)';
                  else if (edgeType === 'PP-nec') description = 'Practice → Practice (Necessary)';
                  else if (edgeType === 'VV-suff') description = 'Vocabulary → Vocabulary (Sufficient)';
                  else if (edgeType === 'VV-nec') description = 'Vocabulary → Vocabulary (Necessary)';
                  // TOTE relations
                  else if (edgeType === 'sequence') description = 'Sequential action';
                  else if (edgeType === 'feedback') description = 'Feedback loop';
                  else if (edgeType === 'loop') description = 'Iterative loop';
                  else if (edgeType === 'exit') description = 'Exit condition';
                  else if (edgeType === 'entry') description = 'Entry point';
                  
                  return (
                    <button
                      key={edgeType}
                      onClick={() => createEdgeWithType(edgeType)}
                      style={{
                        padding: '12px 16px',
                        border: '2px solid #e0e0e0',
                        background: '#fafafa',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        color: getEdgeColor(edgeType),
                        fontWeight: 'bold'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f0f0f0';
                        e.currentTarget.style.borderColor = getEdgeColor(edgeType);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#fafafa';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    >
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{edgeType}</div>
                      <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>{description}</div>
                    </button>
                  );
                })}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={cancelEdgeCreation}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Node Customization Panel */}
        {showCustomizationPanel && selectedNodeForCustomization && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
              minWidth: '320px',
              maxWidth: '400px'
            }}>
              {(() => {
                const node = nodes.find(n => n.id === selectedNodeForCustomization);
                if (!node) return null;
                const currentStyle = node.style || { size: 'medium' };
                
                return (
                  <>
                    <h3 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>
                      Customize {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node
                    </h3>
                    
                    {/* Size Selection */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
                        Size:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['small', 'medium', 'large'] as const).map(size => (
                          <button
                            key={size}
                            onClick={() => updateNodeStyle(selectedNodeForCustomization, { size })}
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
                        onChange={(e) => updateNodeStyle(selectedNodeForCustomization, { backgroundColor: e.target.value })}
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
                        onChange={(e) => updateNodeStyle(selectedNodeForCustomization, { borderColor: e.target.value })}
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
                        onChange={(e) => updateNodeStyle(selectedNodeForCustomization, { textColor: e.target.value })}
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                      <button
                        onClick={() => resetNodeStyle(selectedNodeForCustomization)}
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #FF9800',
                          background: '#FFF3E0',
                          color: '#FF9800',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        Reset Style
                      </button>
                      <button
                        onClick={() => deleteNode(selectedNodeForCustomization)}
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #f44336',
                          background: '#ffebee',
                          color: '#f44336',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Delete Node
                      </button>
                      <button
                        onClick={closeCustomizationPanel}
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #4CAF50',
                          background: '#4CAF50',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Edge Modification Panel */}
        {showEdgeModificationPanel && selectedEdgeForModification && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
              minWidth: '320px',
              maxWidth: '400px'
            }}>
              {(() => {
                const edge = edges.find(e => e.id === selectedEdgeForModification);
                if (!edge) return null;
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                return (
                  <>
                    <h3 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>
                      Modify Edge: {edge.type}
                    </h3>
                    
                    {sourceNode && targetNode && (
                      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                        {sourceNode.label} → {targetNode.label}
                      </div>
                    )}
                    
                    {/* Edge Type Selection */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#666' }}>
                        Edge Type:
                      </label>
                      <div style={{ display: 'grid', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                        {getAvailableEdgeTypes(diagramMode, sourceNode?.type, targetNode?.type, autoDetectEdges).map(edgeType => (
                          <button
                            key={edgeType}
                            onClick={() => updateEdgeType(selectedEdgeForModification, edgeType)}
                            style={{
                              padding: '8px 12px',
                              border: `2px solid ${edge.type === edgeType ? '#2196F3' : '#ddd'}`,
                              background: edge.type === edgeType ? '#E3F2FD' : '#f9f9f9',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '12px',
                              fontWeight: edge.type === edgeType ? 'bold' : 'normal'
                            }}
                          >
                            <div style={{ color: getEdgeColor(edgeType), fontWeight: 'bold' }}>{edgeType}</div>
                            <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                              {edgeType.includes('-suff') ? 'Sufficient relation' : 
                               edgeType.includes('-nec') ? 'Necessary relation' : 
                               'Basic relation'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resultant Toggle */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        background: edge.isResultant ? '#E8F5E8' : '#f9f9f9',
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="checkbox"
                          checked={edge.isResultant || false}
                          onChange={(e) => toggleEdgeResultant(selectedEdgeForModification, e.target.checked)}
                          style={{ 
                            width: '18px', 
                            height: '18px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ fontWeight: 'bold', color: '#666' }}>
                          Resultant Relationship
                        </span>
                      </label>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', marginLeft: '26px' }}>
                        {edge.isResultant ? 
                          'This relationship is derived/indirect (dotted line)' : 
                          'This relationship is direct (solid line)'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                      <button
                        onClick={() => deleteEdge(selectedEdgeForModification)}
                        style={{
                          padding: '10px 16px',
                          border: '2px solid #f44336',
                          background: '#ffebee',
                          color: '#f44336',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        🗑️ Delete
                      </button>
                      <button
                        onClick={closeEdgeModificationPanel}
                        style={{
                          padding: '10px 16px',
                          border: '2px solid #2196F3',
                          background: '#2196F3',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleApp;