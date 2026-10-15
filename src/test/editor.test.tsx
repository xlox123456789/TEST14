import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { BoardEditor } from '../board/BoardEditor';
import { BoardWorkspace } from '../board/BoardWorkspace';
import { createBoard } from '../board/model';
import { exportBoardJSON } from '../board/json';
import { recognizeRaster, makeTestRaster } from '../recognition/raster';
import { analyzeImage } from '../recognition/image';
vi.mock('../recognition/image', () => ({ analyzeImage: vi.fn(), testImageURL: () => 'data:image/png;base64,test' }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function Editor() { const [board, setBoard] = useState(createBoard); return <BoardEditor board={board} onChange={setBoard} />; }
describe('manual board editor and JSON workflow', () => {
  it('edits any cell without screenshots and invalidates confirmation on changes', () => {
    render(<Editor />); fireEvent.click(screen.getByRole('button', { name: '格子 8 未知' }));
    fireEvent.change(screen.getByLabelText('狀態'), { target: { value: 'prisoner' } });
    fireEvent.change(screen.getByLabelText('野獸種類'), { target: { value: 'rat' } });
    fireEvent.change(screen.getByLabelText('稀有度'), { target: { value: 'rainbow' } });
    expect(screen.getByRole('button', { name: '格子 8 囚犯' })).toHaveTextContent('鼠');
    fireEvent.click(screen.getByRole('button', { name: '確認整個盤面' })); expect(screen.getByText(/盤面已確認/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('狀態'), { target: { value: 'event' } });
    expect(screen.getByText(/盤面待確認/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('事件名稱'), { target: { value: '待核對事件' } });
  });
  it('applies global values including zero remaining days and observed patrol options', () => {
    render(<Editor />);
    fireEvent.click(screen.getByText('全局欄位與其他資源'));
    fireEvent.change(screen.getByLabelText('典獄長位置（1–16）'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('剩餘天數'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('可巡視位置（例如 2,3,5）'), { target: { value: '2,5' } });
    fireEvent.click(screen.getByRole('button', { name: '套用全局欄位' }));
    expect(screen.getByText(/典獄長：7/)).toBeInTheDocument();
    expect(screen.getByLabelText('剩餘天數')).toHaveValue(0);
  });
  it('imports valid JSON, rejects malformed JSON without destroying existing state', () => {
    render(<BoardWorkspace snapshot={null} />);
    fireEvent.click(screen.getByText('匯入／匯出盤面 JSON'));
    const board = createBoard(); board.cells[3].state = 'locked';
    fireEvent.change(screen.getByLabelText('盤面 JSON'), { target: { value: exportBoardJSON(board) } });
    fireEvent.click(screen.getByRole('button', { name: '匯入 JSON' }));
    expect(screen.getByRole('button', { name: '格子 4 封閉' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('盤面 JSON'), { target: { value: '{broken' } });
    fireEvent.click(screen.getByRole('button', { name: '匯入 JSON' }));
    expect(screen.getByRole('alert')).toBeInTheDocument(); expect(screen.getByRole('button', { name: '格子 4 封閉' })).toBeInTheDocument();
  });
  it('loads a synthetic image through recognition and exports its corrected structure', async () => {
    vi.mocked(analyzeImage).mockResolvedValue(recognizeRaster(makeTestRaster(), 'synthetic', null));
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:export') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<BoardWorkspace snapshot={null} />);
    fireEvent.click(screen.getByRole('button', { name: '載入測試圖片' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '格子 3 囚犯' })).toBeEnabled());
    fireEvent.click(screen.getByText('匯入／匯出盤面 JSON'));
    fireEvent.click(screen.getByRole('button', { name: '匯出 JSON' }));
    expect(JSON.parse((screen.getByLabelText('盤面 JSON') as HTMLTextAreaElement).value).cells[2].species).toBe('wolf');
  });
  it('does not apply stale recognition after a newer frame arrives', async () => {
    let oldResolve!: (v: Awaited<ReturnType<typeof analyzeImage>>) => void;
    vi.mocked(analyzeImage).mockReturnValueOnce(new Promise(resolve => { oldResolve = resolve; })).mockResolvedValueOnce({ board: createBoard(), region: null, synthetic: false, message: 'new image' });
    const shot = { url: 'blob:old', width: 100, height: 100, capturedAt: new Date() };
    const { rerender } = render(<BoardWorkspace snapshot={shot} />);
    rerender(<BoardWorkspace snapshot={{ ...shot, url: 'blob:new' }} />);
    await screen.findByText('new image');
    await act(async () => oldResolve(recognizeRaster(makeTestRaster(), 'synthetic', null)));
    expect(screen.getByRole('button', { name: '格子 3 未知' })).toBeInTheDocument();
  });
});
