import type { CanvasElement, MangaPage, PanelElement, StudioTemplate } from '../types/manga';

export const PAGE_WIDTH = 720;
export const PAGE_HEIGHT = 1020;

export function clampZoom(zoom: number): number {
  return Math.min(200, Math.max(25, Math.round(zoom)));
}

export function clampElementBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidth = PAGE_WIDTH,
  pageHeight = PAGE_HEIGHT
): { x: number; y: number; width: number; height: number } {
  const safeWidth = Math.max(48, Math.min(pageWidth, Math.round(width)));
  const safeHeight = Math.max(48, Math.min(pageHeight, Math.round(height)));
  const safeX = Math.max(-24, Math.min(pageWidth - 36, Math.round(x)));
  const safeY = Math.max(-24, Math.min(pageHeight - 36, Math.round(y)));
  return { x: safeX, y: safeY, width: safeWidth, height: safeHeight };
}

export function reorderLayers(
  elements: CanvasElement[],
  elementId: string,
  direction: 'up' | 'down' | 'front' | 'back'
): CanvasElement[] {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const index = sorted.findIndex((el) => el.id === elementId);
  if (index === -1) return elements;

  const [target] = sorted.splice(index, 1);
  if (direction === 'up') {
    sorted.splice(Math.min(sorted.length, index + 1), 0, target);
  } else if (direction === 'down') {
    sorted.splice(Math.max(0, index - 1), 0, target);
  } else if (direction === 'front') {
    sorted.push(target);
  } else {
    sorted.unshift(target);
  }

  return sorted.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
}

export function reorderPages(pages: MangaPage[], fromIndex: number, toIndex: number): MangaPage[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= pages.length ||
    toIndex >= pages.length ||
    fromIndex === toIndex
  ) {
    return pages;
  }
  const copy = [...pages];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy.map((page, idx) => ({ ...page, pageNumber: idx + 1 }));
}

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(initial: T): HistoryState<T> {
  return { past: [], present: initial, future: [] };
}

export function pushHistory<T>(state: HistoryState<T>, nextPresent: T, maxDepth = 30): HistoryState<T> {
  const nextPast = [...state.past, state.present].slice(-maxDepth);
  return {
    past: nextPast,
    present: nextPresent,
    future: [],
  };
}

export function undoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1];
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.future.length === 0) return state;
  const next = state.future[0];
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1),
  };
}

export function buildPanelsForPreset(
  presetKey: StudioTemplate['presetKey'],
  gutter: number,
  existingImages: string[] = []
): PanelElement[] {
  const margin = 32;
  const innerW = PAGE_WIDTH - margin * 2;
  const innerH = PAGE_HEIGHT - margin * 2;
  const g = Math.max(4, Math.min(32, gutter));

  const makePanel = (
    idx: number,
    x: number,
    y: number,
    width: number,
    height: number,
    screentone: PanelElement['screentone'] = 'none'
  ): PanelElement => ({
    id: `panel-${Date.now()}-${idx}`,
    type: 'panel',
    name: `Panel ${idx + 1}`,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    rotation: 0,
    visible: true,
    locked: false,
    zIndex: idx + 1,
    opacity: 100,
    borderWidth: 3,
    borderStyle: 'solid',
    cornerShape: 'sharp',
    backgroundColor: '#FFFFFF',
    screentone,
    imageUrl: existingImages[idx],
    imageBrightness: 100,
    imageContrast: 105,
    imageFlipX: false,
  });

  if (presetKey === 'splash-focus') {
    return [
      makePanel(0, margin, margin, innerW, innerH * 0.68 - g / 2, 'speedlines'),
      makePanel(1, margin, margin + innerH * 0.68 + g / 2, innerW * 0.48 - g / 2, innerH * 0.32 - g / 2, 'light'),
      makePanel(2, margin + innerW * 0.48 + g / 2, margin + innerH * 0.68 + g / 2, innerW * 0.52 - g / 2, innerH * 0.32 - g / 2),
    ];
  }

  if (presetKey === 'dynamic-action') {
    const row1H = innerH * 0.32;
    const row2H = innerH * 0.38;
    const row3H = innerH - row1H - row2H - g * 2;
    return [
      makePanel(0, margin, margin, innerW * 0.62 - g / 2, row1H),
      makePanel(1, margin + innerW * 0.62 + g / 2, margin, innerW * 0.38 - g / 2, row1H, 'dense'),
      makePanel(2, margin, margin + row1H + g, innerW, row2H, 'speedlines'),
      makePanel(3, margin, margin + row1H + row2H + g * 2, innerW * 0.45 - g / 2, row3H),
      makePanel(4, margin + innerW * 0.45 + g / 2, margin + row1H + row2H + g * 2, innerW * 0.55 - g / 2, row3H, 'light'),
    ];
  }

  if (presetKey === 'dialogue-strip') {
    const rowH = (innerH - g * 2) / 3;
    return [
      makePanel(0, margin, margin, innerW, rowH),
      makePanel(1, margin, margin + rowH + g, innerW * 0.5 - g / 2, rowH, 'light'),
      makePanel(2, margin + innerW * 0.5 + g / 2, margin + rowH + g, innerW * 0.5 - g / 2, rowH),
      makePanel(3, margin, margin + (rowH + g) * 2, innerW, rowH),
    ];
  }

  if (presetKey === 'cinematic-widescreen') {
    const rowH = (innerH - g * 2) / 3;
    return [
      makePanel(0, margin, margin, innerW, rowH),
      makePanel(1, margin, margin + rowH + g, innerW, rowH, 'light'),
      makePanel(2, margin, margin + (rowH + g) * 2, innerW, rowH),
    ];
  }

  // Default: four-panel-grid
  const colW = (innerW - g) / 2;
  const rowH = (innerH - g) / 2;
  return [
    makePanel(0, margin, margin, colW, rowH),
    makePanel(1, margin + colW + g, margin, colW, rowH, 'light'),
    makePanel(2, margin, margin + rowH + g, colW, rowH),
    makePanel(3, margin + colW + g, margin + rowH + g, colW, rowH),
  ];
}

export function isValidEmailAddress(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidSixDigitOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}

export interface PasswordStrengthResult {
  isStrong: boolean;
  score: number;
  label: 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export const STRONG_PASSWORD_REQUIREMENTS_TEXT =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9\s]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const isStrong = score === 5 && !/\s/.test(password);

  let label: PasswordStrengthResult['label'] = 'Empty';
  if (password.length > 0) {
    if (score <= 2) label = 'Weak';
    else if (score === 3) label = 'Fair';
    else if (score === 4) label = 'Good';
    else label = isStrong ? 'Strong' : 'Good';
  }

  return { isStrong, score, label, checks };
}

export function isStrongPassword(password: string): boolean {
  return evaluatePasswordStrength(password).isStrong;
}

export function formatExportEstimate(pageCount: number, resolution: '150 DPI' | '300 DPI' | '600 DPI', format: 'PDF' | 'PNG' | 'JPEG'): string {
  const baseMbPerPage = resolution === '600 DPI' ? 14.5 : resolution === '300 DPI' ? 4.8 : 1.4;
  const formatFactor = format === 'JPEG' ? 0.55 : format === 'PDF' ? 0.85 : 1.0;
  const totalMb = Math.max(0.5, pageCount * baseMbPerPage * formatFactor);
  return `${totalMb.toFixed(1)} MB`;
}
