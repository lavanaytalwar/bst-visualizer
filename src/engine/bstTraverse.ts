import { Step, TraverseKind, TraverseResultStepList, TreeState } from '../types';
import { createStep, reindexSteps } from './utils';

const TRAVERSE_LINE = {
  IN: { START: 1, VISIT: 5 },
  PRE: { START: 1, VISIT: 3 },
  POST: { START: 1, VISIT: 6 },
  LEVEL: { START: 1, ENQUEUE: 3, DEQUEUE: 4, VISIT: 6 },
};

export function traverse(tree: TreeState, kind: TraverseKind): TraverseResultStepList {
  const steps: Step[] = [];
  if (!tree.root) {
    steps.push(
      createStep({
        op: 'traverse',
        action: 'visit-node',
        reason: 'Tree is empty; traversal yields no nodes.',
        tree,
        codeLines: [TRAVERSE_LINE.IN.START],
        highlights: {},
      }),
    );
    return reindexSteps(steps);
  }

  const visited: string[] = [];

  if (kind === 'level') {
    const queue: string[] = [tree.root];
    steps.push(
      createStep({
        op: 'traverse',
        action: 'enqueue',
        reason: `Level-order traversal starts by enqueuing root ${tree.nodes[tree.root].key}.`,
        tree,
        codeLines: [TRAVERSE_LINE.LEVEL.ENQUEUE],
        highlights: { nodes: [tree.root] },
      }),
    );

    while (queue.length) {
      const currentId = queue.shift()!;
      steps.push(
        createStep({
          op: 'traverse',
          action: 'dequeue',
          reason: `Dequeued ${tree.nodes[currentId].key} for visitation.`,
          tree,
          codeLines: [TRAVERSE_LINE.LEVEL.DEQUEUE],
          highlights: { nodes: [currentId] },
        }),
      );
      visited.push(currentId);
      steps.push(
        createStep({
          op: 'traverse',
          action: 'visit-node',
          reason: `Visit ${tree.nodes[currentId].key} in level-order.`,
          tree,
          codeLines: [TRAVERSE_LINE.LEVEL.VISIT],
          highlights: { nodes: [currentId], orderTag: [...visited] },
        }),
      );
      const node = tree.nodes[currentId];
      if (node.left) {
        queue.push(node.left);
        steps.push(
          createStep({
            op: 'traverse',
            action: 'enqueue',
            reason: `Enqueue left child ${tree.nodes[node.left].key}.`,
            tree,
            codeLines: [TRAVERSE_LINE.LEVEL.ENQUEUE],
            highlights: { nodes: [node.left], edges: [[currentId, node.left]] },
          }),
        );
      }
      if (node.right) {
        queue.push(node.right);
        steps.push(
          createStep({
            op: 'traverse',
            action: 'enqueue',
            reason: `Enqueue right child ${tree.nodes[node.right].key}.`,
            tree,
            codeLines: [TRAVERSE_LINE.LEVEL.ENQUEUE],
            highlights: { nodes: [node.right], edges: [[currentId, node.right]] },
          }),
        );
      }
    }
    return reindexSteps(steps);
  }

  const visit = (nodeId: string | undefined, visitOrder: TraverseKind) => {
    if (!nodeId) return;
    const node = tree.nodes[nodeId];
    if (!node) return;

    if (visitOrder === 'pre') {
      recordVisit(nodeId, 'pre');
    }

    visit(node.left, visitOrder);

    if (visitOrder === 'in') {
      recordVisit(nodeId, 'in');
    }

    visit(node.right, visitOrder);

    if (visitOrder === 'post') {
      recordVisit(nodeId, 'post');
    }
  };

  const recordVisit = (nodeId: string, order: 'pre' | 'in' | 'post') => {
    visited.push(nodeId);
    const line =
      order === 'pre' ? TRAVERSE_LINE.PRE.VISIT : order === 'post' ? TRAVERSE_LINE.POST.VISIT : TRAVERSE_LINE.IN.VISIT;
    steps.push(
      createStep({
        op: 'traverse',
        action: 'visit-node',
        reason: `Visit ${tree.nodes[nodeId].key} during ${order}-order traversal.`,
        tree,
        codeLines: [line],
        highlights: { nodes: [nodeId], orderTag: [...visited] },
      }),
    );
  };

  visit(tree.root, kind);
  return reindexSteps(steps);
}
