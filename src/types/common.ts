export interface Point {
  x: number;
  y: number;
}

export interface NodeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
}

export interface EdgeStyle {
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  strokeWidth: number;
  color: string;
  arrowType: 'default' | 'hollow' | 'filled';
}