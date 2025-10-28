import { NodeID, RemoveResult, Step, TreeState } from '../types';
import { cloneTreeState, createStep, reindexSteps } from './utils';

const DELETE_LINE = {
  START: 1,
  SEARCH_LOOP: 3,
  MOVE_LEFT: 4,
  MOVE_RIGHT: 5,
  NOT_FOUND: 6,
  MULTISET: 7,
  SINGLE_CHILD_RIGHT: 10,
  SINGLE_CHILD_LEFT: 11,
  TWO_CHILDREN: 8,
  TRANSPLANT: 9,
  DELETE: 12,
};

type WorkingState = TreeState;

export function remove(tree: TreeState, key: number | string): RemoveResult {
  const steps: Step[] = [];
  const nextState = cloneTreeState(tree);
  const { comparator } = tree.config;

  if (!nextState.root) {
    steps.push(
      createStep({
        op: 'delete',
        action: 'compare',
        reason: 'Tree is empty; nothing to delete.',
        tree: nextState,
        codeLines: [DELETE_LINE.START],
        highlights: {},
      }),
    );
    return { steps: reindexSteps(steps), next: tree };
  }

  let currentId: NodeID | undefined = nextState.root;
  let targetId: NodeID | undefined;

  while (currentId) {
    const node = nextState.nodes[currentId];
    const cmp = comparator(key, node.key);
    steps.push(
      createStep({
        op: 'delete',
        action: 'compare',
        reason:
          cmp === 0
            ? `Found node ${node.key} to delete.`
            : cmp < 0
            ? `${key} < ${node.key}; traverse left.`
            : `${key} > ${node.key}; traverse right.`,
        tree: nextState,
        codeLines: [DELETE_LINE.SEARCH_LOOP],
        highlights: { nodes: [currentId] },
      }),
    );

    if (cmp === 0) {
      targetId = currentId;
      break;
    }

    if (cmp < 0) {
      if (!node.left) {
        steps.push(
          createStep({
            op: 'delete',
            action: 'move-left',
            reason: `No left child from ${node.key}; ${key} not present.`,
            tree: nextState,
            codeLines: [DELETE_LINE.MOVE_LEFT, DELETE_LINE.NOT_FOUND],
            highlights: { nodes: [node.id] },
          }),
        );
        return { steps: reindexSteps(steps), next: tree };
      }
      currentId = node.left;
      steps.push(
        createStep({
          op: 'delete',
          action: 'move-left',
          reason: `Moving left to ${nextState.nodes[currentId].key}.`,
          tree: nextState,
          codeLines: [DELETE_LINE.MOVE_LEFT],
          highlights: { nodes: [currentId], edges: [[node.id, currentId]] },
        }),
      );
    } else {
      if (!node.right) {
        steps.push(
          createStep({
            op: 'delete',
            action: 'move-right',
            reason: `No right child from ${node.key}; ${key} not present.`,
            tree: nextState,
            codeLines: [DELETE_LINE.MOVE_RIGHT, DELETE_LINE.NOT_FOUND],
            highlights: { nodes: [node.id] },
          }),
        );
        return { steps: reindexSteps(steps), next: tree };
      }
      currentId = node.right;
      steps.push(
        createStep({
          op: 'delete',
          action: 'move-right',
          reason: `Moving right to ${nextState.nodes[currentId].key}.`,
          tree: nextState,
          codeLines: [DELETE_LINE.MOVE_RIGHT],
          highlights: { nodes: [currentId], edges: [[node.id, currentId]] },
        }),
      );
    }
  }

  if (!targetId) {
    steps.push(
      createStep({
        op: 'delete',
        action: 'visit-node',
        reason: `Key ${key} not found; no deletion.`,
        tree: nextState,
        codeLines: [DELETE_LINE.NOT_FOUND],
        highlights: {},
      }),
    );
    return { steps: reindexSteps(steps), next: tree };
  }

  const targetNode = nextState.nodes[targetId];

  if (tree.config.duplicatePolicy === 'multiset' && (targetNode.meta?.count ?? 1) > 1) {
    const newCount = (targetNode.meta?.count ?? 1) - 1;
    nextState.nodes[targetId] = {
      ...targetNode,
      meta: { ...targetNode.meta, count: newCount },
    };
    steps.push(
      createStep({
        op: 'delete',
        action: 'replace-value',
        reason: `Duplicate policy multiset: decrementing count of ${targetNode.key} to ${newCount}.`,
        tree: nextState,
        codeLines: [DELETE_LINE.MULTISET],
        highlights: { nodes: [targetId] },
      }),
    );
    return { steps: reindexSteps(steps), next: nextState };
  }

  if (!targetNode.left) {
    transplant(nextState, steps, targetId, targetNode.right, {
      reason: `Node ${targetNode.key} has no left child; replace with right subtree.`,
      codeLine: DELETE_LINE.SINGLE_CHILD_RIGHT,
    });
  } else if (!targetNode.right) {
    transplant(nextState, steps, targetId, targetNode.left, {
      reason: `Node ${targetNode.key} has no right child; replace with left subtree.`,
      codeLine: DELETE_LINE.SINGLE_CHILD_LEFT,
    });
  } else {
    const successorResult = findSuccessor(nextState, steps, targetNode.right);
    const successorId = successorResult.id;
    if (!successorId) {
      transplant(nextState, steps, targetId, targetNode.right, {
        reason: `No successor found; fallback replacing with right child.`,
        codeLine: DELETE_LINE.SINGLE_CHILD_RIGHT,
      });
    } else {
      const successorNode = nextState.nodes[successorId];
      steps.push(
        createStep({
          op: 'delete',
          action: 'transplant',
          reason: `Successor ${successorNode.key} selected to replace ${targetNode.key}.`,
          tree: nextState,
          codeLines: [DELETE_LINE.TWO_CHILDREN, DELETE_LINE.TRANSPLANT],
          highlights: { nodes: [targetId, successorId], edges: [[successorNode.parent!, successorId]] },
        }),
      );

      if (successorNode.parent !== targetId) {
        transplant(nextState, steps, successorId, successorNode.right, {
          reason: `Lift successor ${successorNode.key}; connect its right child upwards.`,
          codeLine: DELETE_LINE.TRANSPLANT,
        });
        const refreshedTarget = nextState.nodes[targetId];
        const updatedSuccessor = { ...nextState.nodes[successorId], right: refreshedTarget.right };
        if (refreshedTarget.right) {
          nextState.nodes[refreshedTarget.right] = {
            ...nextState.nodes[refreshedTarget.right],
            parent: successorId,
          };
        }
        nextState.nodes[successorId] = updatedSuccessor;
      }

      transplant(nextState, steps, targetId, successorId, {
        reason: `Transplant successor ${successorNode.key} into target position.`,
        codeLine: DELETE_LINE.TRANSPLANT,
      });
      const updatedSuccessor = nextState.nodes[successorId];
      const refreshedTarget = nextState.nodes[targetId];
      nextState.nodes[successorId] = {
        ...updatedSuccessor,
        left: refreshedTarget.left,
        right: updatedSuccessor.right ?? refreshedTarget.right,
      };
      if (refreshedTarget.left) {
        nextState.nodes[refreshedTarget.left] = {
          ...nextState.nodes[refreshedTarget.left],
          parent: successorId,
        };
      }
      if (refreshedTarget.right) {
        nextState.nodes[refreshedTarget.right] = {
          ...nextState.nodes[refreshedTarget.right],
          parent: successorId,
        };
      }
    }
  }

  delete nextState.nodes[targetId];
  steps.push(
    createStep({
      op: 'delete',
      action: 'delete-node',
      reason: `Node ${targetNode.key} removed from tree.`,
      tree: nextState,
      codeLines: [DELETE_LINE.DELETE],
      highlights: { nodes: [] },
    }),
  );

  return { steps: reindexSteps(steps), next: nextState };
}

function transplant(
  tree: WorkingState,
  steps: Step[],
  uId: NodeID,
  vId: NodeID | undefined,
  detail: { reason: string; codeLine: number },
) {
  const uNode = tree.nodes[uId];
  if (!uNode) return;
  if (!uNode.parent) {
    tree.root = vId;
  } else if (tree.nodes[uNode.parent]?.left === uId) {
    tree.nodes[uNode.parent] = { ...tree.nodes[uNode.parent], left: vId };
  } else {
    tree.nodes[uNode.parent!] = { ...tree.nodes[uNode.parent!], right: vId };
  }
  if (vId) {
    tree.nodes[vId] = { ...tree.nodes[vId], parent: uNode.parent };
  }

  steps.push(
    createStep({
      op: 'delete',
      action: 'transplant',
      reason: detail.reason,
      tree,
      codeLines: [detail.codeLine],
      highlights: vId
        ? {
            nodes: [uId, vId],
            edges: uNode.parent ? [[uNode.parent, vId]] : undefined,
          }
        : { nodes: [uId] },
    }),
  );
}

function findSuccessor(tree: WorkingState, steps: Step[], startId?: NodeID) {
  let currentId = startId;
  if (!currentId) return { id: undefined };

  steps.push(
    createStep({
      op: 'delete',
      action: 'compare',
      reason: `Find successor: start at right child ${tree.nodes[currentId].key}.`,
      tree,
      codeLines: [DELETE_LINE.TWO_CHILDREN],
      highlights: { nodes: [currentId] },
    }),
  );

  while (tree.nodes[currentId]?.left) {
    const nextId = tree.nodes[currentId].left as NodeID;
    steps.push(
      createStep({
        op: 'delete',
        action: 'move-left',
        reason: `Successor search: move left to ${tree.nodes[nextId].key}.`,
        tree,
        codeLines: [DELETE_LINE.TWO_CHILDREN],
        highlights: { nodes: [nextId], edges: [[currentId, nextId]] },
      }),
    );
    currentId = nextId;
  }

  steps.push(
    createStep({
      op: 'delete',
      action: 'visit-node',
      reason: `Successor identified: ${tree.nodes[currentId].key}.`,
      tree,
      codeLines: [DELETE_LINE.TWO_CHILDREN],
      highlights: { nodes: [currentId] },
    }),
  );

  return { id: currentId };
}
