import React from 'react';
import { useVisualizerStore } from '../state/visualizerStore';
import styles from './TimelineBar.module.css';

const speedOptions = [0.25, 0.5, 1, 1.5, 2, 3];

export const TimelineBar: React.FC = () => {
  const {
    state: { currentSteps, currentStepIndex, isPlaying, historyIndex, history, speed },
    dispatch,
  } = useVisualizerStore();

  const hasSteps = currentSteps.length > 0;
  const totalSteps = currentSteps.length;
  const maxIndex = Math.max(totalSteps - 1, 0);

  const togglePlay = () => dispatch({ type: isPlaying ? 'PAUSE' : 'PLAY' });
  const stepPrev = () => dispatch({ type: 'STEP_PREV' });
  const stepNext = () => dispatch({ type: 'STEP_NEXT' });
  const undo = () => dispatch({ type: 'UNDO_OPERATION' });
  const redo = () => dispatch({ type: 'REDO_OPERATION' });
  const updateIndex = (index: number) => dispatch({ type: 'SET_STEP_INDEX', payload: { index } });
  const updateSpeed = (value: number) => dispatch({ type: 'SET_SPEED', payload: { speed: value } });

  return (
    <div className={styles.timeline}>
      <div className={`${styles.cluster} ${styles.transport}`} aria-label="Transport controls">
        <button
          type="button"
          className={`${styles.iconButton} focusRing`}
          onClick={undo}
          aria-label="Undo operation"
          disabled={historyIndex < 0}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 5a7 7 0 1 1-7 7H3l3.5-3.5L10 12H7a5 5 0 1 0 5-5V5Z" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.iconButton} focusRing`}
          onClick={stepPrev}
          aria-label="Step backward"
          disabled={!hasSteps}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M15 6v12l-8-6 8-6Zm-8 0h2v12H7V6Z" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.primaryPlay} focusRing`}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
          disabled={!hasSteps}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M7 6h4v12H7zm6 0h4v12h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m8 5 10 7-10 7V5Z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className={`${styles.iconButton} focusRing`}
          onClick={stepNext}
          aria-label="Step forward"
          disabled={!hasSteps}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m9 6 8 6-8 6V6Zm8 0h-2v12h2V6Z" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.iconButton} focusRing`}
          onClick={redo}
          aria-label="Redo operation"
          disabled={historyIndex + 1 >= history.length}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 5v2a5 5 0 1 1-5 5H5l3.5-3.5L12 12H9a3 3 0 1 0 3-3V5Z" />
          </svg>
        </button>
      </div>

      <div className={styles.sliderGroup}>
        <input
          className={`${styles.slider} focusRing`}
          type="range"
          min={0}
          max={maxIndex}
          value={hasSteps ? currentStepIndex : 0}
          onChange={(event) => updateIndex(Number(event.target.value))}
          disabled={!hasSteps}
          aria-label="Timeline scrubber"
        />
        <span>{hasSteps ? `Step ${currentStepIndex + 1} / ${totalSteps}` : 'Ready'}</span>
      </div>

      <div className={styles.cluster}>
        <label className="visually-hidden" htmlFor="timeline-speed">
          Playback speed
        </label>
        <select
          id="timeline-speed"
          className={`focusRing ${styles.speedSelect}`}
          value={speed}
          onChange={(event) => updateSpeed(Number(event.target.value))}
        >
          {speedOptions.map((option) => (
            <option key={option} value={option}>
              {option}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
