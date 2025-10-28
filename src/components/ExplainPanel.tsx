import React from 'react';
import { useVisualizerStore, useCurrentStep } from '../state/visualizerStore';

export const ExplainPanel: React.FC = () => {
  const {
    state: { currentSteps, currentStepIndex },
    dispatch,
  } = useVisualizerStore();
  const step = useCurrentStep();

  if (!currentSteps.length) {
    return (
      <div className="panelCard infoCard">
        <header className="panelCardHeader">
          <h2>Explain-Why</h2>
        </header>
        <p className="emptyState">No operation selected yet. Queue an action to unlock the live narration.</p>
      </div>
    );
  }

  return (
    <div className="panelCard infoCard">
      <header className="panelCardHeader">
        <h2>Explain-Why</h2>
        <span className="badge">Step {currentStepIndex + 1} / {currentSteps.length}</span>
      </header>
      <div className="callout">
        <div className="calloutTitle">{step?.action}</div>
        <p>{step?.reason}</p>
      </div>
      <div className="invariantList">
        <span className="sectionLabel">Invariant checks</span>
        <ul>
          {(step?.invariantChecks ?? []).map((check) => (
            <li key={check.name}>
              <span className={`statusDot ${check.passed ? 'ok' : 'warn'}`} aria-hidden />
              {check.name}
              {check.detail ? ` — ${check.detail}` : ''}
            </li>
          ))}
        </ul>
      </div>
      <ul className="explainList" role="listbox" aria-label="Explain why steps">
        {currentSteps.map((item, index) => {
          const active = index === currentStepIndex;
          return (
            <li
              key={item.id}
              className={`explainItem${active ? ' active' : ''}`}
              onClick={() => dispatch({ type: 'SET_STEP_INDEX', payload: { index } })}
              role="option"
              aria-selected={active}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  dispatch({ type: 'SET_STEP_INDEX', payload: { index } });
                }
              }}
            >
              <div className="explainItemHeader">
                <strong>{item.action}</strong>
                {item.codeLines && <span>Lines {item.codeLines.join(', ')}</span>}
              </div>
              <p>{item.reason}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
