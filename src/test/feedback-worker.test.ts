// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import worker, { taipeiDay, RESERVE_QUOTA, type Env } from '../../feedback-worker/src/index';
import { createBoard } from '../board/model';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const origin = 'https://xlox123456789.github.io';
function env(): Env { return { ALLOWED_ORIGIN: origin, REPORTS: { put: vi.fn().mockResolvedValue(null), delete: vi.fn().mockResolvedValue(undefined) }, REPORT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) }, QUOTA_DB: { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ first: vi.fn().mockResolvedValue({ used: 1 }) })) })) } }; }
function request(overrides = {}, image = new Uint8Array([137,80,78,71,13,10,26,10])) {
  const form = new FormData(); form.append('image', new Blob([image], { type: 'image/png' }), 'image.png');
  form.append('report', new Blob([JSON.stringify({ schemaVersion: 1, consent: true, profile: 'game', version: 'test', reportedAt: new Date().toISOString(), region: null, recognizedBoard: createBoard(), correctedBoard: createBoard(), ...overrides })]), 'report.json');
  return new Request('https://reports.example/reports', { method: 'POST', headers: { Origin: origin }, body: form });
}
describe('private anonymous feedback receiver (mocked R2)', () => {
  it('executes the real SQLite quota SQL: only 200 of 250 reservations succeed, next day resets', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(readFileSync(new URL('../../feedback-worker/migrations/0001_daily_quota.sql', import.meta.url), 'utf8'));
      const statement = db.prepare(RESERVE_QUOTA); let accepted = 0;
      for (let i = 0; i < 250; i++) if (statement.get('2026-10-15')) accepted++;
      expect(accepted).toBe(200); expect(statement.get('2026-10-16')).toEqual({ used: 1 });
    } finally { db.close(); }
  });
  it('resets the day at Taipei midnight and reserves quota atomically before R2', async () => {
    expect(taipeiDay(Date.parse('2026-10-15T15:59:59Z'))).toBe('2026-10-15');
    expect(taipeiDay(Date.parse('2026-10-15T16:00:00Z'))).toBe('2026-10-16');
    const bindings = env(); await worker.fetch(request(), bindings); expect(bindings.QUOTA_DB.prepare).toHaveBeenCalledWith(RESERVE_QUOTA);
    expect(RESERVE_QUOTA).toContain('WHERE daily_quota.used < 200 RETURNING used');
    expect(vi.mocked(bindings.QUOTA_DB.prepare).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(bindings.REPORTS.put).mock.invocationCallOrder[0]);
  });
  it('does not write to R2 when the whole-site daily quota is full or unavailable', async () => {
    const bindings = env(); vi.mocked(bindings.QUOTA_DB.prepare).mockReturnValue({ bind: () => ({ first: async () => null }) });
    expect((await worker.fetch(request(), bindings)).status).toBe(429); expect(bindings.REPORTS.put).not.toHaveBeenCalled();
    vi.mocked(bindings.QUOTA_DB.prepare).mockImplementation(() => { throw new Error('D1 offline'); });
    expect((await worker.fetch(request(), bindings)).status).toBe(503); expect(bindings.REPORTS.put).not.toHaveBeenCalled();
  });
  it('stores both files with matching private keys and returns a receipt', async () => {
    const bindings = env(); const result = await worker.fetch(request(), bindings);
    expect(result.status).toBe(201); expect(await result.json()).toMatchObject({ ok: true, id: expect.any(String) });
    const calls = vi.mocked(bindings.REPORTS.put).mock.calls;
    expect(calls).toHaveLength(2); expect(calls[0][0].split('/').slice(0, 2)).toEqual(calls[1][0].split('/').slice(0, 2));
    const report = JSON.parse(String(calls[1][1])); expect(report.correctedBoard.cells).toHaveLength(16); expect(report.recognizedBoard.cells).toHaveLength(16);
    expect(report).not.toHaveProperty('ip');
  });
  it('rejects other origins, GET access, and allows preflight without storage', async () => {
    const bindings = env();
    expect((await worker.fetch(new Request('https://reports.example/reports'), bindings)).status).toBe(403);
    expect((await worker.fetch(new Request('https://reports.example/reports', { headers: { Origin: origin } }), bindings)).status).toBe(405);
    expect((await worker.fetch(new Request('https://reports.example/reports', { method: 'OPTIONS', headers: { Origin: origin } }), bindings)).status).toBe(204);
    expect(bindings.REPORTS.put).not.toHaveBeenCalled();
  });
  it.each([{ consent: false }, { correctedBoard: {} }, { region: { x: 0, y: 0, width: 2, height: 2 } }])('rejects missing consent or invalid board/region: %j', async data => {
    const bindings = env(); expect((await worker.fetch(request(data), bindings)).status).toBe(400); expect(bindings.REPORTS.put).not.toHaveBeenCalled();
  });
  it('rejects fake PNG bytes and rate-limited requests', async () => {
    const bindings = env(); expect((await worker.fetch(request({}, new Uint8Array([1,2,3])), bindings)).status).toBe(400);
    vi.mocked(bindings.REPORT_RATE_LIMITER.limit).mockResolvedValue({ success: false });
    expect((await worker.fetch(request(), bindings)).status).toBe(429); expect(bindings.REPORTS.put).not.toHaveBeenCalled();
  });
  it('does not return success if storage fails, and cleans up incomplete uploads', async () => {
    const bindings = env(); vi.mocked(bindings.REPORTS.put).mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('R2 unavailable'));
    expect((await worker.fetch(request(), bindings)).status).toBe(503); expect(bindings.REPORTS.delete).toHaveBeenCalledOnce();
  });
});
