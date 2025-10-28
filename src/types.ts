export type NodeID = string;

export interface BSTNode {
  id: NodeID;
  key: number | string;
  left?: NodeID;
  right?: NodeID;
  parent?: NodeID;
  meta?: { count?: number };
}

export interface TreeConfig {
  duplicatePolicy: 'reject' | 'allow-left' | 'allow-right' | 'multiset';
  maxNodes: number;
  comparator: (a: any, b: any) => number;
}

export interface TreeState {
  root?: NodeID;
  nodes: Record<NodeID, BSTNode>;
  config: TreeConfig;
}

export type StepAction =
  | 'compare'
  | 'move-left'
  | 'move-right'
  | 'create-node'
  | 'visit-node'
  | 'transplant'
  | 'replace-value'
  | 'delete-node'
  | 'enqueue'
  | 'dequeue';

export interface InvariantCheck {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface StepHighlight {
  nodes?: NodeID[];
  edges?: [NodeID, NodeID][];
  orderTag?: NodeID[];
}

export interface Step {
  id: string;
  op: 'insert' | 'delete' | 'search' | 'traverse';
  index: number;
  action: StepAction;
  payload?: any;
  reason: string;
  invariantChecks: InvariantCheck[];
  codeLines?: number[];
  highlights?: StepHighlight;
  treeSnapshot: TreeState;
}

export interface InsertResult {
  steps: Step[];
  next: TreeState;
}

export interface SearchResult {
  steps: Step[];
  found: boolean;
}

export interface RemoveResult {
  steps: Step[];
  next: TreeState;
}

export type TraverseKind = 'in' | 'pre' | 'post' | 'level';

export type TraverseResultStepList = Step[];

export interface OperationHistoryEntry {
  opId: string;
  opType: 'insert' | 'delete' | 'search' | 'traverse';
  steps: Step[];
  preTreeSnapshot: TreeState;
  postTreeSnapshot: TreeState;
}

export interface VisualizerState {
  tree: TreeState;
  currentSteps: Step[];
  currentStepIndex: number;
  history: OperationHistoryEntry[];
  historyIndex: number;
  isPlaying: boolean;
  speed: number;
  stepMode: boolean;
  selectedNodeId?: NodeID;
  highContrast: boolean;
}

export type VisualizerAction =
  | {
      type: 'APPLY_OPERATION';
      payload: {
        entry: OperationHistoryEntry;
      };
    }
  | { type: 'STEP_NEXT' }
  | { type: 'STEP_PREV' }
  | { type: 'SET_STEP_INDEX'; payload: { index: number } }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_SPEED'; payload: { speed: number } }
  | { type: 'UNDO_OPERATION' }
  | { type: 'REDO_OPERATION' }
  | { type: 'RESET_TREE'; payload: { tree: TreeState } }
  | { type: 'SET_STEP_MODE'; payload: { stepMode: boolean } }
  | { type: 'SET_SELECTED_NODE'; payload: { nodeId?: NodeID } }
  | { type: 'SET_HIGH_CONTRAST'; payload: { highContrast: boolean } }
  | { type: 'SET_DUPLICATE_POLICY'; payload: { policy: TreeConfig['duplicatePolicy'] } };

export interface PseudocodeBlock {
  id: 'insert' | 'delete' | 'search' | 'traverse';
  title: string;
  lines: string[];
}
