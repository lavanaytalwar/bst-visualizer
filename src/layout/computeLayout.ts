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
  let order = 0;

  const assign = (nodeId: NodeID | undefined, depth: number) => {
    if (!nodeId) return;
    const node = tree.nodes[nodeId];
    if (!node) return;
    assign(node.left, depth + 1);
    layout[nodeId] = {
      x: order * horizontalSpacing,
      y: depth * verticalSpacing,
      depth,
    };
    order += 1;
    assign(node.right, depth + 1);
  };

  assign(tree.root, 0);

  const xs = Object.values(layout).map((item) => item.x);
  if (!xs.length) return layout;
  const minX = Math.min(...xs);
  const offset = -minX + horizontalSpacing;
  Object.keys(layout).forEach((id) => {
    layout[id] = {
      ...layout[id],
      x: layout[id].x + offset,
    };
  });

  return layout;
};
