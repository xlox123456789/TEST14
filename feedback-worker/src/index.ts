import { parseBoardJSON } from '../../src/board/json';
import { validRegion } from '../../src/recognition/raster';

export interface Env {
  ALLOWED_ORIGIN: string;
  REPORTS: { put(key: string, value: Blob | string, options?: { httpMetadata: { contentType: string } }): Promise<unknown>; delete(key: string): Promise<void> };
  REPORT_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
  QUOTA_DB: { prepare(query: string): { bind(...values: (string | number)[]): { first(): Promise<Record<string, unknown> | null> } } };
}
// One atomic SQLite statement for the entire site, including concurrent Workers.
export const RESERVE_QUOTA = `INSERT INTO daily_quota (day, used) VALUES (?, 1)
  ON CONFLICT(day) DO UPDATE SET used = daily_quota.used + 1 WHERE daily_quota.used < 200 RETURNING used`;
export const taipeiDay = (now: number) => new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
const MAX_BODY = 18 * 1024 * 1024;
async function boundedBody(request: Request): Promise<Uint8Array<ArrayBuffer>> {
  if (!request.body) throw new Error('empty');
  const reader = request.body.getReader(); const parts: Uint8Array[] = []; let size = 0;
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length;
    if (size > MAX_BODY) { await reader.cancel(); throw new Error('large'); } parts.push(value); } }
  finally { reader.releaseLock(); }
  const result = new Uint8Array(size); let offset = 0; for (const part of parts) { result.set(part, offset); offset += part.length; } return result;
}
async function validImage(file: Blob) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return file.type === 'image/png' ? [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)
    : file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : file.type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const headers = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, 'Vary': 'Origin', 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
    const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
    if (origin !== env.ALLOWED_ORIGIN) return new Response('Forbidden', { status: 403 });
    if (new URL(request.url).pathname !== '/reports') return reply(404, { error: 'Not found' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } });
    if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
    try {
      // The IP is used only as an in-memory rate-limiter key; never saved in R2 or logged here.
      const { success } = await env.REPORT_RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
      if (!success) return reply(429, { error: 'Too many reports' });
      if (Number(request.headers.get('Content-Length')) > MAX_BODY) return reply(413, { error: 'Report too large' });
      if (!request.headers.get('Content-Type')?.startsWith('multipart/form-data;')) return reply(415, { error: 'Expected multipart' });
      const raw = await boundedBody(request);
      const form = await new Response(raw, { headers: { 'Content-Type': request.headers.get('Content-Type')! } }).formData();
      const image = form.get('image'), report = form.get('report');
      if (!(image instanceof Blob) || !(report instanceof Blob) || image.size === 0 || image.size > 16 * 1024 * 1024 || report.size > 2_100_000 || !await validImage(image)) return reply(400, { error: 'Invalid files' });
      const data = JSON.parse(await report.text());
      if (data.schemaVersion !== 1 || data.consent !== true || !['game', 'synthetic'].includes(data.profile) || typeof data.version !== 'string' || data.version.length > 80 || !Number.isFinite(Date.parse(data.reportedAt)) || (data.region !== null && !validRegion(data.region))) return reply(400, { error: 'Invalid report' });
      const correctedBoard = parseBoardJSON(JSON.stringify(data.correctedBoard));
      const recognizedBoard = data.recognizedBoard === null ? null : parseBoardJSON(JSON.stringify(data.recognizedBoard));
      // Reserve before writing either object; failures consume quota conservatively.
      // If D1 is unavailable, fail closed rather than bypassing the daily cap.
      let quota;
      try { quota = await env.QUOTA_DB.prepare(RESERVE_QUOTA).bind(taipeiDay(Date.now())).first(); }
      catch { return reply(503, { error: 'Quota unavailable' }); }
      if (!quota) return reply(429, { error: 'Daily limit reached' });
      const id = crypto.randomUUID(); const prefix = `${new Date().toISOString().slice(0, 10)}/${id}`;
      const ext = image.type === 'image/png' ? 'png' : image.type === 'image/jpeg' ? 'jpg' : 'webp';
      const imageKey = `${prefix}/screenshot.${ext}`;
      await env.REPORTS.put(imageKey, image, { httpMetadata: { contentType: image.type } });
      try { await env.REPORTS.put(`${prefix}/report.json`, JSON.stringify({ schemaVersion: 1, id, receivedAt: new Date().toISOString(), version: data.version, consent: true, profile: data.profile,
        reportedAt: data.reportedAt, region: data.region, correctedBoard, recognizedBoard, imageKey }), { httpMetadata: { contentType: 'application/json' } }); }
      catch { await env.REPORTS.delete(imageKey); return reply(503, { error: 'Storage unavailable' }); }
      return reply(201, { ok: true, id });
    } catch { return reply(400, { error: 'Unable to accept report' }); }
  },
};
