import React from 'react';
import { useAppSelector } from '../../store/hooks';

interface GridProps {
  width: number;
  height: number;
  transform?: string;
}

export const Grid: React.FC<GridProps> = ({ width, height, transform }) => {
  const showGrid = useAppSelector(state => state.ui.showGrid);
  const gridSpacing = useAppSelector(state => state.ui.gridSpacing);
  const zoom = useAppSelector(state => state.ui.zoom);
  const panOffset = useAppSelector(state => state.ui.panOffset);

  if (!showGrid) return null;

  // Calculate effective grid spacing based on zoom
  const effectiveSpacing = gridSpacing * zoom;
  
  // Calculate the visible area considering pan offset
  const startX = Math.floor(-panOffset.x / effectiveSpacing) * effectiveSpacing;
  const startY = Math.floor(-panOffset.y / effectiveSpacing) * effectiveSpacing;
  const endX = startX + width + effectiveSpacing;
  const endY = startY + height + effectiveSpacing;

  // Generate grid lines
  const verticalLines = [];
  const horizontalLines = [];

  // Vertical lines
  for (let x = startX; x <= endX; x += effectiveSpacing) {
    verticalLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={startY}
        x2={x}
        y2={endY}
        stroke="#e0e0e0"
        strokeWidth={0.5 / zoom}
        opacity={0.6}
      />
    );
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += effectiveSpacing) {
    horizontalLines.push(
      <line
        key={`h-${y}`}
        x1={startX}
        y1={y}
        x2={endX}
        y2={y}
        stroke="#e0e0e0"
        strokeWidth={0.5 / zoom}
        opacity={0.6}
      />
    );
  }

  return (
    <g className="grid" transform={transform} style={{ pointerEvents: 'none' }}>
      {verticalLines}
      {horizontalLines}
    </g>
  );
};