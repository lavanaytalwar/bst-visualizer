import React, { FormEvent, RefObject, useState } from 'react';
import {
  OperationHistoryEntry,
  Step,
  TreeState,
  TraverseKind,
} from '../types';
import { insert, remove, search, traverse } from '../engine';
import { useVisualizerStore, createInitialTree } from '../state/visualizerStore';
import { exportSessionJson, exportSvgToPng } from '../utils/export';
import styles from './ControlsPanel.module.css';

interface ControlsPanelProps {
  svgElement: SVGSVGElement | null;
  onCenterView: () => void;
  insertInputRef?: RefObject<HTMLInputElement>;
  searchInputRef?: RefObject<HTMLInputElement>;
  deleteInputRef?: RefObject<HTMLInputElement>;
}

const speedOptions = [0.25, 0.5, 1, 1.5, 2, 3];

const cloneTree = (tree: TreeState): TreeState => ({
  root: tree.root,
  nodes: Object.fromEntries(Object.entries(tree.nodes).map(([id, node]) => [id, { ...node }])),
  config: tree.config,
});

const createOpId = () => `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  svgElement,
  onCenterView,
  insertInputRef,
  searchInputRef,
  deleteInputRef,
}) => {
  const { state, dispatch } = useVisualizerStore();
  const [insertValue, setInsertValue] = useState('');
  const [deleteValue, setDeleteValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [batchText, setBatchText] = useState('');
  const [importText, setImportText] = useState('');

  const duplicatePolicy = state.tree.config.duplicatePolicy;

  const applyEntry = (entry: OperationHistoryEntry) => {
    dispatch({
      type: 'APPLY_OPERATION',
      payload: { entry },
    });
  };

  const buildEntry = (
    opType: OperationHistoryEntry['opType'],
    steps: Step[],
    preTree: TreeState,
    postTree: TreeState,
  ): OperationHistoryEntry => ({
    opId: createOpId(),
    opType,
    steps,
    preTreeSnapshot: cloneTree(preTree),
    postTreeSnapshot: cloneTree(postTree),
  });

  const handleInsert = (event: FormEvent) => {
    event.preventDefault();
    if (!insertValue.trim()) return;
    const parsed = Number(insertValue);
    if (Number.isNaN(parsed)) return;
    const result = insert(state.tree, parsed);
    applyEntry(buildEntry('insert', result.steps, state.tree, result.next));
    setInsertValue('');
  };

  const handleDelete = (event: FormEvent) => {
    event.preventDefault();
    if (!deleteValue.trim()) return;
    const parsed = Number(deleteValue);
    if (Number.isNaN(parsed)) return;
    const result = remove(state.tree, parsed);
    applyEntry(buildEntry('delete', result.steps, state.tree, result.next));
    setDeleteValue('');
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!searchValue.trim()) return;
    const parsed = Number(searchValue);
    if (Number.isNaN(parsed)) return;
    const result = search(state.tree, parsed);
    const postTree = cloneTree(state.tree);
    applyEntry(buildEntry('search', result.steps, state.tree, postTree));
    setSearchValue('');
  };

  const runTraversal = (kind: TraverseKind) => {
    const steps = traverse(state.tree, kind);
    const postTree = cloneTree(state.tree);
    applyEntry(buildEntry('traverse', steps, state.tree, postTree));
  };

  const runBatchInsert = () => {
    const tokens = batchText
      .split(/[, \n]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (!tokens.length) return;
    let workingTree = cloneTree(state.tree);
    tokens.forEach((token) => {
      const number = Number(token);
      if (Number.isNaN(number)) return;
      const result = insert(workingTree, number);
      applyEntry(buildEntry('insert', result.steps, workingTree, result.next));
      workingTree = result.next;
    });
    setBatchText('');
  };

  const parseScriptLine = (line: string) => {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('I ')) {
      return { type: 'insert' as const, value: Number(trimmed.slice(2).trim()) };
    }
    if (upper.startsWith('S ')) {
      return { type: 'search' as const, value: Number(trimmed.slice(2).trim()) };
    }
    if (upper.startsWith('D ')) {
      return { type: 'delete' as const, value: Number(trimmed.slice(2).trim()) };
    }
    if (upper.startsWith('T ')) {
      const kindToken = upper.slice(2).trim();
      const map: Record<string, TraverseKind> = { IN: 'in', PRE: 'pre', POST: 'post', LEVEL: 'level' };
      const kind = map[kindToken];
      if (kind) {
        return { type: 'traverse' as const, kind };
      }
    }
    return null;
  };

  const handleImport = () => {
    const raw = importText.trim();
    if (!raw) return;
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          let workingTree = cloneTree(state.tree);
          parsed.forEach((value) => {
            const number = Number(value);
            if (Number.isNaN(number)) return;
            const result = insert(workingTree, number);
            applyEntry(buildEntry('insert', result.steps, workingTree, result.next));
            workingTree = result.next;
          });
        }
      } catch (error) {
        console.warn('Failed to parse import list', error);
      }
    } else {
      const lines = raw.split(/[\n,]+/);
      let workingTree = cloneTree(state.tree);
      lines.forEach((line) => {
        const parsed = parseScriptLine(line);
        if (!parsed) return;
        if (parsed.type === 'insert') {
          if (Number.isNaN(parsed.value)) return;
          const result = insert(workingTree, parsed.value);
          applyEntry(buildEntry('insert', result.steps, workingTree, result.next));
          workingTree = result.next;
        } else if (parsed.type === 'delete') {
          if (Number.isNaN(parsed.value)) return;
          const result = remove(workingTree, parsed.value);
          applyEntry(buildEntry('delete', result.steps, workingTree, result.next));
          workingTree = result.next;
        } else if (parsed.type === 'search') {
          if (Number.isNaN(parsed.value)) return;
          const result = search(workingTree, parsed.value);
          const postTree = cloneTree(workingTree);
          applyEntry(buildEntry('search', result.steps, workingTree, postTree));
        } else if (parsed.type === 'traverse') {
          const steps = traverse(workingTree, parsed.kind);
          const postTree = cloneTree(workingTree);
          applyEntry(buildEntry('traverse', steps, workingTree, postTree));
        }
      });
    }
    setImportText('');
  };

  return (
    <div className={`${styles.panel} scrollColumn`}>
      <section className={`card ${styles.section}`} aria-labelledby="controls-operations">
        <header className="sectionHeader">
          <div className="sectionHeaderTitle">
            <h2 id="controls-operations">Operations</h2>
            <span className={styles.sectionHeaderText}>Drive the tree one action at a time.</span>
          </div>
        </header>
        <form className={styles.controlRow} onSubmit={handleInsert}>
          <label htmlFor="insert-input" className="visually-hidden">
            Insert key
          </label>
          <input
            id="insert-input"
            ref={insertInputRef}
            value={insertValue}
            onChange={(event) => setInsertValue(event.target.value)}
            placeholder="Insert key"
            aria-label="Insert key"
            type="number"
            inputMode="numeric"
            className="focusRing"
          />
          <button type="submit" className={`primaryAction focusRing ${styles.actionButton}`} aria-label="Insert key">
            Insert
          </button>
        </form>
        <form className={styles.controlRow} onSubmit={handleSearch}>
          <label htmlFor="search-input" className="visually-hidden">
            Search key
          </label>
          <input
            id="search-input"
            ref={searchInputRef}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search key"
            aria-label="Search key"
            type="number"
            inputMode="numeric"
            className="focusRing"
          />
          <button type="submit" className={`primaryAction focusRing ${styles.actionButton}`} aria-label="Search for key">
            Search
          </button>
        </form>
        <form className={styles.controlRow} onSubmit={handleDelete}>
          <label htmlFor="delete-input" className="visually-hidden">
            Delete key
          </label>
          <input
            id="delete-input"
            ref={deleteInputRef}
            value={deleteValue}
            onChange={(event) => setDeleteValue(event.target.value)}
            placeholder="Delete key"
            aria-label="Delete key"
            type="number"
            inputMode="numeric"
            className="focusRing"
          />
          <button type="submit" className={`primaryAction focusRing ${styles.actionButton}`} aria-label="Delete key">
            Delete
          </button>
        </form>
        <div className={styles.traversalGroup} role="group" aria-label="Run traversal">
          <button type="button" className={`${styles.traversalButton} focusRing`} onClick={() => runTraversal('in')}>
            In-order
          </button>
          <button type="button" className={`${styles.traversalButton} focusRing`} onClick={() => runTraversal('pre')}>
            Pre-order
          </button>
          <button type="button" className={`${styles.traversalButton} focusRing`} onClick={() => runTraversal('post')}>
            Post-order
          </button>
          <button type="button" className={`${styles.traversalButton} focusRing`} onClick={() => runTraversal('level')}>
            Level-order
          </button>
        </div>
      </section>

      <section className={`card ${styles.section}`} aria-labelledby="controls-batch">
        <header className="sectionHeader">
          <div className="sectionHeaderTitle">
            <h2 id="controls-batch">Batch Builder</h2>
            <span className={styles.sectionHeaderText}>Seed the tree with a curated data set.</span>
          </div>
        </header>
        <textarea
          rows={3}
          value={batchText}
          onChange={(event) => setBatchText(event.target.value)}
          placeholder="Comma separated values: 8,3,10"
          aria-label="Batch insert values"
          className={`focusRing ${styles.textArea}`}
        />
        <button type="button" className="primaryAction focusRing" onClick={runBatchInsert}>
          Run Batch Inserts
        </button>
      </section>

      <section className={`card ${styles.section}`} aria-labelledby="controls-import">
        <header className="sectionHeader">
          <div className="sectionHeaderTitle">
            <h2 id="controls-import">Import / Export</h2>
            <span className={styles.sectionHeaderText}>Replay a script or share your session.</span>
          </div>
        </header>
        <textarea
          rows={3}
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="I 8, I 3, S 3, D 8, T IN"
          aria-label="Import operations script"
          className={`focusRing ${styles.textArea}`}
        />
        <div className={styles.buttonRow}>
          <button type="button" className="primaryAction focusRing" onClick={handleImport}>
            Run Script
          </button>
          <button
            type="button"
            className="secondaryAction focusRing"
            onClick={() => exportSessionJson(state.tree, state.history)}
          >
            Download JSON
          </button>
          <button type="button" className="secondaryAction focusRing" onClick={() => exportSvgToPng(svgElement)}>
            Export PNG
          </button>
        </div>
      </section>

      <section className={`card ${styles.section}`} aria-labelledby="controls-settings">
        <header className="sectionHeader">
          <div className="sectionHeaderTitle">
            <h2 id="controls-settings">Settings</h2>
            <span className={styles.sectionHeaderText}>Fine-tune how the visualizer behaves.</span>
          </div>
        </header>
        <div className={styles.settingStack}>
          <div className={styles.settingRow}>
            <label htmlFor="duplicate-policy">Duplicate policy</label>
            <select
              id="duplicate-policy"
              value={duplicatePolicy}
              onChange={(event) =>
                dispatch({
                  type: 'SET_DUPLICATE_POLICY',
                  payload: { policy: event.target.value as TreeState['config']['duplicatePolicy'] },
                })
              }
              className="focusRing"
            >
              <option value="reject">Reject</option>
              <option value="allow-left">Allow Left</option>
              <option value="allow-right">Allow Right</option>
              <option value="multiset">Multiset</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <label htmlFor="speed-select">Animation speed</label>
            <select
              id="speed-select"
              value={state.speed}
              onChange={(event) => dispatch({ type: 'SET_SPEED', payload: { speed: Number(event.target.value) } })}
              className="focusRing"
            >
              {speedOptions.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.toggleRow}>
          <input
            id="step-mode"
            type="checkbox"
            checked={state.stepMode}
            onChange={(event) => dispatch({ type: 'SET_STEP_MODE', payload: { stepMode: event.target.checked } })}
            className="focusRing"
          />
          <label htmlFor="step-mode">Step-by-step mode</label>
        </div>
        <div className={styles.toggleRow}>
          <input
            id="high-contrast"
            type="checkbox"
            checked={state.highContrast}
            onChange={(event) => dispatch({ type: 'SET_HIGH_CONTRAST', payload: { highContrast: event.target.checked } })}
            className="focusRing"
          />
          <label htmlFor="high-contrast">High contrast</label>
        </div>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className="secondaryAction focusRing"
            onClick={() =>
              dispatch({
                type: 'RESET_TREE',
                payload: { tree: { ...createInitialTree(), config: { ...state.tree.config } } },
              })
            }
          >
            Reset Tree
          </button>
          <button type="button" className="secondaryAction focusRing" onClick={onCenterView}>
            Center View
          </button>
        </div>
      </section>
    </div>
  );
};
