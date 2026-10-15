import { createBoard, RARITIES, SPECIES, STATES, type Board, type Evidence, type Prisoner } from './model';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function object(value: unknown): Record<string, unknown> { assert(value !== null && typeof value === 'object' && !Array.isArray(value), '應為 JSON 物件'); return value as Record<string, unknown>; }
function integer(value: unknown, min: number, max: number): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max; }
function nullableNumber(value: unknown, min: number, max: number) { assert(value === null || integer(value, min, max), `數值須為 ${min}–${max} 的整數或 null`); }
function text(value: unknown): value is string { return typeof value === 'string' && value.length <= 200; }
function strings(value: unknown): value is string[] | null { return value === null || (Array.isArray(value) && value.length <= 100 && value.every(text)); }
function checkEvidence(value: unknown): Evidence {
  const e = object(value);
  assert(['unknown', 'manual', 'synthetic', 'image'].includes(e.source as string), '資料來源無效');
  assert(e.confidence === null || (typeof e.confidence === 'number' && Number.isFinite(e.confidence) && e.confidence >= 0 && e.confidence <= 1), '可信度須介於 0–1 或 null');
  assert(text(e.note), '來源說明過長');
  return { source: e.source as Evidence['source'], confidence: e.confidence as number | null, note: e.note };
}
function prisoner(value: unknown): Prisoner {
  const p = object(value);
  assert(p.species === null || SPECIES.includes(p.species as typeof SPECIES[number]), '野獸種類無效');
  assert(p.rarity === null || RARITIES.includes(p.rarity as typeof RARITIES[number]), '稀有度無效');
  return { species: p.species as Prisoner['species'], rarity: p.rarity as Prisoner['rarity'] };
}
export function parseBoardJSON(input: string): Board {
  assert(input.length <= 1_000_000, 'JSON 超過 1 MB，請縮小檔案');
  const data = object(JSON.parse(input));
  assert(data.schemaVersion === 1 && data.layout === 'preview-ring-6x4-v1', '不支援的盤面版本或布局');
  const board = createBoard();
  assert(Array.isArray(data.cells) && data.cells.length === 16, '盤面必須包含 16 個不重複位置');
  const cells = data.cells.map(object);
  assert(new Set(cells.map(c => c.id)).size === 16, '格子 ID 重複');
  board.cells = board.cells.map(expected => {
    const cell = cells.find(c => c.id === expected.id);
    assert(cell && cell.row === expected.row && cell.column === expected.column, '格子 ID 或座標不符合外圈布局');
    assert(STATES.includes(cell.state as typeof STATES[number]), '格子狀態無效');
    const p = prisoner(cell);
    assert(cell.state === 'prisoner' || (p.species === null && p.rarity === null), '非囚犯格不可包含囚犯資料');
    assert(strings(cell.markers), '標記格式無效');
    assert(cell.event === null || (cell.state === 'event' && text(cell.event)), '事件格式無效');
    const e = object(cell.evidence);
    return { ...expected, ...p, state: cell.state as typeof STATES[number], markers: cell.markers, event: cell.event as string | null,
      evidence: { state: checkEvidence(e.state), species: checkEvidence(e.species), rarity: checkEvidence(e.rarity), markers: checkEvidence(e.markers) } };
  });
  nullableNumber(data.warden, 1, 16); nullableNumber(data.currentDay, 1, 999); nullableNumber(data.daysRemaining, 0, 999);
  assert(data.patrolOptions === null || (Array.isArray(data.patrolOptions) && data.patrolOptions.length <= 16 && data.patrolOptions.every(id => integer(id, 1, 16)) && new Set(data.patrolOptions).size === data.patrolOptions.length), '巡視位置須為不重複的 1–16 或 null');
  assert(strings(data.tools), '刑具格式無效');
  if (data.resources !== null) {
    const r = object(data.resources);
    assert(Object.keys(r).length <= 50 && Object.keys(r).every(k => k.length > 0 && k.length <= 60 && !['__proto__', 'constructor', 'prototype'].includes(k)), '資源名稱無效');
    Object.values(r).forEach(v => nullableNumber(v, 0, 1_000_000_000));
  }
  assert(data.collected === null || (Array.isArray(data.collected) && data.collected.length <= 100), '已收容囚犯格式無效');
  const fields = object(data.fieldEvidence);
  assert(Object.keys(fields).length <= 30 && Object.keys(fields).every(k => ['warden', 'currentDay', 'daysRemaining', 'patrolOptions', 'tools', 'resources', 'collected'].includes(k)), '欄位來源名稱無效');
  return { ...board, warden: data.warden as number | null, currentDay: data.currentDay as number | null, daysRemaining: data.daysRemaining as number | null,
    patrolOptions: data.patrolOptions as number[] | null, tools: data.tools, resources: data.resources as Board['resources'],
    collected: data.collected === null ? null : (data.collected as unknown[]).map(prisoner), evidence: checkEvidence(data.evidence),
    fieldEvidence: Object.fromEntries(Object.entries(fields).map(([key, val]) => [key, checkEvidence(val)])), reviewedAt: null };
}
export function exportBoardJSON(board: Board): string { return JSON.stringify(board, null, 2); }
