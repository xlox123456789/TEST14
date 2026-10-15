import { describe, expect, it } from 'vitest';
import { loadRaster } from '../recognition/image';
describe('local image decode boundary', () => {
  it('rejects external URLs before any image request', async () => {
    await expect(loadRaster('https://example.com/image.png', new AbortController().signal)).rejects.toThrow('本機');
  });
  it('aborts an undecoded image without leaving work behind', async () => {
    const request = new AbortController(); const promise = loadRaster('blob:pending', request.signal); request.abort();
    await expect(promise).rejects.toThrow('取消');
  });
  it('handles signals that are already aborted', async () => {
    const request = new AbortController(); request.abort();
    await expect(loadRaster('blob:pending', request.signal)).rejects.toThrow('取消');
  });
});
