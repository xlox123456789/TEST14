import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FeedbackDialog } from '../board/FeedbackDialog';
import { BoardWorkspace } from '../board/BoardWorkspace';
import { createBoard, speciesNames, updateCell } from '../board/model';
import { reportEndpoint, sendReport } from '../board/feedback';
import { currentVersion, releases } from '../releases';

const context = () => ({ image: { url: 'blob:local', profile: 'game' as const }, recognized: createBoard(), board: updateCell(createBoard(), 2, { state: 'prisoner', species: 'rat' }), region: null });
beforeEach(() => {
  vi.stubEnv('VITE_REPORT_ENDPOINT', 'https://reports.example/reports');
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); } });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it('uses the requested display names without changing stable JSON species IDs', () => {
  expect(Object.values(speciesNames)).toEqual(['老象P', '惡魔獅', '狼阿奇', '低欸鼠']);
  expect(context().board.cells[1].species).toBe('rat');
  expect(releases[0].version).toBe(currentVersion);
});
it('requires explicit correction mode before showing editing controls', () => {
  render(<BoardWorkspace snapshot={null} />);
  expect(screen.queryByLabelText('狀態')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '修正盤面' }));
  fireEvent.change(screen.getByLabelText('狀態'), { target: { value: 'prisoner' } });
  fireEvent.change(screen.getByLabelText('野獸種類'), { target: { value: 'lion' } });
  fireEvent.click(screen.getByRole('button', { name: '完成修正' }));
  expect(screen.queryByLabelText('狀態')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '格子 1 囚犯' })).toHaveTextContent('惡魔獅');
});
it('does not fetch until consent and confirmation, and cancel sends nothing', () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); const close = vi.fn();
  render(<FeedbackDialog context={context()} onClose={close} />);
  expect(screen.getByRole('button', { name: '同意並送出回報' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(close).toHaveBeenCalled(); expect(fetcher).not.toHaveBeenCalled();
});
it('disables sending when a receiver has not been configured', () => {
  vi.stubEnv('VITE_REPORT_ENDPOINT', '');
  render(<FeedbackDialog context={context()} onClose={() => {}} />);
  fireEvent.click(screen.getByRole('checkbox'));
  expect(screen.getByRole('button', { name: '同意並送出回報' })).toBeDisabled();
  expect(screen.getByText(/回報接收服務尚未設定/)).toBeInTheDocument();
});
it('uploads image and separate original/corrected results without credentials only after confirmation', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ blob: async () => new Blob(['image'], { type: 'image/png' }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, id: 'receipt' }) });
  vi.stubGlobal('fetch', fetcher);
  render(<FeedbackDialog context={context()} onClose={() => {}} />);
  fireEvent.click(screen.getByRole('checkbox')); expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '同意並送出回報' }));
  await screen.findByText(/回報已送出/);
  expect(fetcher).toHaveBeenCalledTimes(2);
  const [endpoint, options] = fetcher.mock.calls[1]; expect(endpoint).toBe('https://reports.example/reports');
  expect(options.credentials).toBe('omit'); expect(options.redirect).toBe('error');
  expect(options.body.get('image').type).toBe('image/png'); expect(options.body.get('report').name).toBe('report.json');
});
it('never displays success on upload failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ blob: async () => new Blob(['image'], { type: 'image/png' }) }).mockResolvedValueOnce({ ok: false }));
  render(<FeedbackDialog context={context()} onClose={() => {}} />);
  fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: '同意並送出回報' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('回報未送出'));
  expect(screen.queryByText(/回報已送出/)).not.toBeInTheDocument();
});
it('rejects remote image URLs and unsafe receiver URLs', async () => {
  expect(reportEndpoint('http://reports.example')).toBeNull(); expect(reportEndpoint('https://secret@example.com')).toBeNull();
  await expect(sendReport({ ...context(), image: { url: 'https://example.com/image.png', profile: 'game' } }, 'https://reports.example', new AbortController().signal)).rejects.toThrow('本機圖片');
});
