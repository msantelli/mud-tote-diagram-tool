// All types in one file to avoid import issues

export interface Point {
  x: number;
  y: number;
}

export interface NodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface EdgeStyle {
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  strokeWidth: number;
  color: string;
  arrowType: 'default' | 'hollow' | 'filled';
}

export type NodeType = 'vocabulary' | 'practice' | 'test' | 'operate' | 'exit';

export interface BaseNode {
  id: string;
  type: NodeType;
  position: Point;
  label: string;
  style?: NodeStyle;
}

export interface VocabularyNode extends BaseNode {
  type: 'vocabulary';
  subtype?: 'base' | 'meta' | 'modal' | 'normative';
}

export interface PracticeNode extends BaseNode {
  type: 'practice';
  subtype?: 'autonomous' | 'dependent' | 'algorithmic';
}

export interface TestNode extends BaseNode {
  type: 'test';
  condition?: string;
  evaluationFunction?: string;
}

export interface OperateNode extends BaseNode {
  type: 'operate';
  operations?: string[];
  subTOTEs?: string[]; // IDs of nested TOTE cycles
}

export interface ExitNode extends BaseNode {
  type: 'exit';
}

export type Node = VocabularyNode | PracticeNode | TestNode | OperateNode | ExitNode;

export type EdgeType = 
  // Basic MUD relations
  | 'PV' | 'VP' | 'PP' | 'VV'
  // Qualified MUD relations
  | 'PV-suff' | 'PV-nec' | 'VP-suff' | 'VP-nec' 
  | 'PP-suff' | 'PP-nec' | 'VV-suff' | 'VV-nec'
  // TOTE relations
  | 'sequence' | 'feedback' | 'loop' | 'exit' | 'entry'
  // Other
  | 'resultant' | 'unmarked';

// Entry/Exit points for TOTE cycles
export interface EntryPoint {
  id: string;
  position: Point;
  targetNodeId: string;
  label?: string;
}

export interface ExitPoint {
  id: string;
  position: Point;
  sourceNodeId: string;
  label?: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  style?: EdgeStyle;
  isResultant?: boolean; // Whether this is a resultant relationship
  resultantFrom?: string[]; // For resultant MURs - IDs of the source edges
}

export interface Diagram {
  id: string;
  name: string;
  type: 'MUD' | 'TOTE' | 'HYBRID';
  nodes: Node[];
  edges: Edge[];
  entryPoints: EntryPoint[];
  exitPoints: ExitPoint[];
  metadata: {
    created: string;
    modified: string;
    author?: string;
    description?: string;
  };
}