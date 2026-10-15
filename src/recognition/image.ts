import type { Rect } from '../board/model';
import { makeTestRaster, recognizeRaster, type Raster } from './raster';
export function testImageURL(): string {
  const r = makeTestRaster(); const canvas = document.createElement('canvas'); canvas.width = r.width; canvas.height = r.height;
  const context = canvas.getContext('2d'); if (!context) throw new Error('無法建立測試圖片');
  const pixels = context.createImageData(r.width, r.height); pixels.data.set(r.data); context.putImageData(pixels, 0, 0);
  context.fillStyle = '#d6e1db'; context.font = 'bold 22px sans-serif'; context.fillText('TEST14 · 自製色碼測試圖 / 非遊戲畫面', 40, 45);
  return canvas.toDataURL('image/png');
}
export function loadRaster(url: string, signal: AbortSignal): Promise<Raster> {
  return new Promise((resolve, reject) => {
    if (!url.startsWith('blob:') && !url.startsWith('data:image/png')) { reject(new Error('僅允許本機圖片')); return; }
    const image = new Image();
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); image.onload = null; image.onerror = null; };
    const fail = (message: string) => { cleanup(); reject(new Error(message)); };
    const abort = () => { fail('已取消過期辨識'); image.src = ''; };
    const timer = setTimeout(() => fail('圖片解碼逾時，請重新載入'), 10000);
    signal.addEventListener('abort', abort, { once: true });
    image.onerror = () => fail('圖片無法解碼');
    image.onload = () => {
      try {
        if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 33_000_000) throw new Error('圖片解析度無效或超過3300萬像素');
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) throw new Error('無法讀取圖片像素');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        cleanup(); resolve({ width: canvas.width, height: canvas.height, data: pixels.data });
      } catch (e) { cleanup(); reject(e); }
    };
    if (signal.aborted) abort(); else image.src = url;
  });
}
export async function analyzeImage(url: string, profile: 'game' | 'synthetic', region: Rect | null, signal: AbortSignal) {
  const raster = await loadRaster(url, signal); if (signal.aborted) throw new Error('已取消過期辨識');
  return recognizeRaster(raster, profile, region);
}
