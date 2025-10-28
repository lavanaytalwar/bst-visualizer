import React, { useMemo } from 'react';
import { useVisualizerStore, useCurrentStep, useVisualizedTree } from '../state/visualizerStore';
import { getDepth, getHeight, getPredecessor, getSubtreeSize, getSuccessor } from '../utils/metrics';
import { PSEUDOCODE, blockForStep } from '../data/pseudocode';
import styles from './RightColumn.module.css';

interface RightColumnProps {
  onOpenPseudocode: () => void;
}

const splitLine = (line: string) => {
  const match = line.match(/^(\d+)\s+(.*)$/);
  if (!match) {
    return { number: 0, text: line };
  }
  return { number: Number(match[1]), text: match[2] };
};

export const RightColumn: React.FC<RightColumnProps> = ({ onOpenPseudocode }) => {
  const {
    state: { currentSteps, currentStepIndex, selectedNodeId },
    dispatch,
  } = useVisualizerStore();
  const currentStep = useCurrentStep();
  const tree = useVisualizedTree();

  const activeBlockId = blockForStep(currentStep?.op);
  const activeBlock = PSEUDOCODE.find((block) => block.id === activeBlockId);
  const highlightLines = useMemo(() => new Set(currentStep?.codeLines ?? []), [currentStep?.codeLines]);

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

  const handleSelectStep = (index: number) => {
    dispatch({ type: 'SET_STEP_INDEX', payload: { index } });
  };

  return (
    <div className={`${styles.column} scrollColumn`}>
      <section className={`card ${styles.section}`} aria-labelledby="now-playing-heading">
        <header className="sectionHeader">
          <div className="sectionHeaderTitle">
            <h2 id="now-playing-heading">Now Playing</h2>
            <span>Follow each decision and invariant check.</span>
          </div>
          {currentSteps.length > 0 && (
            <span className="badge">
              Step {currentStepIndex + 1} / {currentSteps.length}
            </span>
          )}
        </header>

        {currentStep ? (
          <>
            <div className="currentStepCard">
              <div className={styles.nowPlayingHeader}>
                <p className={styles.stepName}>{currentStep.action}</p>
                <div className={styles.stepMeta}>
                  {currentStep.op && <span>{currentStep.op.toUpperCase()}</span>}
                  {currentStep.codeLines && currentStep.codeLines.length > 0 && (
                    <span>
                      {currentStep.codeLines.length === 1
                        ? `Line ${currentStep.codeLines[0]}`
                        : `Lines ${currentStep.codeLines.join(', ')}`}
                    </span>
                  )}
                </div>
              </div>
              <p className={styles.stepReason}>{currentStep.reason}</p>
            </div>

            <div className={styles.invariantList}>
              <span className={styles.invariantTitle}>Invariant checks</span>
              {(currentStep.invariantChecks?.length ?? 0) > 0 ? (
                currentStep.invariantChecks!.map((check) => (
                  <span
                    key={check.name}
                    className={styles.invariantItem}
                    role="status"
                    aria-label={`${check.name} ${check.passed ? 'passed' : 'failed'}`}
                  >
                    <span
                      className={check.passed ? styles.statusOk : styles.statusWarn}
                      aria-hidden="true"
                    />
                    {check.name}
                    {check.detail ? ` — ${check.detail}` : ''}
                  </span>
                ))
              ) : (
                <span className={styles.muted}>No invariants evaluated on this step.</span>
              )}
            </div>
          </>
        ) : (
          <p className={styles.muted}>Queue an operation to begin the step-by-step narration.</p>
        )}

        <hr className="divider" />

        <ul className={`${styles.stepList} listReset`} role="listbox" aria-label="Explain why steps">
          {currentSteps.map((step, index) => {
            const active = index === currentStepIndex;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  className={`${styles.stepItem} focusRing ${active ? styles.stepItemActive : ''}`}
                  onClick={() => handleSelectStep(index)}
                  aria-pressed={active}
                >
                  <div className={styles.stepAction}>
                    <strong>{step.action}</strong>
                    {step.codeLines && step.codeLines.length > 0 && (
                      <span>
                        {step.codeLines.length === 1
                          ? `Line ${step.codeLines[0]}`
                          : `Lines ${step.codeLines.join(', ')}`}
                      </span>
                    )}
                  </div>
                  <p className={styles.stepDescription}>{step.reason}</p>
                </button>
              </li>
            );
          })}
        </ul>
        {currentSteps.length === 0 && (
          <p className={styles.muted}>Run an operation to populate the timeline.</p>
        )}
      </section>

      <section className={`card ${styles.section}`} aria-labelledby="algorithm-heading">
        <header className="sectionHeader">
          <div className="sectionHeaderTitle">
            <h2 id="algorithm-heading">Algorithm</h2>
            <span>Active pseudocode lines update with the timeline.</span>
          </div>
          <button type="button" className="textButton focusRing" onClick={onOpenPseudocode}>
            Open full pseudocode
          </button>
        </header>
        {activeBlock ? (
          <div className={styles.codeWrapper} role="group" aria-label={`${activeBlock.title} pseudocode`}>
            {activeBlock.lines.map((line) => {
              const { number, text } = splitLine(line);
              const isActive = highlightLines.has(number);
              const lineClasses = [styles.codeLine, isActive ? 'highlightLine' : '']
                .filter(Boolean)
                .join(' ');
              return (
                <div key={`${activeBlock.id}-${number}`} className={lineClasses}>
                  <span className={styles.codeLineNumber}>{number}</span>
                  <span className={styles.codeText}>{text}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.muted}>Start an operation to see its pseudocode trace.</p>
        )}
      </section>

      <section className={`card ${styles.section}`} aria-labelledby="inspector-heading">
        <header className="sectionHeader">
          <div className="sectionHeaderTitle">
            <h2 id="inspector-heading">Node Details</h2>
            <span>Inspect the selected node&apos;s local metrics.</span>
          </div>
        </header>
        {node && metrics ? (
          <dl className="dataGrid">
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
        ) : (
          <p className={styles.inspectorEmpty}>Select a node to see depth, height, neighbours, and more.</p>
        )}
      </section>

      <div className={`visually-hidden ${styles.liveRegion}`} aria-live="polite">
        {currentStep?.reason ?? 'Awaiting operation.'}
      </div>
    </div>
  );
};
