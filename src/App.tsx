import React, { useCallback, useMemo, useRef, useState } from 'react';
import { VisualizerProvider, useVisualizerStore } from './state/visualizerStore';
import { ControlsPanel } from './components/ControlsPanel';
import { TreeViewport } from './components/TreeViewport';
import { PseudocodeDialog } from './components/PseudocodePanel';
import { TimelineBar } from './components/TimelineBar';
import { useKeyboardShortcuts } from './utils/keyboard';
import { FloatingPlaybackBar } from './components/FloatingPlaybackBar';
import { RightColumn } from './components/RightColumn';

const MainApp: React.FC = () => {
  const {
    state: { highContrast, isPlaying },
    dispatch,
  } = useVisualizerStore();
  const [centerSignal, setCenterSignal] = useState(0);
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
  const [isPseudocodeOpen, setPseudocodeOpen] = useState(false);

  const insertRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const deleteRef = useRef<HTMLInputElement>(null);

  const keyboardTargets = useMemo(() => ['INPUT', 'TEXTAREA', 'SELECT'], []);

  useKeyboardShortcuts([
    {
      key: 'i',
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (keyboardTargets.includes(target.tagName)) return;
        insertRef.current?.focus();
      },
      preventDefault: true,
    },
    {
      key: 's',
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (keyboardTargets.includes(target.tagName)) return;
        searchRef.current?.focus();
      },
      preventDefault: true,
    },
    {
      key: 'd',
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (keyboardTargets.includes(target.tagName)) return;
        deleteRef.current?.focus();
      },
      preventDefault: true,
    },
    {
      key: ' ',
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (keyboardTargets.includes(target.tagName)) return;
        event.preventDefault();
        dispatch({ type: isPlaying ? 'PAUSE' : 'PLAY' });
      },
      preventDefault: true,
    },
    {
      key: 'ArrowLeft',
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (keyboardTargets.includes(target.tagName)) return;
        event.preventDefault();
        dispatch({ type: 'STEP_PREV' });
      },
      preventDefault: true,
    },
    {
      key: 'ArrowRight',
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (keyboardTargets.includes(target.tagName)) return;
        event.preventDefault();
        dispatch({ type: 'STEP_NEXT' });
      },
      preventDefault: true,
    },
  ]);

  const handleCenterView = () => setCenterSignal((value) => value + 1);
  const handleSvgReady = useCallback((svg: SVGSVGElement | null) => setSvgElement(svg), []);

  return (
    <div className="appShell" data-high-contrast={highContrast}>
      <header className="appHeader">
        <div>
          <h1>BST Visualizer Studio</h1>
          <p>Build intuition for binary search trees with cinematic, step-by-step animations.</p>
        </div>
        <div className="headerActions">
          <button type="button" className="ghostButton" onClick={handleCenterView}>
            Center View
          </button>
        </div>
      </header>
      <main className="appGrid">
        <aside className="appGridControls" aria-label="Controls">
          <ControlsPanel
            svgElement={svgElement}
            onCenterView={handleCenterView}
            insertInputRef={insertRef}
            searchInputRef={searchRef}
            deleteInputRef={deleteRef}
          />
        </aside>
        <section className="appGridViewport" aria-label="Tree viewport">
          <TreeViewport centerSignal={centerSignal} onSvgReady={handleSvgReady} />
          <FloatingPlaybackBar />
        </section>
        <aside className="appGridRight" aria-label="Explain and inspector">
          <RightColumn onOpenPseudocode={() => setPseudocodeOpen(true)} />
        </aside>
        <div className="appGridTimeline" aria-label="Timeline controls">
          <TimelineBar />
        </div>
      </main>
      <PseudocodeDialog open={isPseudocodeOpen} onClose={() => setPseudocodeOpen(false)} />
    </div>
  );
};

const App: React.FC = () => (
  <VisualizerProvider>
    <MainApp />
  </VisualizerProvider>
);

export default App;
