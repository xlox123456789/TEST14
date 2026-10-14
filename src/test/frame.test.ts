import { describe, expect, it, vi } from 'vitest';
import { captureFrame, isLikelyBlack, shareError } from '../capture/frame';

describe('frame validation', () => {
  it('detects empty and nearly black samples', () => {
    expect(isLikelyBlack(new Uint8ClampedArray())).toBe(true);
    expect(isLikelyBlack(new Uint8ClampedArray([0, 0, 0, 255, 12, 12, 12, 255]))).toBe(true);
    expect(isLikelyBlack(new Uint8ClampedArray([90, 120, 200, 255]))).toBe(false);
  });
  it('rejects video without decoded frames', async () => {
    await expect(captureFrame(document.createElement('video'))).rejects.toThrow('有效畫格');
  });
  it('encodes current dimensions and warns for black frames', async () => {
    const video = document.createElement('video');
    Object.defineProperties(video, { readyState: { value: 2 }, videoWidth: { value: 1920 }, videoHeight: { value: 1080 } });
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage, getImageData: () => ({ data: new Uint8ClampedArray(64 * 36 * 4) }) } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['png'], { type: 'image/png' })));
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:shot') });
    const result = await captureFrame(video);
    expect(result).toMatchObject({ width: 1920, height: 1080, url: 'blob:shot' });
    expect(result.warning).toContain('黑畫面');
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1920, 1080);
  });
  it('rejects encoding failures', async () => {
    const video = document.createElement('video');
    Object.defineProperties(video, { readyState: { value: 2 }, videoWidth: { value: 1 }, videoHeight: { value: 1 } });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray([255,255,255,255]) }) } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(null));
    await expect(captureFrame(video)).rejects.toThrow('編碼失敗');
  });
  it.each(['NotAllowedError', 'NotReadableError', 'NotFoundError', 'InvalidStateError'])('explains %s', name => {
    expect(shareError(new DOMException('technical', name))).not.toBe('technical');
  });
});
