import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  OperationHistoryEntry,
  TreeConfig,
  TreeState,
  VisualizerAction,
  VisualizerState,
} from '../types';

export const defaultComparator: TreeConfig['comparator'] = (a: any, b: any) => {
  if (a === b) return 0;
  if (a > b) return 1;
  return -1;
};

export const createInitialTree = (): TreeState => ({
  root: undefined,
  nodes: {},
  config: {
    duplicatePolicy: 'reject',
    maxNodes: 256,
    comparator: defaultComparator,
  },
});

const initialState: VisualizerState = {
  tree: createInitialTree(),
  currentSteps: [],
  currentStepIndex: 0,
  history: [],
  historyIndex: -1,
  isPlaying: false,
  speed: 1,
  stepMode: false,
  selectedNodeId: undefined,
  highContrast: false,
};

function cloneEntry(entry: OperationHistoryEntry): OperationHistoryEntry {
  return {
    ...entry,
    preTreeSnapshot: {
      ...entry.preTreeSnapshot,
      nodes: Object.fromEntries(
        Object.entries(entry.preTreeSnapshot.nodes).map(([id, node]) => [id, { ...node }]),
      ),
    },
    postTreeSnapshot: {
      ...entry.postTreeSnapshot,
      nodes: Object.fromEntries(
        Object.entries(entry.postTreeSnapshot.nodes).map(([id, node]) => [id, { ...node }]),
      ),
    },
    steps: entry.steps.map((step) => ({ ...step, invariantChecks: step.invariantChecks.map((c) => ({ ...c })) })),
  };
}

const reducer = (state: VisualizerState, action: VisualizerAction): VisualizerState => {
  switch (action.type) {
    case 'APPLY_OPERATION': {
      const newEntry = cloneEntry(action.payload.entry);
      const nextHistory = state.history.slice(0, state.historyIndex + 1).concat(newEntry);
      const newIndex = nextHistory.length - 1;
      return {
        ...state,
        history: nextHistory,
        historyIndex: newIndex,
        tree: newEntry.postTreeSnapshot,
        currentSteps: newEntry.steps,
        currentStepIndex: 0,
        isPlaying: false,
      };
    }
    case 'STEP_NEXT': {
      if (!state.currentSteps.length) return state;
      if (state.currentStepIndex >= state.currentSteps.length - 1) {
        return { ...state, isPlaying: false, currentStepIndex: state.currentSteps.length - 1 };
      }
      const nextIndex = state.currentStepIndex + 1;
      return {
        ...state,
        currentStepIndex: nextIndex,
        isPlaying: state.stepMode ? false : state.isPlaying,
      };
    }
    case 'STEP_PREV': {
      if (!state.currentSteps.length) return state;
      const prevIndex = Math.max(0, state.currentStepIndex - 1);
      return { ...state, currentStepIndex: prevIndex, isPlaying: false };
    }
    case 'SET_STEP_INDEX': {
      if (!state.currentSteps.length) return { ...state, currentStepIndex: 0, isPlaying: false };
      const index = Math.min(Math.max(0, action.payload.index), state.currentSteps.length - 1);
      return { ...state, currentStepIndex: index, isPlaying: false };
    }
    case 'PLAY':
      if (!state.currentSteps.length) return state;
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'SET_SPEED':
      return { ...state, speed: Math.min(3, Math.max(0.25, action.payload.speed)) };
    case 'UNDO_OPERATION': {
      if (state.historyIndex < 0) return state;
      const currentEntry = state.history[state.historyIndex];
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        historyIndex: newIndex,
        tree: currentEntry.preTreeSnapshot,
        currentSteps: [],
        currentStepIndex: 0,
        isPlaying: false,
      };
    }
    case 'REDO_OPERATION': {
      if (state.historyIndex + 1 >= state.history.length) return state;
      const newIndex = state.historyIndex + 1;
      const entry = state.history[newIndex];
      return {
        ...state,
        historyIndex: newIndex,
        tree: entry.postTreeSnapshot,
        currentSteps: entry.steps,
        currentStepIndex: 0,
        isPlaying: false,
      };
    }
    case 'RESET_TREE':
      return {
        ...state,
        tree: action.payload.tree,
        currentSteps: [],
        currentStepIndex: 0,
        history: [],
        historyIndex: -1,
        isPlaying: false,
      };
    case 'SET_STEP_MODE':
      return { ...state, stepMode: action.payload.stepMode };
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNodeId: action.payload.nodeId };
    case 'SET_HIGH_CONTRAST':
      return { ...state, highContrast: action.payload.highContrast };
    case 'SET_DUPLICATE_POLICY':
      return {
        ...state,
        tree: {
          ...state.tree,
          config: { ...state.tree.config, duplicatePolicy: action.payload.policy },
        },
      };
    default:
      return state;
  }
};

interface VisualizerContextValue {
  state: VisualizerState;
  dispatch: React.Dispatch<VisualizerAction>;
}

const VisualizerContext = createContext<VisualizerContextValue | undefined>(undefined);

export const VisualizerProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const rafRef = useRef<number>();
  const frameRef = useRef<{ last: number; progress: number }>({ last: 0, progress: 0 });
  const BASE_STEP_MS = 900;

  useEffect(() => {
    if (!state.isPlaying || !state.currentSteps.length) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      frameRef.current = { last: 0, progress: 0 };
      return;
    }

    const tick = (time: number) => {
      if (!frameRef.current.last) {
        frameRef.current.last = time;
      }
      const delta = time - frameRef.current.last;
      frameRef.current.last = time;
      frameRef.current.progress += delta * state.speed;

      if (frameRef.current.progress >= BASE_STEP_MS) {
        frameRef.current.progress = 0;
        dispatch({ type: 'STEP_NEXT' });
      }

      if (state.isPlaying) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      frameRef.current = { last: 0, progress: 0 };
    };
  }, [state.isPlaying, state.speed, state.currentSteps.length]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <VisualizerContext.Provider value={value}>{children}</VisualizerContext.Provider>;
};

export const useVisualizerStore = () => {
  const ctx = useContext(VisualizerContext);
  if (!ctx) {
    throw new Error('useVisualizerStore must be used within VisualizerProvider');
  }
  return ctx;
};

export const useCurrentStep = () => {
  const {
    state: { currentSteps, currentStepIndex },
  } = useVisualizerStore();
  return currentSteps[currentStepIndex];
};

export const useVisualizedTree = () => {
  const {
    state: { tree, currentSteps, currentStepIndex },
  } = useVisualizerStore();
  return currentSteps[currentStepIndex]?.treeSnapshot ?? tree;
};

export const resetVisualizerState = () => initialState;
