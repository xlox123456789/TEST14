import { describe, expect, it } from 'vitest';
import { createBoard, updateCell } from '../board/model';
import { exportBoardJSON, parseBoardJSON } from '../board/json';
import { possibleActions } from '../board/rules';

describe('board model and JSON boundary', () => {
  it('uses a hollow clockwise ring and leaves unobserved fields unknown', () => {
    const b = createBoard();
    expect(b.cells).toHaveLength(16); expect(b.cells[0]).toMatchObject({ id: 1, row: 0, column: 0 });
    expect(b.cells[6]).toMatchObject({ row: 1, column: 5 });
    expect(b.cells.every(c => c.row === 0 || c.row === 3 || c.column === 0 || c.column === 5)).toBe(true);
    expect(b.warden).toBeNull(); expect(b.patrolOptions).toBeNull(); expect(b.cells.every(c => c.state === 'unknown')).toBe(true);
  });
  it('manual edits clear stale prisoner data and invalidate confirmation', () => {
    let b = updateCell(createBoard(), 2, { state: 'prisoner', species: 'lion', rarity: 'rare' }); b.reviewedAt = 'reviewed';
    b = updateCell(b, 2, { state: 'locked' });
    expect(b.reviewedAt).toBeNull(); expect(b.cells[1].species).toBeNull(); expect(b.cells[1].rarity).toBeNull();
    expect(b.cells[1].evidence.state).toMatchObject({ source: 'manual', confidence: null });
  });
  it('round trips structured state, preserves zero and empty versus unknown, requires re-review', () => {
    const b = createBoard(); b.daysRemaining = 0; b.tools = []; b.patrolOptions = []; b.resources = { refreshes: 0 }; b.collected = [{ species: null, rarity: 'rainbow' }];
    b.reviewedAt = '2026-10-15T00:00:00.000Z';
    expect(parseBoardJSON(exportBoardJSON(b))).toEqual({ ...b, reviewedAt: null });
    expect(exportBoardJSON(b)).not.toContain('blob:');
  });
  it.each([
    ['duplicate IDs', (b: ReturnType<typeof createBoard>) => { b.cells[1].id = 1; }],
    ['invalid coordinate', (b: ReturnType<typeof createBoard>) => { b.cells[1].column = 99; }],
    ['invalid warden', (b: ReturnType<typeof createBoard>) => { b.warden = 17; }],
    ['invalid patrol', (b: ReturnType<typeof createBoard>) => { b.patrolOptions = [2, 2]; }],
    ['invalid confidence', (b: ReturnType<typeof createBoard>) => { b.cells[0].evidence.state.confidence = 2; }],
    ['invalid enum', (b: ReturnType<typeof createBoard>) => { b.cells[0].state = 'invented' as typeof b.cells[0]['state']; }],
    ['inconsistent occupant', (b: ReturnType<typeof createBoard>) => { b.cells[0].species = 'rat'; }],
  ])('rejects %s', (_, mutate) => { const b = createBoard(); mutate(b); expect(() => parseBoardJSON(JSON.stringify(b))).toThrow(); });
  it('rejects malformed, oversized and unsupported input without applying partial fields', () => {
    expect(() => parseBoardJSON('{')).toThrow(); expect(() => parseBoardJSON(' '.repeat(1_000_001))).toThrow();
    expect(() => parseBoardJSON(JSON.stringify({ ...createBoard(), schemaVersion: 2 }))).toThrow();
    expect(() => parseBoardJSON(JSON.stringify({ ...createBoard(), resources: JSON.parse('{"__proto__":5}') }))).toThrow();
  });
});
describe('conservative and experimental rules', () => {
  function scene() { let b = createBoard(); b.tools = []; b.cells.forEach(c => { c.markers = []; }); b = updateCell(b, 2, { state: 'prisoner', species: 'mammoth', rarity: 'rare' }); b = updateCell(b, 3, { state: 'prisoner', species: 'lion', rarity: 'rare' }); b = updateCell(b, 4, { state: 'prisoner', species: 'wolf', rarity: 'rare' }); b.warden = 2; b.patrolOptions = [5, 7]; b.reviewedAt = 'reviewed'; return b; }
  it('never recommends operations before review or claims an optimal move', () => { const result = possibleActions(createBoard(), 'experimental-single'); expect(result.candidates).toEqual([]); expect(result.optimal).toBe(false); });
  it('default mode only repeats observed patrol choices, no assumed devour', () => { const result = possibleActions(scene()); expect(result.candidates.map(c => c.target)).toEqual([5, 7]); expect(result.candidates.every(c => c.kind === 'patrol')).toBe(true); });
  it('keeps conflicting food chains opt-in and differentiates their results', () => {
    expect(possibleActions(scene(), 'experimental-single').candidates.filter(c => c.kind === 'devour').map(c => c.target)).toEqual([3]);
    expect(possibleActions(scene(), 'experimental-two').candidates.filter(c => c.kind === 'devour').map(c => c.target)).toEqual([3, 4]);
  });
  it('rejects mismatch rarity, unknown species and modifiers in experimental checks', () => {
    const b = scene(); b.cells[2].rarity = 'magic'; b.cells[3].species = null;
    expect(possibleActions(b, 'experimental-two').candidates.filter(c => c.kind === 'devour')).toEqual([]);
    b.tools = ['unknown tool']; expect(possibleActions(b, 'experimental-two').blockedBy.join()).toContain('無刑具');
  });
});
