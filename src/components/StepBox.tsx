import React from 'react';
import { Step } from '../types';
import styles from './StepBox.module.css';

interface StepBoxProps {
  step: Step;
  isActive?: boolean;
  isCurrent?: boolean;
  onClick?: () => void;
}

export const StepBox: React.FC<StepBoxProps> = ({ 
  step, 
  isActive = false, 
  isCurrent = false, 
  onClick 
}) => {
  const boxClasses = [
    styles.stepBox,
    'focusRing',
    isActive ? styles.stepBoxActive : '',
    isCurrent ? styles.stepBoxCurrent : ''
  ].filter(Boolean).join(' ');

  const formatCodeLines = (codeLines?: number[]) => {
    if (!codeLines || codeLines.length === 0) return null;
    return codeLines.length === 1
      ? `Line ${codeLines[0]}`
      : `Lines ${codeLines.join(', ')}`;
  };

  if (isCurrent) {
    return (
      <div className={boxClasses}>
        <div className={styles.stepHeader}>
          <div className={styles.stepAction}>
            <strong>{step.action}</strong>
            <div className={styles.stepMeta}>
              {step.op && <span>{step.op.toUpperCase()}</span>}
              {formatCodeLines(step.codeLines) && (
                <span>{formatCodeLines(step.codeLines)}</span>
              )}
            </div>
          </div>
        </div>
        <p className={styles.stepDescription}>{step.reason}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={boxClasses}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <div className={styles.stepAction}>
        <strong>{step.action}</strong>
        {formatCodeLines(step.codeLines) && (
          <span>{formatCodeLines(step.codeLines)}</span>
        )}
      </div>
      <p className={styles.stepDescription}>{step.reason}</p>
    </button>
  );
};
