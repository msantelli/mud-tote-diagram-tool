// Inline types to avoid import issues
export interface EdgeStyle {
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  strokeWidth: number;
  color: string;
  arrowType: 'default' | 'hollow' | 'filled';
}

export type EdgeType = 'PV' | 'VP' | 'PP' | 'VV' | 'resultant' | 'feedback' | 'exit';

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  style?: EdgeStyle;
  resultantFrom?: string[]; // For resultant MURs - IDs of the source edges
}