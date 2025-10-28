import React, { useEffect, useMemo } from 'react';
import { useCurrentStep } from '../state/visualizerStore';
import { PSEUDOCODE, blockForStep } from '../data/pseudocode';

interface PseudocodeDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PseudocodeDialog: React.FC<PseudocodeDialogProps> = ({ open, onClose }) => {
  if (!open) return null;

  const step = useCurrentStep();
  const activeBlockId = blockForStep(step?.op);
  const highlightLines = useMemo(() => new Set(step?.codeLines ?? []), [step?.codeLines]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="modalBackdrop" role="presentation" onClick={onClose} />
      <div className="modalCard" role="dialog" aria-modal="true" aria-label="Pseudocode">
        <header className="modalHeader">
          <div>
            <h2>Pseudocode Reference</h2>
            <p>Trace the algorithms that power each animation step.</p>
          </div>
          <button type="button" className="ghostButton" onClick={onClose} aria-label="Close pseudocode dialog">
            Close
          </button>
        </header>
        <div className="modalBody">
          {PSEUDOCODE.map((block) => {
            const active = block.id === activeBlockId;
            return (
              <div key={block.id} className={`codeBlock${active ? ' active' : ''}`}>
                <div className="codeBlockHeader">{block.title}</div>
                <pre>
                  {block.lines.map((line) => {
                    const lineNumber = parseInt(line.split(' ')[0], 10);
                    const isActive = active && highlightLines.has(lineNumber);
                    return (
                      <div key={`${block.id}-${lineNumber}`} className={isActive ? 'codeLine active' : 'codeLine'}>
                        {line}
                      </div>
                    );
                  })}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
