import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { useD3 } from '../../hooks/useD3';
import { useDiagram } from '../../hooks/useDiagram';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setZoom, setPanOffset, setCanvasSize, setPendingEdge, setShowEdgeTypeSelector, setPendingEntryExit, setSelectedNodeForCustomization } from '../../store/uiSlice';
import { addEdge, addEntryPoint, addExitPoint, updateEntryPoint, saveToHistory } from '../../store/diagramSlice';
import { Grid } from '../Grid';
import { getSnappedPosition } from '../../utils/gridUtils';
import { getNodeColors, getNodeDimensions } from '../../utils/nodeUtils';
import type { Node, Edge, Point } from '../../types/all';
import './Canvas.css';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { nodes, edges, selectedItems, selectedTool, addNewNode, moveNode, selectNode, clearCurrentSelection } = useDiagram();
  const currentDiagram = useAppSelector(state => state.diagram.currentDiagram);
  const entryPoints = currentDiagram?.entryPoints || [];
  const exitPoints = currentDiagram?.exitPoints || [];
  const zoom = useAppSelector(state => state.ui.zoom);
  const panOffset = useAppSelector(state => state.ui.panOffset);
  const diagramMode = useAppSelector(state => state.ui.diagramMode);
  const autoDetectEdges = useAppSelector(state => state.ui.autoDetectEdges);
  const showUnmarkedEdges = useAppSelector(state => state.ui.showUnmarkedEdges);
  const canvasSize = useAppSelector(state => state.ui.canvasSize);
  const snapToGrid = useAppSelector(state => state.ui.snapToGrid);
  const gridSpacing = useAppSelector(state => state.ui.gridSpacing);
  const pendingEntryExit = useAppSelector(state => state.ui.pendingEntryExit);
  const dispatch = useAppDispatch();
  
  // Flag to prevent infinite loop between Redux and D3 zoom
  const isUpdatingFromRedux = useRef(false);
  
  // Local state for edge creation workflow
  const [edgeSourceNodeId, setEdgeSourceNodeId] = React.useState<string | null>(null);

  // Helper function to auto-detect MUD edge type
  const autoDetectMUDEdgeType = (sourceNode: Node, targetNode: Node): Edge['type'] => {
    if (sourceNode.type === 'practice' && targetNode.type === 'vocabulary') {
      return 'PV';
    } else if (sourceNode.type === 'vocabulary' && targetNode.type === 'practice') {
      return 'VP';
    } else if (sourceNode.type === 'practice' && targetNode.type === 'practice') {
      return 'PP';
    } else {
      return 'VV';
    }
  };

  // Handle edge creation between two nodes
  const handleEdgeCreation = (sourceNodeId: string, targetNodeId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    const targetNode = nodes.find(n => n.id === targetNodeId);
    
    if (!sourceNode || !targetNode) return;

    if (showUnmarkedEdges) {
      // Create unmarked edge immediately
      dispatch(saveToHistory());
      dispatch(addEdge({
        source: sourceNodeId,
        target: targetNodeId,
        type: 'unmarked'
      }));
    } else if (autoDetectEdges && diagramMode === 'MUD') {
      // Auto-detect MUD edge type and create immediately
      const edgeType = autoDetectMUDEdgeType(sourceNode, targetNode);
      dispatch(saveToHistory());
      dispatch(addEdge({
        source: sourceNodeId,
        target: targetNodeId,
        type: edgeType
      }));
    } else {
      // Show edge type selector for manual selection
      dispatch(setPendingEdge({ source: sourceNodeId, target: targetNodeId }));
      dispatch(setShowEdgeTypeSelector(true));
    }
    
    // Reset edge creation state
    setEdgeSourceNodeId(null);
  };

  // Reset edge creation state when tool changes
  React.useEffect(() => {
    if (selectedTool !== 'edge') {
      setEdgeSourceNodeId(null);
    }
  }, [selectedTool]);

  // Handle canvas clicks for creating nodes
  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    console.log('🖱️ Canvas clicked - Tool:', selectedTool);
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const rawX = (event.clientX - rect.left - panOffset.x) / zoom;
    const rawY = (event.clientY - rect.top - panOffset.y) / zoom;
    
    // Apply grid snapping if enabled
    const { x, y } = getSnappedPosition({ x: rawX, y: rawY }, gridSpacing, snapToGrid);

    // Handle node creation tools
    if (selectedTool === 'vocabulary') {
      console.log('🎯 Creating vocabulary node at', { x, y });
      addNewNode('vocabulary', { x, y });
    } else if (selectedTool === 'practice') {
      addNewNode('practice', { x, y });
    } else if (selectedTool === 'test') {
      addNewNode('test', { x, y });
    } else if (selectedTool === 'operate') {
      addNewNode('operate', { x, y });
    } else if (selectedTool === 'entry') {
      // Entry point workflow: 
      // 1. If no pending entry, create entry point and wait for target node
      // 2. If pending entry exists, this is a second click - just clear pending
      if (!pendingEntryExit) {
        dispatch(setPendingEntryExit({ type: 'entry' }));
        dispatch(saveToHistory());
        dispatch(addEntryPoint({
          position: { x, y },
          targetNodeId: '' // Will be set when user clicks on a node
        }));
      } else if (pendingEntryExit.type === 'entry') {
        // Clear pending state if clicking on canvas again
        dispatch(setPendingEntryExit(null));
      }
    } else if (selectedTool === 'exit') {
      // Exit point workflow:
      // If no pending exit and no node selected, show message that user needs to click a node first
      if (!pendingEntryExit) {
        // For exit, we need the user to first click on a node, then click where they want the exit point
        console.log('Click on a node first, then click where you want the exit point');
      } else if (pendingEntryExit.type === 'exit' && pendingEntryExit.nodeId) {
        // Create exit point connected to the pending node
        dispatch(saveToHistory());
        dispatch(addExitPoint({
          position: { x, y },
          sourceNodeId: pendingEntryExit.nodeId
        }));
        dispatch(setPendingEntryExit(null));
      }
    } else if (selectedTool === 'edge') {
      // Reset edge creation if clicking on empty canvas
      setEdgeSourceNodeId(null);
    } else if (selectedTool === 'select') {
      clearCurrentSelection();
      setEdgeSourceNodeId(null);
    }
  };

  // Render function for D3
  const render = useD3(useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    // Clear previous D3 content (but preserve React-rendered elements like Grid)
    svg.selectAll('.diagram-group').remove();

    // Create main group first (before zoom behavior that references it)
    const g = svg.append('g')
      .attr('class', 'diagram-group');

    // Set up zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        // Prevent infinite loop when updating from Redux state
        if (isUpdatingFromRedux.current) return;
        
        const { transform } = event;
        dispatch(setZoom(transform.k));
        dispatch(setPanOffset({ x: transform.x, y: transform.y }));
        g.attr('transform', transform.toString());
      });

    svg.call(zoomBehavior);

    // Apply current transform from Redux state
    const transform = d3.zoomIdentity
      .translate(panOffset.x, panOffset.y)
      .scale(zoom);
    
    // Set flag to prevent infinite loop
    isUpdatingFromRedux.current = true;
    svg.call(zoomBehavior.transform, transform);
    isUpdatingFromRedux.current = false;
    
    // Apply transform to the group
    g.attr('transform', transform.toString());

    // Add defs for arrow markers
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow-default')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#666');

    // Render edges
    const edgeGroup = g.append('g').attr('class', 'edges');
    const edgeSelection = edgeGroup.selectAll<SVGGElement, Edge>('.edge')
      .data(edges, (d) => d?.id ?? '');

    const edgeEnter = edgeSelection.enter()
      .append('g')
      .attr('class', 'edge');

    edgeEnter.append('path')
      .attr('class', 'edge-path')
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-default)');

    edgeEnter.append('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('fill', '#333');

    // Update edges
    const edgeUpdate = edgeEnter.merge(edgeSelection);
    
    edgeUpdate.select('.edge-path')
      .attr('d', (d: Edge) => {
        const sourceNode = nodes.find(n => n.id === d.source);
        const targetNode = nodes.find(n => n.id === d.target);
        if (!sourceNode || !targetNode) return '';
        
        const source = getNodeConnectionPoint(sourceNode, targetNode.position);
        const target = getNodeConnectionPoint(targetNode, sourceNode.position);
        return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
      })
      .attr('stroke', (d: Edge) => {
        if (selectedItems.includes(d.id)) return '#2196F3';
        switch (d.type) {
          case 'PV': return '#4CAF50';
          case 'VP': return '#FF9800';
          case 'PP': return '#9C27B0';
          case 'VV': return '#F44336';
          case 'resultant': return '#607D8B';
          default: return '#666';
        }
      })
      .attr('stroke-dasharray', (d: Edge) => d.type === 'resultant' ? '5,5' : 'none');

    edgeUpdate.select('.edge-label')
      .attr('x', (d: Edge) => {
        const sourceNode = nodes.find(n => n.id === d.source);
        const targetNode = nodes.find(n => n.id === d.target);
        if (!sourceNode || !targetNode) return 0;
        return (sourceNode.position.x + targetNode.position.x) / 2;
      })
      .attr('y', (d: Edge) => {
        const sourceNode = nodes.find(n => n.id === d.source);
        const targetNode = nodes.find(n => n.id === d.target);
        if (!sourceNode || !targetNode) return 0;
        return (sourceNode.position.y + targetNode.position.y) / 2 - 10;
      })
      .text((d: Edge) => d.label || d.type);

    edgeSelection.exit().remove();

    // Render nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeSelection = nodeGroup.selectAll<SVGGElement, Node>('.node')
      .data(nodes, (d) => d?.id ?? '');

    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: Node) => `translate(${d.position.x}, ${d.position.y})`)
      .style('cursor', 'pointer');

    // Add shapes based on node type
    nodeEnter.each(function(d: Node) {
      const nodeGroup = d3.select(this);
      const isSelected = selectedItems.includes(d.id);
      const isEdgeSource = selectedTool === 'edge' && edgeSourceNodeId === d.id;
      const colors = getNodeColors(d);
      const dimensions = getNodeDimensions(d);
      
      if (d.type === 'vocabulary') {
        nodeGroup.append('ellipse')
          .attr('rx', dimensions.width / 2)
          .attr('ry', dimensions.height / 2)
          .attr('fill', colors.background)
          .attr('stroke', isEdgeSource ? '#FF9800' : (isSelected ? '#2196F3' : colors.border))
          .attr('stroke-width', isEdgeSource ? 4 : (isSelected ? 3 : 1));
      } else if (d.type === 'practice') {
        nodeGroup.append('rect')
          .attr('x', -dimensions.width / 2)
          .attr('y', -dimensions.height / 2)
          .attr('width', dimensions.width)
          .attr('height', dimensions.height)
          .attr('rx', 10)
          .attr('fill', colors.background)
          .attr('stroke', isEdgeSource ? '#FF9800' : (isSelected ? '#2196F3' : colors.border))
          .attr('stroke-width', isEdgeSource ? 4 : (isSelected ? 3 : 1));
      } else if (d.type === 'test') {
        const size = dimensions.radius;
        const diamond = `M 0,-${size} L ${size},0 L 0,${size} L -${size},0 Z`;
        nodeGroup.append('path')
          .attr('d', diamond)
          .attr('fill', colors.background)
          .attr('stroke', isEdgeSource ? '#FF9800' : (isSelected ? '#2196F3' : colors.border))
          .attr('stroke-width', isEdgeSource ? 4 : (isSelected ? 3 : 1));
      } else if (d.type === 'operate') {
        nodeGroup.append('rect')
          .attr('x', -dimensions.width / 2)
          .attr('y', -dimensions.height / 2)
          .attr('width', dimensions.width)
          .attr('height', dimensions.height)
          .attr('fill', colors.background)
          .attr('stroke', isEdgeSource ? '#FF9800' : (isSelected ? '#2196F3' : colors.border))
          .attr('stroke-width', isEdgeSource ? 4 : (isSelected ? 3 : 1));
      }

      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('font-size', d.style?.fontSize || 14)
        .attr('fill', d.style?.textColor || '#333')
        .text(d.label)
        .call(wrapText, dimensions.width * 0.8);
    });

    // Since we remove .diagram-group completely each render, nodeSelection is always empty
    // So we just need to attach events to nodeEnter (which contains all nodes)

    // Add click and drag behavior to all nodes
    nodeEnter
      .call(d3.drag<SVGGElement, Node>()
        .on('start', function(event, d) {
          // Store initial position to detect if this is a click or drag
          const element = d3.select(this);
          element.property('__dragStart', { x: event.x, y: event.y });
          element.property('__wasDragged', false);
          
          // Only raise element for select tool
          if (selectedTool === 'select') {
            element.raise();
          }
        })
        .on('drag', function(event, d) {
          // Only allow dragging for select tool
          if (selectedTool !== 'select') return;
          
          const element = d3.select(this);
          const dragStart = element.property('__dragStart');
          
          // Check if mouse moved enough to be considered a drag
          const dx = Math.abs(event.x - dragStart.x);
          const dy = Math.abs(event.y - dragStart.y);
          const dragThreshold = 3; // pixels
          
          if (dx > dragThreshold || dy > dragThreshold) {
            element.property('__wasDragged', true);
            
            const newX = event.x;
            const newY = event.y;
            element.attr('transform', `translate(${newX}, ${newY})`);
            
            // Update connected edges
            svg.selectAll<SVGPathElement, Edge>('.edge-path')
              .attr('d', function(edge) {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return '';
                
                const updatedSourceNode = edge.source === d.id ? { ...sourceNode, position: { x: newX, y: newY } } : sourceNode;
                const updatedTargetNode = edge.target === d.id ? { ...targetNode, position: { x: newX, y: newY } } : targetNode;
                
                const source = getNodeConnectionPoint(updatedSourceNode, updatedTargetNode.position);
                const target = getNodeConnectionPoint(updatedTargetNode, updatedSourceNode.position);
                return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
              });
          }
        })
        .on('end', function(event, d) {
          const element = d3.select(this);
          const wasDragged = element.property('__wasDragged');
          
          if (wasDragged && selectedTool === 'select') {
            // This was a drag - update node position
            const snappedPosition = getSnappedPosition({ x: event.x, y: event.y }, gridSpacing, snapToGrid);
            moveNode(d.id, snappedPosition);
          } else if (!wasDragged) {
            // This was a click - handle click events
            if (selectedTool === 'edge') {
              if (edgeSourceNodeId === null) {
                setEdgeSourceNodeId(d.id);
              } else if (edgeSourceNodeId !== d.id) {
                handleEdgeCreation(edgeSourceNodeId, d.id);
              }
            } else if (selectedTool === 'entry') {
              if (pendingEntryExit && pendingEntryExit.type === 'entry') {
                const unconnectedEntry = entryPoints.find(ep => ep.targetNodeId === '');
                if (unconnectedEntry) {
                  dispatch(updateEntryPoint({
                    id: unconnectedEntry.id,
                    targetNodeId: d.id
                  }));
                  dispatch(setPendingEntryExit(null));
                }
              }
            } else if (selectedTool === 'exit') {
              if (!pendingEntryExit) {
                dispatch(setPendingEntryExit({ type: 'exit', nodeId: d.id }));
              }
            } else {
              selectNode(d.id);
              if (selectedTool === 'select') {
                dispatch(setSelectedNodeForCustomization(d.id));
              }
            }
          }
          
          // Clean up properties
          element.property('__dragStart', null);
          element.property('__wasDragged', null);
        }));

    nodeSelection.exit().remove();

    // Render entry points
    const entryPointGroup = g.append('g').attr('class', 'entry-points');
    const entryPointSelection = entryPointGroup.selectAll<SVGGElement, typeof entryPoints[0]>('.entry-point')
      .data(entryPoints, (d) => d?.id ?? '');

    const entryPointEnter = entryPointSelection.enter()
      .append('g')
      .attr('class', 'entry-point')
      .attr('transform', (d) => `translate(${d.position.x}, ${d.position.y})`);

    // Entry point visual: green circle with arrow
    entryPointEnter.append('circle')
      .attr('r', 8)
      .attr('fill', '#4CAF50')
      .attr('stroke', '#2E7D32')
      .attr('stroke-width', 2);
    
    entryPointEnter.append('path')
      .attr('d', 'M -3,-3 L 3,0 L -3,3 Z')
      .attr('fill', 'white')
      .attr('transform', 'rotate(0)');

    // Entry arrow to target node
    entryPointEnter.each(function(d) {
      if (d.targetNodeId) {
        const targetNode = nodes.find(n => n.id === d.targetNodeId);
        if (targetNode) {
          d3.select(this).append('path')
            .attr('d', `M 8,0 L ${targetNode.position.x - d.position.x - 8},${targetNode.position.y - d.position.y}`)
            .attr('stroke', '#4CAF50')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('marker-end', 'url(#arrow-default)');
        }
      }
    });

    entryPointSelection.exit().remove();

    // Render exit points
    const exitPointGroup = g.append('g').attr('class', 'exit-points');
    const exitPointSelection = exitPointGroup.selectAll<SVGGElement, typeof exitPoints[0]>('.exit-point')
      .data(exitPoints, (d) => d?.id ?? '');

    const exitPointEnter = exitPointSelection.enter()
      .append('g')
      .attr('class', 'exit-point')
      .attr('transform', (d) => `translate(${d.position.x}, ${d.position.y})`);

    // Exit point visual: red square
    exitPointEnter.append('rect')
      .attr('x', -8)
      .attr('y', -8)
      .attr('width', 16)
      .attr('height', 16)
      .attr('fill', '#F44336')
      .attr('stroke', '#C62828')
      .attr('stroke-width', 2);
    
    exitPointEnter.append('path')
      .attr('d', 'M -3,-3 L 3,3 M 3,-3 L -3,3')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round');

    // Exit arrow from source node
    exitPointEnter.each(function(d) {
      const sourceNode = nodes.find(n => n.id === d.sourceNodeId);
      if (sourceNode) {
        d3.select(this).append('path')
          .attr('d', `M ${sourceNode.position.x - d.position.x + 8},${sourceNode.position.y - d.position.y} L -8,0`)
          .attr('stroke', '#F44336')
          .attr('stroke-width', 2)
          .attr('fill', 'none')
          .attr('marker-end', 'url(#arrow-default)');
      }
    });

    exitPointSelection.exit().remove();

  }, [dispatch, edges, moveNode, nodes, entryPoints, exitPoints, panOffset, selectedItems, zoom, selectNode, isUpdatingFromRedux, selectedTool, edgeSourceNodeId, snapToGrid, gridSpacing, pendingEntryExit]));

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        dispatch(setCanvasSize({ width, height }));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [dispatch]);

  return (
    <div ref={containerRef} className="canvas-container">
      <div 
        style={{position: 'absolute', top: 10, left: 10, background: 'red', color: 'white', padding: '5px', zIndex: 1000}}
        onClick={() => console.log('🔴 Test div clicked!')}
      >
        TEST CLICK
      </div>
      <svg
        ref={render}
        className="diagram-canvas"
        width="100%"
        height="100%"
        onClick={handleCanvasClick}
      >
        {/* <Grid
          width={canvasSize.width}
          height={canvasSize.height}
          transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}
        /> */}
      </svg>
    </div>
  );
};

// Helper function to get connection point on node boundary
function getNodeConnectionPoint(node: Node, targetPos: Point): Point {
  const { x: nodeX, y: nodeY } = node.position;
  const { x: targetX, y: targetY } = targetPos;
  
  const dx = targetX - nodeX;
  const dy = targetY - nodeY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { x: nodeX, y: nodeY };
  
  const normalizedDx = dx / distance;
  const normalizedDy = dy / distance;
  
  let offsetX = 0;
  let offsetY = 0;
  
  if (node.type === 'vocabulary') {
    // Ellipse boundary
    const a = 60; // rx
    const b = 40; // ry
    const t = Math.atan2(normalizedDy * a, normalizedDx * b);
    offsetX = a * Math.cos(t);
    offsetY = b * Math.sin(t);
  } else if (node.type === 'practice') {
    // Rectangle boundary
    const w = 60; // half width
    const h = 30; // half height
    if (Math.abs(normalizedDx) * h > Math.abs(normalizedDy) * w) {
      offsetX = normalizedDx > 0 ? w : -w;
      offsetY = normalizedDy * w / Math.abs(normalizedDx);
    } else {
      offsetX = normalizedDx * h / Math.abs(normalizedDy);
      offsetY = normalizedDy > 0 ? h : -h;
    }
  } else {
    // Default circular boundary
    offsetX = normalizedDx * 40;
    offsetY = normalizedDy * 40;
  }
  
  return {
    x: nodeX + offsetX,
    y: nodeY + offsetY
  };
}

// Helper function to wrap text
function wrapText(text: d3.Selection<SVGTextElement, any, any, any>, width: number) {
  text.each(function() {
    const textElement = d3.select(this);
    const words = textElement.text().split(/\s+/).reverse();
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.1; // ems
    const y = textElement.attr('y') || 0;
    const dy = parseFloat(textElement.attr('dy') || '0');
    let tspan = textElement.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
    
    while (words.length > 0) {
      const word = words.pop();
      if (!word) {
        continue;
      }
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node()!.getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = textElement.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
      }
    }
  });
}
