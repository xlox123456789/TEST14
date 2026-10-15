import type { Board, Rect } from './model';
import { currentVersion } from '../releases';

export interface ReportContext { image: { url: string; profile: 'game' | 'synthetic' }; recognized: Board | null; board: Board; region: Rect | null }
export function reportEndpoint(value: string | undefined): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export async function sendReport(context: ReportContext, endpoint: string, signal: AbortSignal): Promise<string> {
  if (!reportEndpoint(endpoint)) throw new Error('回報服務網址必須使用 HTTPS');
  if (!/^(blob:|data:image\/(png|jpeg|webp)[;,])/.test(context.image.url)) throw new Error('只允許本機圖片');
  const image = await fetch(context.image.url, { signal }).then(response => response.blob());
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(image.type) || image.size > 16 * 1024 * 1024) throw new Error('圖片格式或大小不符合回報限制');
  const data = new FormData();
  const extension = image.type === 'image/jpeg' ? 'jpg' : image.type === 'image/webp' ? 'webp' : 'png';
  data.append('image', image, `screenshot.${extension}`);
  data.append('report', new Blob([JSON.stringify({ schemaVersion: 1, version: currentVersion, reportedAt: new Date().toISOString(), consent: true,
    profile: context.image.profile, region: context.region, recognizedBoard: context.recognized, correctedBoard: context.board })], { type: 'application/json' }), 'report.json');
  const response = await fetch(endpoint, { method: 'POST', body: data, signal, credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' });
  if (!response.ok) throw new Error('回報未送出，接收服務拒絕或暫時無法使用，請稍後再試');
  const receipt = await response.json();
  if (receipt.ok !== true || typeof receipt.id !== 'string') throw new Error('未取得有效回報收據，無法確認是否成功');
  return receipt.id;
}
