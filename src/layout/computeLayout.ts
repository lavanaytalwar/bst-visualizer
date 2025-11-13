import { NodeID, TreeState } from '../types';

export interface LayoutItem {
  x: number;
  y: number;
  depth: number;
}

interface Options {
  horizontalSpacing?: number;
  verticalSpacing?: number;
}

export const computeLayout = (
  tree: TreeState,
  { horizontalSpacing = 80, verticalSpacing = 90 }: Options = {},
): Record<NodeID, LayoutItem> => {
  const layout: Record<NodeID, LayoutItem> = {};
  const minNodeSpacing = 60; // Minimum distance between any two nodes
  
  // Calculate the width needed for each subtree (number of leaf nodes)
  const calculateSubtreeWidth = (nodeId: NodeID | undefined): number => {
    if (!nodeId) return 0;
    const node = tree.nodes[nodeId];
    if (!node) return 0;
    
    const leftWidth = calculateSubtreeWidth(node.left);
    const rightWidth = calculateSubtreeWidth(node.right);
    
    // If it's a leaf node, it needs 1 unit of width
    if (!node.left && !node.right) return 1;
    
    // Otherwise, it needs the sum of its children's widths, with minimum spacing
    return Math.max(leftWidth + rightWidth, 2);
  };

  const assignPositions = (nodeId: NodeID | undefined, depth: number, leftBound: number, rightBound: number) => {
    if (!nodeId) return;
    const node = tree.nodes[nodeId];
    if (!node) return;
    
    // Position this node in the center of its allocated space
    const centerX = (leftBound + rightBound) / 2;
    
    layout[nodeId] = {
      x: centerX,
      y: depth * verticalSpacing,
      depth,
    };
    
    // If this node has children, position them with proper spacing
    if (node.left || node.right) {
      const availableWidth = rightBound - leftBound;
      
      if (node.left && node.right) {
        // Both children exist - ensure proper spacing
        const leftWidth = calculateSubtreeWidth(node.left);
        const rightWidth = calculateSubtreeWidth(node.right);
        const totalChildWidth = leftWidth + rightWidth;
        
        // Calculate spacing to prevent overlaps
        const effectiveSpacing = Math.max(horizontalSpacing, minNodeSpacing);
        const minRequiredWidth = totalChildWidth * effectiveSpacing;
        const actualSpacing = Math.max(effectiveSpacing, availableWidth / (totalChildWidth + 1));
        
        // Position children with proportional spacing
        const leftPortion = leftWidth / totalChildWidth;
        const rightPortion = rightWidth / totalChildWidth;
        
        const leftChildSpace = availableWidth * leftPortion * 0.4;
        const rightChildSpace = availableWidth * rightPortion * 0.4;
        
        const leftChildX = leftBound + leftChildSpace;
        const rightChildX = rightBound - rightChildSpace;
        
        // Ensure minimum spacing between children
        const childDistance = rightChildX - leftChildX;
        if (childDistance < minNodeSpacing) {
          const adjustment = (minNodeSpacing - childDistance) / 2;
          const adjustedLeftX = leftChildX - adjustment;
          const adjustedRightX = rightChildX + adjustment;
          
          assignPositions(node.left, depth + 1, leftBound, adjustedLeftX + leftChildSpace);
          assignPositions(node.right, depth + 1, adjustedRightX - rightChildSpace, rightBound);
        } else {
          assignPositions(node.left, depth + 1, leftBound, leftChildX + leftChildSpace);
          assignPositions(node.right, depth + 1, rightChildX - rightChildSpace, rightBound);
        }
      } else if (node.left) {
        // Only left child - place it in the left portion
        const childX = leftBound + availableWidth * 0.25;
        const childSpace = availableWidth * 0.4;
        assignPositions(node.left, depth + 1, childX - childSpace/2, childX + childSpace/2);
      } else if (node.right) {
        // Only right child - place it in the right portion  
        const childX = rightBound - availableWidth * 0.25;
        const childSpace = availableWidth * 0.4;
        assignPositions(node.right, depth + 1, childX - childSpace/2, childX + childSpace/2);
      }
    }
  };

  if (tree.root) {
    const totalWidth = calculateSubtreeWidth(tree.root);
    const treeWidth = Math.max(totalWidth * horizontalSpacing * 1.5, 600); // Increased minimum width
    
    // Start positioning from the center
    const halfWidth = treeWidth / 2;
    assignPositions(tree.root, 0, -halfWidth, halfWidth);
  }

  return layout;
};
