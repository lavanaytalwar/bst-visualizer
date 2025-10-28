import { NodeID, TreeState } from '../types';

export const getDepth = (tree: TreeState, nodeId?: NodeID): number => {
  if (!nodeId) return 0;
  let depth = 0;
  let current = tree.nodes[nodeId];
  while (current?.parent) {
    depth += 1;
    current = tree.nodes[current.parent];
  }
  return depth;
};

export const getSubtreeSize = (tree: TreeState, nodeId?: NodeID): number => {
  if (!nodeId) return 0;
  const node = tree.nodes[nodeId];
  if (!node) return 0;
  return 1 + getSubtreeSize(tree, node.left) + getSubtreeSize(tree, node.right);
};

export const getHeight = (tree: TreeState, nodeId?: NodeID): number => {
  if (!nodeId) return 0;
  const node = tree.nodes[nodeId];
  if (!node) return 0;
  const leftHeight = getHeight(tree, node.left);
  const rightHeight = getHeight(tree, node.right);
  return 1 + Math.max(leftHeight, rightHeight);
};

export const getPredecessor = (tree: TreeState, nodeId?: NodeID): NodeID | undefined => {
  if (!nodeId) return undefined;
  const node = tree.nodes[nodeId];
  if (!node) return undefined;
  if (node.left) {
    return findMax(tree, node.left);
  }
  let current = node;
  while (current.parent) {
    const parent = tree.nodes[current.parent];
    if (parent?.right === current.id) {
      return parent.id;
    }
    current = parent!;
    if (!current) break;
  }
  return undefined;
};

export const getSuccessor = (tree: TreeState, nodeId?: NodeID): NodeID | undefined => {
  if (!nodeId) return undefined;
  const node = tree.nodes[nodeId];
  if (!node) return undefined;
  if (node.right) {
    return findMin(tree, node.right);
  }
  let current = node;
  while (current.parent) {
    const parent = tree.nodes[current.parent];
    if (parent?.left === current.id) {
      return parent.id;
    }
    current = parent!;
    if (!current) break;
  }
  return undefined;
};

const findMin = (tree: TreeState, nodeId: NodeID): NodeID => {
  let current = nodeId;
  while (tree.nodes[current]?.left) {
    current = tree.nodes[current].left!;
  }
  return current;
};

const findMax = (tree: TreeState, nodeId: NodeID): NodeID => {
  let current = nodeId;
  while (tree.nodes[current]?.right) {
    current = tree.nodes[current].right!;
  }
  return current;
};
