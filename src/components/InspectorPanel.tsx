import React, { useMemo } from 'react';
import { useVisualizerStore, useVisualizedTree } from '../state/visualizerStore';
import { getDepth, getHeight, getPredecessor, getSubtreeSize, getSuccessor } from '../utils/metrics';

export const InspectorPanel: React.FC = () => {
  const {
    state: { selectedNodeId },
  } = useVisualizerStore();
  const tree = useVisualizedTree();

  const node = selectedNodeId ? tree.nodes[selectedNodeId] : undefined;

  const metrics = useMemo(() => {
    if (!node) return null;
    const depth = getDepth(tree, node.id);
    const height = getHeight(tree, node.id) - 1;
    const size = getSubtreeSize(tree, node.id);
    const predecessorId = getPredecessor(tree, node.id);
    const successorId = getSuccessor(tree, node.id);
    return {
      depth,
      height,
      size,
      predecessor: predecessorId ? tree.nodes[predecessorId]?.key : 'None',
      successor: successorId ? tree.nodes[successorId]?.key : 'None',
    };
  }, [node, tree]);

  return (
    <div className="panelCard infoCard">
      <header className="panelCardHeader">
        <h2>Node Inspector</h2>
        <p className="panelSubtitle">Select a node in the tree to reveal its local metrics.</p>
      </header>
      {!node && <p className="emptyState">Tap a node to surface its depth, height, neighbours, and more.</p>}
      {node && metrics && (
        <dl className="metricsGrid">
          <div>
            <dt>Key</dt>
            <dd>{node.key}</dd>
          </div>
          {node.meta?.count && (
            <div>
              <dt>Count</dt>
              <dd>{node.meta.count}</dd>
            </div>
          )}
          <div>
            <dt>Depth</dt>
            <dd>{metrics.depth}</dd>
          </div>
          <div>
            <dt>Height</dt>
            <dd>{metrics.height}</dd>
          </div>
          <div>
            <dt>Subtree size</dt>
            <dd>{metrics.size}</dd>
          </div>
          <div>
            <dt>Predecessor</dt>
            <dd>{metrics.predecessor}</dd>
          </div>
          <div>
            <dt>Successor</dt>
            <dd>{metrics.successor}</dd>
          </div>
        </dl>
      )}
    </div>
  );
};
