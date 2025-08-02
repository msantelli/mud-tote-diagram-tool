// Inline types to avoid import issues
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