import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPanelsForPreset,
  clampElementBounds,
  clampZoom,
  createHistory,
  evaluatePasswordStrength,
  formatExportEstimate,
  isStrongPassword,
  isValidEmailAddress,
  isValidSixDigitOtp,
  pushHistory,
  redoHistory,
  reorderLayers,
  reorderPages,
  undoHistory,
} from './editorLogic';
import type { MangaPage, TextElement } from '../types/manga';

test('clampZoom keeps studio zoom between 25 and 200', () => {
  assert.equal(clampZoom(10), 25);
  assert.equal(clampZoom(280), 200);
  assert.equal(clampZoom(124.6), 125);
});

test('clampElementBounds enforces minimum dimensions and canvas bounds', () => {
  const clamped = clampElementBounds(-100, 1500, 10, 20);
  assert.equal(clamped.width, 48);
  assert.equal(clamped.height, 48);
  assert.equal(clamped.x, -24);
  assert.equal(clamped.y, 1020 - 36);
});

test('history stack supports push, undo, redo, and clears future on new push', () => {
  const s0 = createHistory(1);
  const s1 = pushHistory(s0, 2);
  const s2 = pushHistory(s1, 3);
  assert.equal(s2.present, 3);

  const u1 = undoHistory(s2);
  assert.equal(u1.present, 2);
  const u2 = undoHistory(u1);
  assert.equal(u2.present, 1);
  assert.equal(undoHistory(u2).present, 1);

  const r1 = redoHistory(u2);
  assert.equal(r1.present, 2);

  const branched = pushHistory(r1, 99);
  assert.equal(branched.present, 99);
  assert.equal(branched.future.length, 0);
});

test('reorderLayers updates zIndex monotonically', () => {
  const makeText = (id: string, zIndex: number): TextElement => ({
    id,
    type: 'text',
    name: id,
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    rotation: 0,
    visible: true,
    locked: false,
    zIndex,
    opacity: 100,
    text: id,
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'left',
    letterSpacing: 0,
    color: '#171717',
    effect: 'none',
  });

  const layers = [makeText('a', 1), makeText('b', 2), makeText('c', 3)];
  const movedFront = reorderLayers(layers, 'a', 'front');
  assert.deepEqual(
    movedFront.sort((x, y) => x.zIndex - y.zIndex).map((x) => x.id),
    ['b', 'c', 'a']
  );

  const movedDown = reorderLayers(movedFront, 'c', 'down');
  assert.deepEqual(
    movedDown.sort((x, y) => x.zIndex - y.zIndex).map((x) => x.id),
    ['c', 'b', 'a']
  );
});

test('reorderPages renumbers pageNumber sequentially', () => {
  const pages: MangaPage[] = [
    { id: 'p1', pageNumber: 1, chapterId: 'c1', title: 'Page 1', gutterSize: 12, backgroundColor: '#FFF', elements: [] },
    { id: 'p2', pageNumber: 2, chapterId: 'c1', title: 'Page 2', gutterSize: 12, backgroundColor: '#FFF', elements: [] },
    { id: 'p3', pageNumber: 3, chapterId: 'c1', title: 'Page 3', gutterSize: 12, backgroundColor: '#FFF', elements: [] },
  ];
  const reordered = reorderPages(pages, 2, 0);
  assert.deepEqual(
    reordered.map((p) => ({ id: p.id, num: p.pageNumber })),
    [
      { id: 'p3', num: 1 },
      { id: 'p1', num: 2 },
      { id: 'p2', num: 3 },
    ]
  );
});

test('buildPanelsForPreset returns expected panel counts and preserves bounds', () => {
  const actionPanels = buildPanelsForPreset('dynamic-action', 12);
  assert.equal(actionPanels.length, 5);
  assert.ok(actionPanels.every((p) => p.width > 0 && p.height > 0));

  const gridPanels = buildPanelsForPreset('four-panel-grid', 16);
  assert.equal(gridPanels.length, 4);
});

test('email, OTP, and export size validation behave deterministically', () => {
  assert.equal(isValidEmailAddress('creator@mangaforge.jp'), true);
  assert.equal(isValidEmailAddress('bad-email'), false);
  assert.equal(isValidSixDigitOtp('123456'), true);
  assert.equal(isValidSixDigitOtp('12a456'), false);
  assert.equal(formatExportEstimate(4, '300 DPI', 'PDF'), '16.3 MB');
});

test('strong password validation enforces length, upper, lower, digit, special char, and no spaces', () => {
  assert.equal(isStrongPassword('short1!'), false);
  assert.equal(isStrongPassword('lowercase1!'), false);
  assert.equal(isStrongPassword('UPPERCASE1!'), false);
  assert.equal(isStrongPassword('NoDigitsHere!'), false);
  assert.equal(isStrongPassword('NoSpecial123'), false);
  assert.equal(isStrongPassword('Has Space1!'), false);
  assert.equal(isStrongPassword('Manga#2026'), true);

  const partial = evaluatePasswordStrength('Manga2026');
  assert.equal(partial.isStrong, false);
  assert.equal(partial.score, 4);
  assert.equal(partial.label, 'Good');
  assert.equal(partial.checks.hasSpecial, false);

  const strong = evaluatePasswordStrength('Studio@Ink99');
  assert.equal(strong.isStrong, true);
  assert.equal(strong.score, 5);
  assert.equal(strong.label, 'Strong');
});
