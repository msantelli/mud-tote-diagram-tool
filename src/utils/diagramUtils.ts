type DiagramMode = 'MUD' | 'TOTE' | 'HYBRID';

export const getAvailableTools = (mode: DiagramMode) => {
  switch (mode) {
    case 'MUD':
      return ['select', 'vocabulary', 'practice', 'edge'] as const;
    case 'TOTE':
      return ['select', 'test', 'operate', 'edge', 'entry', 'exit'] as const;
    case 'HYBRID':
      return ['select', 'vocabulary', 'practice', 'test', 'operate', 'edge', 'entry', 'exit'] as const;
  }
};

export const getModeDescription = (mode: DiagramMode) => {
  switch (mode) {
    case 'MUD':
      return 'Meaning-Use Diagram mode - visualize relationships between vocabularies and practices';
    case 'TOTE':
      return 'TOTE Cycle mode - create Test-Operate-Test-Exit behavioral loops';
    case 'HYBRID':
      return 'Hybrid mode - combine MUD and TOTE elements in a single diagram';
  }
};