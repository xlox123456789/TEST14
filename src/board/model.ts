export const SPECIES = ['mammoth', 'lion', 'wolf', 'rat'] as const;
export type Species = typeof SPECIES[number];
export const RARITIES = ['normal', 'magic', 'rare', 'legendary', 'supreme', 'rainbow'] as const;
export type Rarity = typeof RARITIES[number];
export const STATES = ['unknown', 'locked', 'empty', 'prisoner', 'event'] as const;
export type CellState = typeof STATES[number];
export const speciesNames: Record<Species, string> = { mammoth: '象', lion: '獅', wolf: '狼', rat: '鼠' };
export const rarityNames: Record<Rarity, string> = { normal: '普通', magic: '魔法', rare: '稀有', legendary: '傳奇', supreme: '至臻（暫定）', rainbow: '綺彩' };
export const stateNames: Record<CellState, string> = { unknown: '未知', locked: '封閉', empty: '空格', prisoner: '囚犯', event: '特殊事件' };
export interface Evidence { source: 'unknown' | 'manual' | 'synthetic' | 'image'; confidence: number | null; note: string }
export const evidence = (source: Evidence['source'] = 'unknown', note = ''): Evidence => ({ source, confidence: source === 'synthetic' ? 1 : null, note });
export interface Prisoner { species: Species | null; rarity: Rarity | null }
export interface Cell extends Prisoner {
  id: number; row: number; column: number; state: CellState; markers: string[] | null; event: string | null;
  evidence: Record<'state' | 'species' | 'rarity' | 'markers', Evidence>;
}
export interface Rect { x: number; y: number; width: number; height: number }
export interface Board {
  schemaVersion: 1; layout: 'preview-ring-6x4-v1'; cells: Cell[];
  warden: number | null; currentDay: number | null; daysRemaining: number | null;
  patrolOptions: number[] | null; tools: string[] | null; resources: Record<string, number | null> | null;
  collected: Prisoner[] | null; reviewedAt: string | null;
  evidence: Evidence; fieldEvidence: Record<string, Evidence>;
}
// Preview geometry, not a claim that the empty courtyard contains prison cells.
export const POSITIONS = [
  ...Array.from({ length: 6 }, (_, column) => ({ row: 0, column })),
  { row: 1, column: 5 }, { row: 2, column: 5 },
  ...Array.from({ length: 6 }, (_, index) => ({ row: 3, column: 5 - index })),
  { row: 2, column: 0 }, { row: 1, column: 0 },
];
export function createBoard(): Board {
  return { schemaVersion: 1, layout: 'preview-ring-6x4-v1',
    cells: POSITIONS.map((p, index) => ({ id: index + 1, ...p, state: 'unknown', species: null, rarity: null, markers: null, event: null,
      evidence: { state: evidence(), species: evidence(), rarity: evidence(), markers: evidence() } })),
    warden: null, currentDay: null, daysRemaining: null, patrolOptions: null, tools: null, resources: null, collected: null,
    reviewedAt: null, evidence: evidence(), fieldEvidence: {},
  };
}
export function updateCell(board: Board, id: number, patch: Partial<Pick<Cell, 'state' | 'species' | 'rarity' | 'markers' | 'event'>>): Board {
  return { ...board, reviewedAt: null, cells: board.cells.map(cell => {
    if (cell.id !== id) return cell;
    const next = { ...cell, ...patch, evidence: { ...cell.evidence } };
    for (const key of ['state', 'species', 'rarity', 'markers'] as const) if (key in patch) next.evidence[key] = evidence('manual', '使用者修正，非辨識信心');
    if (next.state !== 'prisoner') { next.species = null; next.rarity = null; next.evidence.species = evidence(); next.evidence.rarity = evidence(); }
    if (next.state !== 'event') next.event = null;
    return next;
  }) };
}
