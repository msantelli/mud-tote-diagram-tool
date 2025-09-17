import type { Point } from '../types/all';

/**
 * Snap a point to the nearest grid intersection
 */
export const snapToGrid = (point: Point, gridSpacing: number, enabled: boolean = true): Point => {
  if (!enabled) return point;
  
  return {
    x: Math.round(point.x / gridSpacing) * gridSpacing,
    y: Math.round(point.y / gridSpacing) * gridSpacing
  };
};

/**
 * Check if snapping is enabled and return snapped position
 */
export const getSnappedPosition = (point: Point, gridSpacing: number, snapEnabled: boolean): Point => {
  return snapToGrid(point, gridSpacing, snapEnabled);
};

/**
 * Calculate grid-aligned bounds for positioning
 */
export const getGridAlignedBounds = (
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  gridSpacing: number
) => {
  const snappedX = Math.round(x / gridSpacing) * gridSpacing;
  const snappedY = Math.round(y / gridSpacing) * gridSpacing;
  
  return {
    x: snappedX,
    y: snappedY,
    width: Math.ceil(width / gridSpacing) * gridSpacing,
    height: Math.ceil(height / gridSpacing) * gridSpacing
  };
};

/**
 * Get the nearest grid point to a given coordinate
 */
export const getNearestGridPoint = (x: number, y: number, gridSpacing: number): Point => {
  return {
    x: Math.round(x / gridSpacing) * gridSpacing,
    y: Math.round(y / gridSpacing) * gridSpacing
  };
};

/**
 * Check if a point is close to a grid intersection (within tolerance)
 */
export const isNearGridPoint = (point: Point, gridSpacing: number, tolerance: number = 5): boolean => {
  const nearestGrid = getNearestGridPoint(point.x, point.y, gridSpacing);
  const distance = Math.sqrt(
    Math.pow(point.x - nearestGrid.x, 2) + Math.pow(point.y - nearestGrid.y, 2)
  );
  return distance <= tolerance;
};