import type { Node } from '../types/all';

export const getNodeColors = (node: Node) => {
  const defaultColors = {
    vocabulary: { background: '#E3F2FD', border: '#1976D2' },
    practice: { background: '#FFF3E0', border: '#F57C00' },
    test: { background: '#E8F5E8', border: '#4CAF50' },
    operate: { background: '#FFF8E1', border: '#FFC107' },
    exit: { background: '#FFEBEE', border: '#F44336' }
  };

  const defaults = defaultColors[node.type];
  return {
    background: node.style?.backgroundColor || defaults.background,
    border: node.style?.borderColor || defaults.border
  };
};

export const getNodeDimensions = (node: Node) => {
  const size = node.style?.size || 'medium';
  const sizeMultiplier = size === 'small' ? 0.8 : size === 'large' ? 1.3 : 1;
  
  if (node.type === 'test') {
    const baseSize = 70;
    const adjustedSize = Math.round(baseSize * sizeMultiplier);
    return {
      width: adjustedSize,
      height: adjustedSize,
      radius: adjustedSize / 2
    };
  } else {
    const baseWidth = 100;
    const baseHeight = 50;
    return {
      width: Math.round(baseWidth * sizeMultiplier),
      height: Math.round(baseHeight * sizeMultiplier),
      radius: Math.round(25 * sizeMultiplier)
    };
  }
};