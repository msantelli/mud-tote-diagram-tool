import type { Edge } from '../types/all';

type DiagramMode = 'MUD' | 'TOTE' | 'HYBRID';

export const getAvailableEdgeTypes = (
  mode: DiagramMode, 
  _sourceType?: string, 
  _targetType?: string, 
  isAutoDetect: boolean = true
): Edge['type'][] => {
  let baseTypes: Edge['type'][] = [];
  
  if (mode === 'MUD') {
    if (isAutoDetect) {
      baseTypes = ['PV', 'VP', 'PP', 'VV'] as Edge['type'][];
    } else {
      // Manual mode: return qualified types
      baseTypes = ['PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec'] as Edge['type'][];
    }
  } else if (mode === 'TOTE') {
    baseTypes = ['sequence', 'feedback', 'loop', 'exit', 'entry'] as Edge['type'][];
  } else {
    // HYBRID mode
    const mudTypes = isAutoDetect ? ['PV', 'VP', 'PP', 'VV'] as Edge['type'][] : ['PV-suff', 'PV-nec', 'VP-suff', 'VP-nec', 'PP-suff', 'PP-nec', 'VV-suff', 'VV-nec'] as Edge['type'][];
    baseTypes = [...mudTypes, 'sequence', 'feedback', 'loop', 'exit', 'entry'] as Edge['type'][];
  }
  
  // Always include unmarked edges as an option
  return [...baseTypes, 'unmarked'] as Edge['type'][];
};

export const getBaseEdgeType = (edgeType: string): string => {
  return edgeType.replace('-suff', '').replace('-nec', '');
};

export const getEdgeQualifier = (edgeType: string): 'suff' | 'nec' | null => {
  if (edgeType.includes('-suff')) return 'suff';
  if (edgeType.includes('-nec')) return 'nec';
  return null;
};

export const getEdgeColor = (type: string, isResultant: boolean = false): string => {
  const baseType = getBaseEdgeType(type);
  const qualifier = getEdgeQualifier(type);
  
  // Base colors for MUD relations
  let baseColor;
  switch (baseType) {
    case 'PV': baseColor = '#4CAF50'; break; // Green
    case 'VP': baseColor = '#FF9800'; break; // Orange  
    case 'PP': baseColor = '#9C27B0'; break; // Purple
    case 'VV': baseColor = '#F44336'; break; // Red
    // TOTE relations
    case 'sequence': baseColor = '#2196F3'; break; // Blue
    case 'feedback': baseColor = '#FF5722'; break; // Deep Orange
    case 'loop': baseColor = '#607D8B'; break; // Blue Grey
    case 'exit': baseColor = '#8BC34A'; break; // Light Green
    case 'entry': baseColor = '#4CAF50'; break; // Green
    case 'unmarked': baseColor = '#666666'; break; // Neutral gray
    default: baseColor = '#666'; break;
  }
  
  // Modify color based on qualifier
  if (qualifier === 'suff') {
    return baseColor; // Keep original color for sufficient
  } else if (qualifier === 'nec') {
    // Darker/more saturated for necessary
    return baseColor.replace('#4CAF50', '#2E7D32') // Darker green
                   .replace('#FF9800', '#E65100') // Darker orange
                   .replace('#9C27B0', '#6A1B9A') // Darker purple
                   .replace('#F44336', '#C62828'); // Darker red
  } else if (isResultant) {
    // Lighter/more muted for resultant
    return baseColor.replace('#4CAF50', '#81C784') // Lighter green
                   .replace('#FF9800', '#FFB74D') // Lighter orange
                   .replace('#9C27B0', '#BA68C8') // Lighter purple
                   .replace('#F44336', '#E57373') // Lighter red
                   .replace('#2196F3', '#64B5F6') // Lighter blue
                   .replace('#FF5722', '#FF8A65') // Lighter deep orange
                   .replace('#607D8B', '#90A4AE') // Lighter blue grey
                   .replace('#8BC34A', '#AED581') // Lighter light green
                   .replace('#666666', '#999999'); // Lighter gray
  }
  
  return baseColor;
};

export const shouldShowArrowhead = (edgeType: string): boolean => {
  // Show arrowheads on all edges except entry arrows (which have no source)
  return edgeType !== 'entry';
};

export const getEdgeTypeDescription = (edgeType: Edge['type']): string => {
  // Simple MUD relations
  if (edgeType === 'PV') return 'Practice → Vocabulary';
  else if (edgeType === 'VP') return 'Vocabulary → Practice';
  else if (edgeType === 'PP') return 'Practice → Practice';
  else if (edgeType === 'VV') return 'Vocabulary → Vocabulary';
  // Qualified MUD relations
  else if (edgeType === 'PV-suff') return 'Practice → Vocabulary (Sufficient)';
  else if (edgeType === 'PV-nec') return 'Practice → Vocabulary (Necessary)';
  else if (edgeType === 'VP-suff') return 'Vocabulary → Practice (Sufficient)';
  else if (edgeType === 'VP-nec') return 'Vocabulary → Practice (Necessary)';
  else if (edgeType === 'PP-suff') return 'Practice → Practice (Sufficient)';
  else if (edgeType === 'PP-nec') return 'Practice → Practice (Necessary)';
  else if (edgeType === 'VV-suff') return 'Vocabulary → Vocabulary (Sufficient)';
  else if (edgeType === 'VV-nec') return 'Vocabulary → Vocabulary (Necessary)';
  // TOTE relations
  else if (edgeType === 'sequence') return 'Sequential action';
  else if (edgeType === 'feedback') return 'Feedback loop';
  else if (edgeType === 'loop') return 'Iterative loop';
  else if (edgeType === 'exit') return 'Exit condition';
  else if (edgeType === 'entry') return 'Entry point';
  else if (edgeType === 'unmarked') return 'Simple line (no label)';
  
  return edgeType; // Fallback to the type name
};