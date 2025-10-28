import { SearchResult, Step, TreeState } from '../types';
import { createStep, reindexSteps } from './utils';

const SEARCH_LINE = {
  START: 1,
  CUR: 2,
  LOOP: 3,
  GO_LEFT: 5,
  GO_RIGHT: 7,
  FOUND: 9,
  NOT_FOUND: 11,
};

export function search(tree: TreeState, key: number | string): SearchResult {
  const steps: Step[] = [];
  const { comparator } = tree.config;
  let currentId = tree.root;

  if (!currentId) {
    steps.push(
      createStep({
        op: 'search',
        action: 'compare',
        reason: 'Tree is empty; nothing to search.',
        tree,
        codeLines: [SEARCH_LINE.START],
        highlights: {},
      }),
    );
    return { steps: reindexSteps(steps), found: false };
  }

  while (currentId) {
    const node = tree.nodes[currentId];
    const cmp = comparator(key, node.key);
    steps.push(
      createStep({
        op: 'search',
        action: 'compare',
        reason:
          cmp === 0
            ? `Key ${key} equals ${node.key}; search successful.`
            : cmp < 0
            ? `Key ${key} < ${node.key}; move left.`
            : `Key ${key} > ${node.key}; move right.`,
        tree,
        codeLines: [SEARCH_LINE.LOOP],
        highlights: { nodes: [node.id] },
      }),
    );

    if (cmp === 0) {
      steps.push(
        createStep({
          op: 'search',
          action: 'visit-node',
          reason: `Found node ${node.key}; returning result.`,
          tree,
          codeLines: [SEARCH_LINE.FOUND],
          highlights: { nodes: [node.id] },
        }),
      );
      return { steps: reindexSteps(steps), found: true };
    }

    if (cmp < 0) {
      if (!node.left) {
        steps.push(
          createStep({
            op: 'search',
            action: 'move-left',
            reason: `No left child from ${node.key}; search terminates unsuccessfully.`,
            tree,
            codeLines: [SEARCH_LINE.GO_LEFT, SEARCH_LINE.NOT_FOUND],
            highlights: { nodes: [node.id] },
          }),
        );
        return { steps: reindexSteps(steps), found: false };
      }
      steps.push(
        createStep({
          op: 'search',
          action: 'move-left',
          reason: `Moving left to ${tree.nodes[node.left].key}.`,
          tree,
          codeLines: [SEARCH_LINE.GO_LEFT],
          highlights: { nodes: [node.left], edges: [[node.id, node.left]] },
        }),
      );
      currentId = node.left;
    } else {
      if (!node.right) {
        steps.push(
          createStep({
            op: 'search',
            action: 'move-right',
            reason: `No right child from ${node.key}; search terminates unsuccessfully.`,
            tree,
            codeLines: [SEARCH_LINE.GO_RIGHT, SEARCH_LINE.NOT_FOUND],
            highlights: { nodes: [node.id] },
          }),
        );
        return { steps: reindexSteps(steps), found: false };
      }
      steps.push(
        createStep({
          op: 'search',
          action: 'move-right',
          reason: `Moving right to ${tree.nodes[node.right].key}.`,
          tree,
          codeLines: [SEARCH_LINE.GO_RIGHT],
          highlights: { nodes: [node.right], edges: [[node.id, node.right]] },
        }),
      );
      currentId = node.right;
    }
  }

  steps.push(
    createStep({
      op: 'search',
      action: 'visit-node',
      reason: `Key ${key} not found.`,
      tree,
      codeLines: [SEARCH_LINE.NOT_FOUND],
      highlights: {},
    }),
  );
  return { steps: reindexSteps(steps), found: false };
}
