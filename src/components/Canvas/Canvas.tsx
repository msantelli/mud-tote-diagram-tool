import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useD3 } from '../../hooks/useD3';
import { useDiagram } from '../../hooks/useDiagram';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setZoom, setPanOffset, setCanvasSize } from '../../store/uiSlice';
import { Node, Edge, Point } from '../../types/all';
import './Canvas.css';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { nodes, edges, selectedItems, selectedTool, addNewNode, moveNode, selectNode, clearCurrentSelection } = useDiagram();
  const zoom = useAppSelector(state => state.ui.zoom);
  const panOffset = useAppSelector(state => state.ui.panOffset);
  const dispatch = useAppDispatch();

  // Handle canvas clicks for creating nodes
  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left - panOffset.x) / zoom;
    const y = (event.clientY - rect.top - panOffset.y) / zoom;

    if (selectedTool === 'vocabulary') {
      addNewNode('vocabulary', { x, y });
    } else if (selectedTool === 'practice') {
      addNewNode('practice', { x, y });
    } else if (selectedTool === 'test') {
      addNewNode('test', { x, y });
    } else if (selectedTool === 'operate') {
      addNewNode('operate', { x, y });
    } else if (selectedTool === 'select') {
      clearCurrentSelection();
    }
  };

  // Render function for D3
  const render = useD3((svg) => {
    // Clear previous content
    svg.selectAll('*').remove();

    // Set up zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const { transform } = event;
        dispatch(setZoom(transform.k));
        dispatch(setPanOffset({ x: transform.x, y: transform.y }));
        g.attr('transform', transform.toString());
      });

    svg.call(zoomBehavior);

    // Apply current transform
    const transform = d3.zoomIdentity
      .translate(panOffset.x, panOffset.y)
      .scale(zoom);
    svg.call(zoomBehavior.transform, transform);

    // Create main group
    const g = svg.append('g')
      .attr('class', 'diagram-group')
      .attr('transform', transform.toString());

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
    const edgeSelection = edgeGroup.selectAll('.edge')
      .data(edges, (d: any) => d.id);

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
    const nodeSelection = nodeGroup.selectAll('.node')
      .data(nodes, (d: any) => d.id);

    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: Node) => `translate(${d.position.x}, ${d.position.y})`)
      .style('cursor', 'pointer');

    // Add shapes based on node type
    nodeEnter.each(function(d: Node) {
      const nodeGroup = d3.select(this);
      const isSelected = selectedItems.includes(d.id);
      
      if (d.type === 'vocabulary') {
        nodeGroup.append('ellipse')
          .attr('rx', 60)
          .attr('ry', 40)
          .attr('fill', d.style?.fill || '#E3F2FD')
          .attr('stroke', isSelected ? '#2196F3' : (d.style?.stroke || '#1976D2'))
          .attr('stroke-width', isSelected ? 3 : 1);
      } else if (d.type === 'practice') {
        nodeGroup.append('rect')
          .attr('x', -60)
          .attr('y', -30)
          .attr('width', 120)
          .attr('height', 60)
          .attr('rx', 10)
          .attr('fill', d.style?.fill || '#FFF3E0')
          .attr('stroke', isSelected ? '#2196F3' : (d.style?.stroke || '#F57C00'))
          .attr('stroke-width', isSelected ? 3 : 1);
      } else if (d.type === 'test') {
        const diamond = 'M 0,-40 L 50,0 L 0,40 L -50,0 Z';
        nodeGroup.append('path')
          .attr('d', diamond)
          .attr('fill', d.style?.fill || '#E8F5E8')
          .attr('stroke', isSelected ? '#2196F3' : (d.style?.stroke || '#4CAF50'))
          .attr('stroke-width', isSelected ? 3 : 1);
      } else if (d.type === 'operate') {
        nodeGroup.append('rect')
          .attr('x', -50)
          .attr('y', -25)
          .attr('width', 100)
          .attr('height', 50)
          .attr('fill', d.style?.fill || '#FFF8E1')
          .attr('stroke', isSelected ? '#2196F3' : (d.style?.stroke || '#FFC107'))
          .attr('stroke-width', isSelected ? 3 : 1);
      }

      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('font-size', d.style?.fontSize || 14)
        .attr('fill', '#333')
        .text(d.label)
        .call(wrapText, 100);
    });

    // Add click and drag behavior to nodes
    nodeEnter
      .on('click', function(event, d) {
        event.stopPropagation();
        selectNode(d.id);
      })
      .call(d3.drag<SVGGElement, Node>()
        .on('start', function(event, d) {
          d3.select(this).raise();
        })
        .on('drag', function(event, d) {
          const newX = event.x;
          const newY = event.y;
          d3.select(this).attr('transform', `translate(${newX}, ${newY})`);
          
          // Update connected edges
          svg.selectAll('.edge-path')
            .attr('d', function(edgeData: any) {
              const edge = edgeData as Edge;
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return '';
              
              const updatedSourceNode = edge.source === d.id ? { ...sourceNode, position: { x: newX, y: newY } } : sourceNode;
              const updatedTargetNode = edge.target === d.id ? { ...targetNode, position: { x: newX, y: newY } } : targetNode;
              
              const source = getNodeConnectionPoint(updatedSourceNode, updatedTargetNode.position);
              const target = getNodeConnectionPoint(updatedTargetNode, updatedSourceNode.position);
              return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
            });
        })
        .on('end', function(event, d) {
          moveNode(d.id, { x: event.x, y: event.y });
        }));

    nodeSelection.exit().remove();

  }, [nodes, edges, selectedItems, zoom, panOffset]);

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
      <svg
        ref={render}
        className="diagram-canvas"
        width="100%"
        height="100%"
        onClick={handleCanvasClick}
      />
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
    let word;
    let line: string[] = [];
    let lineNumber = 0;
    const lineHeight = 1.1; // ems
    const y = textElement.attr('y') || 0;
    const dy = parseFloat(textElement.attr('dy') || '0');
    let tspan = textElement.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
    
    while (word = words.pop()) {
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