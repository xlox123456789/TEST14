import type { Board, Rect } from '../board/model';
import { parseBoardJSON } from '../board/json';
export type Validation = 'verified' | 'provisional' | 'unknown';
export interface LabeledFrame { id: string; timeSeconds: number; profile: 'game' | 'synthetic'; imagePng: string; board: Board; recognizedBoard: Board | null; region: Rect | null }
export interface Operation { id: string; before: LabeledFrame; after: LabeledFrame; action: string; validation: Validation; evidence: 'user-annotation'; note: string }
export function boardDiff(before: Board, after: Board) {
  const fields = ['state', 'species', 'rarity', 'markers', 'event'] as const;
  return { cells: before.cells.flatMap(cell => { const next = after.cells.find(c => c.id === cell.id)!; const changes = fields.filter(key => JSON.stringify(cell[key]) !== JSON.stringify(next[key])).map(key => ({ field: key, before: cell[key], after: next[key] })); return changes.length ? [{ id: cell.id, changes }] : []; }),
    globals: (['warden', 'currentDay', 'daysRemaining', 'patrolOptions', 'tools', 'resources', 'collected'] as const).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(key => ({ field: key, before: before[key], after: after[key] })) };
}
export function recognitionScore(actual: Board, expected: Board) {
  const errors: { cell: number; field: string; actual: unknown; expected: unknown }[] = []; let total = 0, correct = 0, covered = 0;
  for (const truth of expected.cells) {
    const cell = actual.cells.find(c => c.id === truth.id)!;
    for (const key of ['state', 'species', 'rarity'] as const) {
      if ((key === 'state' && truth.state === 'unknown') || (key !== 'state' && (truth.state !== 'prisoner' || truth[key] === null))) continue;
      total++; if (cell[key] !== null && cell[key] !== 'unknown') covered++;
      if (cell[key] === truth[key]) correct++; else errors.push({ cell: truth.id, field: key, actual: cell[key], expected: truth[key] });
    }
  }
  return { total, correct, covered, accuracy: total ? correct / total : null, coverage: total ? covered / total : null, errors };
}
export function exportDataset(frames: LabeledFrame[], operations: Operation[]) { return JSON.stringify({ schemaVersion: 1, kind: 'test14-video-dataset', frames, operations: operations.map(op => ({ ...op, diff: boardDiff(op.before.board, op.after.board) })) }, null, 2); }
export function parseDataset(text: string): { frames: LabeledFrame[]; operations: Operation[] } {
  if (text.length > 25_000_000) throw new Error('資料集超過25 MB');
  const data = JSON.parse(text);
  if (data.schemaVersion !== 1 || data.kind !== 'test14-video-dataset' || !Array.isArray(data.frames) || data.frames.length > 50 || !Array.isArray(data.operations) || data.operations.length > 50) throw new Error('資料集格式不符或超過50筆');
  const frame = (v: LabeledFrame): LabeledFrame => {
    if (!v || !['game','synthetic'].includes(v.profile) || typeof v.id !== 'string' || v.id.length > 100 || !Number.isFinite(v.timeSeconds) || v.timeSeconds < 0 || typeof v.imagePng !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v.imagePng) || v.imagePng.length > 4_000_000) throw new Error('影格資料無效或圖片超過4 MB');
    const r = v.region;
    if (r !== null && (!r || !['x','y','width','height'].every(key => Number.isFinite(r[key as keyof Rect])) || r.x < 0 || r.y < 0 || r.width <= 0 || r.height <= 0 || r.x + r.width > 1.000001 || r.y + r.height > 1.000001)) throw new Error('影格選區無效');
    return { id: v.id, timeSeconds: v.timeSeconds, profile: v.profile, imagePng: v.imagePng, board: parseBoardJSON(JSON.stringify(v.board)), recognizedBoard: v.recognizedBoard === null ? null : parseBoardJSON(JSON.stringify(v.recognizedBoard)), region: r === null ? null : { x: r.x, y: r.y, width: r.width, height: r.height } };
  };
  const frames = data.frames.map(frame);
  if (new Set(frames.map((f: LabeledFrame) => f.id)).size !== frames.length) throw new Error('影格 ID 重複');
  const operations = data.operations.map((v: Operation) => {
    if (!v || typeof v.id !== 'string' || v.id.length > 100 || typeof v.action !== 'string' || !v.action.trim() || v.action.length > 500 || typeof v.note !== 'string' || v.note.length > 1000 || !['verified','provisional','unknown'].includes(v.validation) || v.evidence !== 'user-annotation') throw new Error('操作紀錄無效');
    const before = frame(v.before), after = frame(v.after); if (after.timeSeconds < before.timeSeconds) throw new Error('操作後時間不可早於操作前');
    return { id: v.id, before, after, action: v.action, validation: v.validation, evidence: 'user-annotation' as const, note: v.note };
  }); return { frames, operations };
}
export function validateVideo(file: File) { if (!['video/mp4','video/webm'].includes(file.type) || !/\.(mp4|webm)$/i.test(file.name) || file.size > 512 * 1024 * 1024 || !file.size) throw new Error('請選擇512 MB以內的 MP4／WebM，本機解碼是否支援仍由瀏覽器決定'); }
export const stepTime = (time: number, direction: number, fps: number, duration: number) => Math.max(0, Math.min(duration, time + direction / fps));
