import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVisualizerStore, useVisualizedTree, useCurrentStep } from '../state/visualizerStore';
import { computeLayout } from '../layout/computeLayout';
import { BSTNode, NodeID } from '../types';
import { useAnimatedLayout } from '../utils/useAnimatedLayout';
import styles from './TreeViewport.module.css';

interface TreeViewportProps {
  centerSignal: number;
  onSvgReady: (svg: SVGSVGElement | null) => void;
}

const NODE_RADIUS = 24;

export const TreeViewport: React.FC<TreeViewportProps> = ({ centerSignal, onSvgReady }) => {
  const {
    state: { selectedNodeId },
    dispatch,
  } = useVisualizerStore();
  const tree = useVisualizedTree();
  const currentStep = useCurrentStep();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const layout = useMemo(() => computeLayout(tree), [tree]);
  const animatedLayout = useAnimatedLayout(layout);

  const highlightedNodes = useMemo(
    () => new Set(currentStep?.highlights?.nodes ?? []),
    [currentStep?.highlights?.nodes],
  );
  const highlightedEdges = useMemo(() => {
    const edges = currentStep?.highlights?.edges ?? [];
    return new Set(edges.map(([from, to]) => `${from}-${to}`));
  }, [currentStep?.highlights?.edges]);
  const orderTagMap = useMemo(() => {
    const map = new Map<NodeID, number>();
    currentStep?.highlights?.orderTag?.forEach((id, index) => map.set(id, index));
    return map;
  }, [currentStep?.highlights?.orderTag]);

  useEffect(() => {
    onSvgReady(svgRef.current);
  }, [onSvgReady]);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [centerSignal]);

  const nodeAnimations = useMemo(() => {
    const map = new Map<NodeID, string>();
    if (!currentStep) return map;
    const highlighted = currentStep.highlights?.nodes ?? [];

    const assign = (className?: string) => {
      if (!className) return;
      highlighted.forEach((nodeId) => map.set(nodeId, className));
    };

    switch (currentStep.action) {
      case 'create-node':
        assign(styles.nodeEnter);
        break;
      case 'compare':
      case 'visit-node':
        assign(styles.nodePulse);
        break;
      case 'move-left':
      case 'move-right':
        assign(styles.nodeTraverse);
        break;
      case 'replace-value':
      case 'transplant':
        assign(styles.nodeSwap);
        break;
      case 'delete-node':
        assign(styles.nodeFade);
        break;
      case 'enqueue':
      case 'dequeue':
        assign(styles.nodeQueue);
        break;
      default:
        break;
    }

    return map;
  }, [currentStep]);

  const edgeAnimations = useMemo(() => {
    const map = new Map<string, string>();
    if (!currentStep) return map;
    const edges = currentStep.highlights?.edges ?? [];

    const assign = (className?: string) => {
      if (!className) return;
      edges.forEach(([from, to]) => map.set(`${from}-${to}`, className));
    };

    switch (currentStep.action) {
      case 'move-left':
      case 'move-right':
        assign(styles.edgeTraverse);
        break;
      case 'create-node':
        assign(styles.edgeGrow);
        break;
      case 'transplant':
        assign(styles.edgeSwap);
        break;
      default:
        break;
    }

    return map;
  }, [currentStep]);

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    setDragging(true);
    dragRef.current = { x: event.clientX - pan.x, y: event.clientY - pan.y };
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !dragRef.current) return;
    setPan({
      x: event.clientX - dragRef.current.x,
      y: event.clientY - dragRef.current.y,
    });
  };

  const stopDragging = () => {
    setDragging(false);
    dragRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const delta = -event.deltaY;
    const factor = delta > 0 ? 1.05 : 0.95;
    setZoom((prev) => Math.max(0.3, Math.min(2, prev * factor)));
  };

  const renderEdge = (parent: BSTNode, childId?: NodeID) => {
    if (!childId) return null;
    const child = tree.nodes[childId];
    if (!child) return null;
    const parentPos = animatedLayout[parent.id];
    const childPos = animatedLayout[childId];
    if (!parentPos || !childPos) return null;
    const key = `${parent.id}-${childId}`;
    const highlighted = highlightedEdges.has(key);
    const animationClass = edgeAnimations.get(key);
    const edgeClass = ['bstEdge', highlighted ? `bstEdgeActive ${styles.edgeActive}` : '', animationClass]
      .filter(Boolean)
      .join(' ');
    return (
      <line
        key={key}
        x1={parentPos.x}
        y1={parentPos.y}
        x2={childPos.x}
        y2={childPos.y}
        className={edgeClass}
      />
    );
  };

  const handleSelectNode = (nodeId: NodeID) => {
    dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId } });
  };

  const nodes = useMemo(() => Object.values(tree.nodes), [tree.nodes]);

  const nodeCount = nodes.length;
  const zoomPercent = Math.round(zoom * 100);
  const edgeElements = nodes.flatMap((node) => [renderEdge(node, node.left), renderEdge(node, node.right)]);

  return (
    <div className={styles.viewport}>
      <div className={styles.overlay} aria-hidden>
        <div>
          <p className={styles.overlayTitle}>Tree View</p>
        </div>
        <div className={styles.overlayMeta}>
          <span>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden focusable="false">
              <circle cx="6" cy="6" r="5" fill="var(--text-accent)" opacity="0.16" />
              <circle cx="6" cy="6" r="2.5" fill="var(--text-accent)" />
            </svg>
            {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
          </span>
          <span>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden focusable="false">
              <path
                d="M2 6h8M6 2v8"
                stroke="var(--text-accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
            {zoomPercent}%
          </span>
        </div>
      </div>
      <svg
        ref={svgRef}
        className={styles.svg}
        role="img"
        aria-label="Binary search tree visualization"
        tabIndex={-1}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onWheel={handleWheel}
        style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {edgeElements}
          {nodes.map((node) => {
            const position = animatedLayout[node.id];
            if (!position) return null;
            const isHighlighted = highlightedNodes.has(node.id);
            const isSelected = selectedNodeId === node.id;
            const orderIndex = orderTagMap.get(node.id);
            const orderLabel = orderIndex !== undefined ? String(orderIndex + 1) : null;
            const badgeWidth = orderLabel ? 22 + orderLabel.length * 6 : 0;
            const animationClass = nodeAnimations.get(node.id);
            const nodeClasses = [
              styles.node,
              'bstNode',
              isHighlighted ? 'bstNodeActive' : '',
              isSelected ? 'bstNodeSelected' : '',
              animationClass,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <g
                key={node.id}
                transform={`translate(${position.x} ${position.y})`}
              >
                <g
                  tabIndex={0}
                  role="button"
                  aria-label={`Node ${node.key}`}
                  onFocus={() => handleSelectNode(node.id)}
                  onClick={() => handleSelectNode(node.id)}
                  className={nodeClasses}
                >
                  <circle r={NODE_RADIUS} />
                  <text textAnchor="middle" dominantBaseline="central" className={styles.nodeLabel}>
                    {node.key}
                  </text>
                  {orderLabel && (
                    <g
                      className={`${styles.orderBadge} bstOrderTag`}
                      transform={`translate(${NODE_RADIUS + 18} ${-NODE_RADIUS - 6})`}
                    >
                      <rect x={-badgeWidth / 2} y={-9} width={badgeWidth} height={18} />
                      <text x={0} y={0} textAnchor="middle" dominantBaseline="central">
                        {orderLabel}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
