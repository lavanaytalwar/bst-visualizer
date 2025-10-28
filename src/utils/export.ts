import { OperationHistoryEntry, TreeState } from '../types';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const exportSessionJson = (tree: TreeState, history: OperationHistoryEntry[]) => {
  const payload = {
    tree,
    history,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'bst-visualizer-session.json');
};

export const exportSvgToPng = (svgElement: SVGSVGElement | null) => {
  if (!svgElement) {
    console.warn('exportSvgToPng called without an SVG element reference.');
    return;
  }
  console.warn('exportSvgToPng is a TODO: implement SVG-to-canvas conversion for PNG export.');
};
