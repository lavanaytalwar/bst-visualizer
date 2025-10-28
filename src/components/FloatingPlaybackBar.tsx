import React from 'react';
import { useVisualizerStore } from '../state/visualizerStore';

export const FloatingPlaybackBar: React.FC = () => {
  const {
    state: { isPlaying, currentSteps, currentStepIndex, historyIndex, history, speed },
    dispatch,
  } = useVisualizerStore();

  const hasSteps = currentSteps.length > 0;

  return (
    <div className="floatingPlayback" role="region" aria-label="Playback controls">
      <div className="floatingSection floatingSection--left">
        <button
          type="button"
          className="ghostButton"
          aria-label="Undo operation"
          onClick={() => dispatch({ type: 'UNDO_OPERATION' })}
          disabled={historyIndex < 0}
        >
          Undo
        </button>
        <button
          type="button"
          className="ghostButton"
          aria-label="Redo operation"
          onClick={() => dispatch({ type: 'REDO_OPERATION' })}
          disabled={historyIndex + 1 >= history.length}
        >
          Redo
        </button>
      </div>
      <div className="floatingSection floatingSection--center">
        <button
          type="button"
          className="iconButton ghostButton"
          aria-label="Step backward"
          onClick={() => dispatch({ type: 'STEP_PREV' })}
          disabled={!hasSteps}
        >
          ←
        </button>
        <button
          type="button"
          className="primaryButton floatingPlayButton"
          onClick={() => dispatch({ type: isPlaying ? 'PAUSE' : 'PLAY' })}
          disabled={!hasSteps}
          aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="iconButton ghostButton"
          aria-label="Step forward"
          onClick={() => dispatch({ type: 'STEP_NEXT' })}
          disabled={!hasSteps}
        >
          →
        </button>
      </div>
      <div className="floatingSection floatingSection--right">
        <label className="visually-hidden" htmlFor="floating-scrubber">
          Timeline scrubber
        </label>
        <input
          id="floating-scrubber"
          type="range"
          min={0}
          max={Math.max(currentSteps.length - 1, 0)}
          value={currentStepIndex}
          onChange={(event) => dispatch({ type: 'SET_STEP_INDEX', payload: { index: Number(event.target.value) } })}
          disabled={!hasSteps}
          aria-label="Timeline scrubber"
        />
        <span className="stepLabel smallLabel">
          {hasSteps ? `Step ${currentStepIndex + 1}/${currentSteps.length}` : 'Ready'}
        </span>
        <label className="visually-hidden" htmlFor="floating-speed-select">
          Animation speed
        </label>
        <select
          id="floating-speed-select"
          value={speed}
          onChange={(event) => dispatch({ type: 'SET_SPEED', payload: { speed: Number(event.target.value) } })}
          aria-label="Animation speed"
        >
          {[0.25, 0.5, 1, 1.5, 2, 3].map((option) => (
            <option key={option} value={option}>
              {option}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
