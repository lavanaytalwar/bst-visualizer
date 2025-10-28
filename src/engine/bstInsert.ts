import { InsertResult, Step, TreeState } from '../types';
import {
  cloneTreeState,
  createStep,
  generateNodeId,
  reindexSteps,
} from './utils';

const INSERT_LINE = {
  START: 1,
  CHECK_EMPTY: 2,
  SET_CUR: 4,
  LOOP_CHECK: 5,
  GO_LEFT: 6,
  GO_RIGHT: 8,
  DUPLICATE: 10,
  APPLY_POLICY: 11,
  ATTACH_NEW: 12,
};

const MAX_NODE_MESSAGE = 'Maximum node limit reached; insertion skipped.';

export function insert(tree: TreeState, key: number | string): InsertResult {
  const steps: Step[] = [];
  const nextState = cloneTreeState(tree);
  const { comparator, duplicatePolicy, maxNodes } = tree.config;

  if (Object.keys(tree.nodes).length >= maxNodes) {
    steps.push(
      createStep({
        op: 'insert',
        action: 'compare',
        reason: MAX_NODE_MESSAGE,
        tree,
        codeLines: [INSERT_LINE.CHECK_EMPTY],
        highlights: { nodes: tree.root ? [tree.root] : [] },
      }),
    );
    return {
      steps: reindexSteps(steps),
      next: tree,
    };
  }

  if (!nextState.root) {
    const newId = generateNodeId(key);
    nextState.root = newId;
    nextState.nodes[newId] = { id: newId, key, meta: duplicatePolicy === 'multiset' ? { count: 1 } : undefined };
    steps.push(
      createStep({
        op: 'insert',
        action: 'create-node',
        reason: `Tree is empty; creating root node ${key}.`,
        tree: nextState,
        codeLines: [INSERT_LINE.CHECK_EMPTY],
        highlights: { nodes: [newId] },
      }),
    );
    return {
      steps: reindexSteps(steps),
      next: nextState,
    };
  }

  let currentId = nextState.root;
  let parentId: string | undefined;
  let lastComparison = 0;

  while (currentId) {
    const currentNode = nextState.nodes[currentId];
    lastComparison = comparator(key, currentNode.key);
    steps.push(
      createStep({
        op: 'insert',
        action: 'compare',
        reason:
          lastComparison < 0
            ? `${key} < ${currentNode.key}; prepare to move left.`
            : lastComparison > 0
            ? `${key} > ${currentNode.key}; prepare to move right.`
            : `${key} equals ${currentNode.key}; duplicate policy applies.`,
        tree: nextState,
        codeLines: [INSERT_LINE.LOOP_CHECK, INSERT_LINE.GO_LEFT],
        highlights: { nodes: [currentId] },
      }),
    );

    if (lastComparison === 0) {
      steps.push(
        createStep({
          op: 'insert',
          action: 'compare',
          reason: `Duplicate encountered. Policy: ${duplicatePolicy}.`,
          tree: nextState,
          codeLines: [INSERT_LINE.DUPLICATE, INSERT_LINE.APPLY_POLICY],
          highlights: { nodes: [currentId] },
        }),
      );

      if (duplicatePolicy === 'reject') {
        steps.push(
          createStep({
            op: 'insert',
            action: 'visit-node',
            reason: `Rejecting duplicate key ${key}; tree unchanged.`,
            tree: nextState,
            codeLines: [INSERT_LINE.APPLY_POLICY],
            highlights: { nodes: [currentId] },
          }),
        );
        return {
          steps: reindexSteps(steps),
          next: tree,
        };
      }

      if (duplicatePolicy === 'multiset') {
        const meta = currentNode.meta ?? {};
        const count = (meta.count ?? 1) + 1;
        nextState.nodes[currentId] = {
          ...currentNode,
          meta: { ...meta, count },
        };
        steps.push(
          createStep({
            op: 'insert',
            action: 'replace-value',
            reason: `Incrementing count for ${key} to ${count}.`,
            tree: nextState,
            codeLines: [INSERT_LINE.APPLY_POLICY],
            highlights: { nodes: [currentId] },
          }),
        );
        return {
          steps: reindexSteps(steps),
          next: nextState,
        };
      }

      parentId = currentNode.id;
      currentId =
        duplicatePolicy === 'allow-left' ? currentNode.left ?? undefined : currentNode.right ?? undefined;
      steps.push(
        createStep({
          op: 'insert',
          action: duplicatePolicy === 'allow-left' ? 'move-left' : 'move-right',
          reason:
            duplicatePolicy === 'allow-left'
              ? `Policy allows duplicates on the left; continue left from ${currentNode.key}.`
              : `Policy allows duplicates on the right; continue right from ${currentNode.key}.`,
          tree: nextState,
          codeLines: [INSERT_LINE.APPLY_POLICY],
          highlights: currentId
            ? { nodes: [currentId], edges: [[currentNode.id, currentId]] }
            : { nodes: [currentNode.id] },
        }),
      );
      if (!currentId) break;
      continue;
    }

    parentId = currentNode.id;
    if (lastComparison < 0) {
      if (!currentNode.left) break;
      currentId = currentNode.left;
      steps.push(
        createStep({
          op: 'insert',
          action: 'move-left',
          reason: `Moving left from ${currentNode.key} to ${nextState.nodes[currentId].key}.`,
          tree: nextState,
          codeLines: [INSERT_LINE.GO_LEFT],
          highlights: { nodes: [currentId], edges: [[currentNode.id, currentId]] },
        }),
      );
    } else {
      if (!currentNode.right) break;
      currentId = currentNode.right;
      steps.push(
        createStep({
          op: 'insert',
          action: 'move-right',
          reason: `Moving right from ${currentNode.key} to ${nextState.nodes[currentId].key}.`,
          tree: nextState,
          codeLines: [INSERT_LINE.GO_RIGHT],
          highlights: { nodes: [currentId], edges: [[currentNode.id, currentId]] },
        }),
      );
    }
  }

  if (!parentId) {
    return {
      steps: reindexSteps(steps),
      next: nextState,
    };
  }

  const parentNode = nextState.nodes[parentId];
  const newId = generateNodeId(key);
  const newNode = { id: newId, key, parent: parentId, meta: duplicatePolicy === 'multiset' ? { count: 1 } : undefined };
  nextState.nodes[newId] = newNode;

  if (lastComparison < 0 || (lastComparison === 0 && duplicatePolicy === 'allow-left')) {
    nextState.nodes[parentId] = { ...parentNode, left: newId };
  } else {
    nextState.nodes[parentId] = { ...parentNode, right: newId };
  }

  steps.push(
    createStep({
      op: 'insert',
      action: 'create-node',
      reason: `Attaching ${key} as ${lastComparison < 0 || duplicatePolicy === 'allow-left' ? 'left' : 'right'} child of ${
        parentNode.key
      }.`,
      tree: nextState,
      codeLines: [INSERT_LINE.ATTACH_NEW],
      highlights: {
        nodes: [newId],
        edges: [[parentId, newId]],
      },
    }),
  );

  return {
    steps: reindexSteps(steps),
    next: nextState,
  };
}
