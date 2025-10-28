import { useEffect } from 'react';

export interface Shortcut {
  key: string;
  handler: (event: KeyboardEvent) => void;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
}

const matchEvent = (event: KeyboardEvent, shortcut: Shortcut) =>
  event.key.toLowerCase() === shortcut.key.toLowerCase() &&
  (!!shortcut.ctrlKey === event.ctrlKey) &&
  (!!shortcut.metaKey === event.metaKey) &&
  (!!shortcut.altKey === event.altKey) &&
  (!!shortcut.shiftKey === event.shiftKey);

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const activeShortcuts = shortcuts.filter((shortcut) => shortcut.enabled !== false);
    if (!activeShortcuts.length) return;

    const onKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of activeShortcuts) {
        if (matchEvent(event, shortcut)) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
};
