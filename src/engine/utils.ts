import {
  BSTNode,
  InvariantCheck,
  NodeID,
  Step,
  StepHighlight,
  TreeState,
} from '../types';

let globalNodeCounter = 0;
let globalStepCounter = 0;

export const resetCountersForTest = () => {
  globalNodeCounter = 0;
  globalStepCounter = 0;
};

export const cloneTreeState = (tree: TreeState): TreeState => {
  const nodes: Record<NodeID, BSTNode> = {};
  Object.entries(tree.nodes).forEach(([id, node]) => {
    nodes[id] = { ...node };
  });
  return {
    root: tree.root,
    nodes,
    config: tree.config,
  };
};

export const generateNodeId = (key: number | string): NodeID => {
  globalNodeCounter += 1;
  return `node-${String(key)}-${globalNodeCounter}`;
};

export const nextStepIndex = (): number => {
  globalStepCounter += 1;
  return globalStepCounter;
};

export const checkBSTProperty = (tree: TreeState): boolean => {
  const { nodes, root } = tree;

  const validate = (nodeId: NodeID | undefined, min?: number | string, max?: number | string): boolean => {
    if (!nodeId) return true;
    const node = nodes[nodeId];
    if (!node) return true;
    const key = node.key;
    if (typeof key === 'number') {
      if (typeof min === 'number' && key < min) return false;
      if (typeof max === 'number' && key > max) return false;
    } else if (typeof key === 'string') {
      if (typeof min === 'string' && key < min) return false;
      if (typeof max === 'string' && key > max) return false;
    }
    return validate(node.left, min, key) && validate(node.right, key, max);
  };

  return validate(root);
};

export const makeInvariantChecks = (tree: TreeState, detail?: string): InvariantCheck[] => [
  {
    name: 'BST property',
    passed: checkBSTProperty(tree),
    detail,
  },
];

interface StepParams {
  op: Step['op'];
  action: Step['action'];
  reason: string;
  payload?: any;
  tree: TreeState;
  codeLines?: number[];
  highlights?: StepHighlight;
}

export const createStep = ({
  op,
  action,
  reason,
  payload,
  tree,
  codeLines,
  highlights,
}: StepParams): Step => ({
  id: `${op}-${nextStepIndex()}`,
  op,
  index: 0,
  action,
  payload,
  reason,
  codeLines,
  highlights,
  invariantChecks: makeInvariantChecks(tree),
  treeSnapshot: cloneTreeState(tree),
});

export const reindexSteps = (steps: Step[]): Step[] =>
  steps.map((step, index) => ({
    ...step,
    index,
  }));
