import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { captureFrame } from '../capture/frame';

vi.mock('../capture/frame', async importOriginal => ({ ...await importOriginal<typeof import('../capture/frame')>(), captureFrame: vi.fn() }));
const stopTrack = vi.fn();
let track: { readyState: string; onended: (() => void) | null; stop: typeof stopTrack };
let getDisplayMedia: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  track = { readyState: 'live', onended: null, stop: stopTrack };
  getDisplayMedia = vi.fn().mockResolvedValue({ getTracks: () => [track], getVideoTracks: () => [track] });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getDisplayMedia } });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  vi.mocked(captureFrame).mockResolvedValue({ url: 'blob:shot', width: 1920, height: 1080, capturedAt: new Date() });
});
afterEach(cleanup);
async function share() {
  fireEvent.click(screen.getByRole('button', { name: '開始分享' }));
  await screen.findByText('分享中');
}
describe('screen capture workflow', () => {
  it('only captures on explicit clicks and replaces old object URLs', async () => {
    const { unmount } = render(<App />);
    expect(screen.getByRole('button', { name: /分析棋盤/ })).toBeDisabled();
    expect(captureFrame).not.toHaveBeenCalled();
    await share();
    expect(getDisplayMedia).toHaveBeenCalledWith({ video: true, audio: false });
    expect(captureFrame).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /分析棋盤/ }));
    await screen.findByAltText('最近一次手動擷取的遊戲畫面');
    expect(screen.getByText('1920 × 1080 px')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /分析棋盤/ }));
    await waitFor(() => expect(captureFrame).toHaveBeenCalledTimes(2));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:shot');
    unmount();
    expect(stopTrack).toHaveBeenCalled();
  });
  it('handles permission cancellation and allows retry', async () => {
    getDisplayMedia.mockRejectedValueOnce(new DOMException('', 'NotAllowedError'));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '開始分享' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('分享未獲授權');
    await share();
  });
  it('handles browser stop and reauthorization', async () => {
    render(<App />); await share();
    act(() => track.onended?.());
    expect(screen.getByRole('alert')).toHaveTextContent('分享已中斷');
    expect(screen.getByRole('button', { name: /分析棋盤/ })).toBeDisabled();
    await share();
    expect(getDisplayMedia).toHaveBeenCalledTimes(2);
  });
  it('stops the existing stream before reshare and supports explicit stop', async () => {
    render(<App />); await share();
    fireEvent.click(screen.getByRole('button', { name: '重新分享' }));
    await screen.findByText('分享中');
    expect(stopTrack).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '停止分享' }));
    expect(stopTrack).toHaveBeenCalledTimes(2);
    expect(screen.getByText('尚未分享')).toBeInTheDocument();
  });
  it('shows capture failures without fabricating results', async () => {
    vi.mocked(captureFrame).mockRejectedValueOnce(new Error('尚未取得有效畫格'));
    render(<App />); await share();
    fireEvent.click(screen.getByRole('button', { name: /分析棋盤/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('有效畫格');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
  it('disables sharing in unsupported or insecure contexts', () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
    render(<App />);
    expect(screen.getByRole('button', { name: '開始分享' })).toBeDisabled();
    expect(getDisplayMedia).not.toHaveBeenCalled();
  });
  it('discards authorization resolving after stop', async () => {
    let resolve!: (stream: unknown) => void;
    getDisplayMedia.mockReturnValueOnce(new Promise(value => { resolve = value; }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '開始分享' }));
    fireEvent.click(screen.getByRole('button', { name: '停止分享' }));
    await act(async () => resolve({ getTracks: () => [track], getVideoTracks: () => [track] }));
    expect(stopTrack).toHaveBeenCalled();
    expect(screen.getByText('尚未分享')).toBeInTheDocument();
  });
});
