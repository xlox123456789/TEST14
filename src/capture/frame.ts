export interface Snapshot { url: string; width: number; height: number; capturedAt: Date; warning?: string }

// A heuristic warning, not a claim that a dark game scene is invalid.
export function isLikelyBlack(data: Uint8ClampedArray): boolean {
  if (!data.length) return true;
  let dark = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] <= 12 && data[i + 1] <= 12 && data[i + 2] <= 12) dark++;
  }
  return dark / pixels >= 0.98;
}

export async function captureFrame(video: HTMLVideoElement): Promise<Snapshot> {
  const width = video.videoWidth, height = video.videoHeight;
  if (video.readyState < 2 || !width || !height) throw new Error('尚未取得有效畫格，請確認遊戲視窗未最小化，再重試。');
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('瀏覽器無法建立影像擷取畫布。');
  context.drawImage(video, 0, 0, width, height);
  const capturedAt = new Date();
  const sample = document.createElement('canvas');
  sample.width = 64; sample.height = 36;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  if (!sampleContext) throw new Error('無法檢查畫格，請重新分享。');
  sampleContext.drawImage(canvas, 0, 0, 64, 36);
  const warning = isLikelyBlack(sampleContext.getImageData(0, 0, 64, 36).data)
    ? '這張截圖可能是黑畫面。請確認遊戲未最小化，嘗試無邊框視窗模式，或重新選擇分享來源。深色場景也可能觸發此提醒。' : undefined;
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('截圖編碼失敗，請重試。')), 'image/png'));
  return { url: URL.createObjectURL(blob), width, height, capturedAt, warning };
}

export function shareError(error: unknown): string {
  if (error instanceof Error || error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return '分享未獲授權或已取消。請按「開始分享」重新選擇遊戲視窗。';
    if (error.name === 'NotReadableError') return '無法讀取分享來源。請檢查系統擷取權限，或切換遊戲為無邊框視窗模式。';
    if (error.name === 'NotFoundError') return '找不到可分享的畫面，請確認遊戲視窗已開啟。';
    if (error.name === 'InvalidStateError') return '請將網站切回前景，直接點擊分享按鈕再試一次。';
    return error.message || '分享失敗，請重新授權。';
  }
  return '分享失敗，請重新授權。';
}
