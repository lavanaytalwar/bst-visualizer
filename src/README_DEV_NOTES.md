## Architecture Overview

- **Engine (src/engine/)**: Pure, deterministic BST algorithms (insert, search, delete, traverse). Each function clones input state, never mutates arguments, and emits a `steps[]` timeline annotated with reasons, pseudocode line refs, highlights, and invariant checks.
- **State (src/state/visualizerStore.tsx)**: React Context + `useReducer` store. Holds the authoritative tree, playback state, operation history, UI toggles, and the currently selected node. A requestAnimationFrame loop advances steps when `isPlaying === true`, respecting the `speed` multiplier and auto-pausing for `stepMode`.
- **Components**:
  - `ControlsPanel`: Operation triggers, import/export, settings, batch builder. Dispatches engine results into history entries.
  - `TreeViewport`: Pure SVG renderer with pan/zoom, focusable nodes, highlight rendering, and order tags from traversal steps.
  - `ExplainPanel`, `PseudocodePanel`, `InspectorPanel`: Right-rail explainers that sync to the active step.
  - `TimelineBar`: Playback, undo/redo, scrubber, and speed selector.
- **Utilities**:
  - `layout/computeLayout.ts`: Basic tidy layout via in-order spacing to keep node positions stable.
  - `utils/metrics.ts`: Depth, height, size, predecessor, successor calculations for the inspector.
  - `utils/export.ts`: Session JSON download + PNG export stub.
  - `utils/keyboard.ts`: Declarative keyboard shortcut hook.

## Step Replay Model

1. User action calls a pure engine function with the current `TreeState`.
2. Engine returns `{ steps, next }` (or equivalent) without touching the input tree.
3. Reducer receives `APPLY_OPERATION`, pushes an `OperationHistoryEntry` with pre/post snapshots, loads `currentSteps`, resets the index, and pauses playback.
4. Playback uses rAF to advance steps; undo/redo swaps whole-tree snapshots for deterministic rewinds.

## Why Pure Functions?

Pure BST operations mean:

- Deterministic timelines: every replay shows the exact same reasoning and highlights.
- Easy undo/redo: snapshots are just tree objects, no side effects to roll back.
- Testability: each algorithm can be unit-tested independently of React.

## Explain-Why ↔ Pseudocode Mapping

Each `Step.codeLines` array indexes into the hard-coded pseudocode blocks in `PseudocodePanel`. When you add new algorithm variants, extend both the engine’s `codeLines` assignments and the pseudocode text to keep the highlighting accurate.

## Extension Ideas

- **Challenge mode**: Pause before key steps and prompt the learner to predict the action.
- **Timeline exports**: Generate GIF/MP4 animations by piping the SVG frames into a worker-based encoder.
- **Performance scaling**: Move the engine + layout work into a Web Worker; add a Canvas renderer for 600+ nodes.
- **Testing**: Wire up Vitest or Playwright suites once we formalize regression criteria.

## Guiding Principles

- Determinism beats micro-optimizations; clarity and reproducibility are paramount.
- The visual narrative must explain *why* each move maintains BST invariants.
- Accessibility stays first-class: keyboard parity, live narration, and high-contrast options are core features, not extras.
