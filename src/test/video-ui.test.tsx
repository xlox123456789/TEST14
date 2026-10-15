import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { VideoLab } from '../video/VideoLab';
import { createBoard } from '../board/model';
import { captureFrame } from '../capture/frame';
vi.mock('../capture/frame', () => ({ captureFrame: vi.fn() }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('requires a decoded video and explicit click; seeking and playback do not capture', async () => {
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:video'), revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  const onFrame = vi.fn(), onSourceChange = vi.fn();
  const { container } = render(<VideoLab board={createBoard()} recognized={null} region={null} current={null} busy={false} onFrame={onFrame} onLoad={vi.fn()} onSourceChange={onSourceChange} />);
  fireEvent.click(screen.getByText('影片回放測試模式（本機）'));
  fireEvent.change(screen.getByLabelText('匯入影片'), { target: { files: [new File(['test'], 'test.mp4', {type:'video/mp4'})] } });
  expect(onSourceChange).toHaveBeenCalledOnce(); expect(captureFrame).not.toHaveBeenCalled();
  const video = container.querySelector('video')!;
  Object.defineProperties(video, { duration: { value:3 }, videoWidth:{value:980}, videoHeight:{value:740} });
  fireEvent.loadedMetadata(video);
  fireEvent.change(screen.getByLabelText('影片時間（秒）'), {target:{value:'1.5'}});
  fireEvent.seeked(video); fireEvent.timeUpdate(video); fireEvent.play(video);
  expect(captureFrame).not.toHaveBeenCalled();
  vi.mocked(captureFrame).mockResolvedValue({url:'blob:frame',width:980,height:740,capturedAt:new Date()});
  fireEvent.click(screen.getByRole('button',{name:'擷取並分析此影格'}));
  await waitFor(() => expect(onFrame).toHaveBeenCalledWith(expect.objectContaining({url:'blob:frame'}),1.5,'game'));
  expect(screen.getByRole('button',{name:'儲存已確認標註影格'})).toBeDisabled();
  cleanup(); vi.unstubAllGlobals();
});

