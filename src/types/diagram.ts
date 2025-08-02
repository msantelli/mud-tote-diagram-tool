// Import types directly to avoid module resolution issues
import type { Node } from './nodes';
import type { Edge } from './edges';

export interface Diagram {
  id: string;
  name: string;
  type: 'MUD' | 'TOTE' | 'HYBRID';
  nodes: Node[];
  edges: Edge[];
  metadata: {
    created: string;
    modified: string;
    author?: string;
    description?: string;
  };
}

// Re-export for convenience
export type { Node, Edge };