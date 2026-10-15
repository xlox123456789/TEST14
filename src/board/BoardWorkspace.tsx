import { useEffect, useRef, useState } from 'react';
import type { Snapshot } from '../capture/frame';
import { analyzeImage, testImageURL } from '../recognition/image';
import { cellRegions, validRegion } from '../recognition/raster';
import { createBoard, type Board, type Rect } from './model';
import { BoardEditor } from './BoardEditor';
import { exportBoardJSON, parseBoardJSON } from './json';
import { possibleActions, type RuleMode } from './rules';
import { FeedbackDialog } from './FeedbackDialog';
import type { ReportContext } from './feedback';

const FULL: Rect = { x: 0, y: 0, width: 1, height: 1 };
export function BoardWorkspace({ snapshot }: { snapshot: Snapshot | null }) {
  const [board, setBoard] = useState<Board>(createBoard);
  const [editing, setEditing] = useState(false);
  const [recognized, setRecognized] = useState<Board | null>(null);
  const [report, setReport] = useState<ReportContext | null>(null);
  const [image, setImage] = useState<{ url: string; profile: 'game' | 'synthetic'; label: string } | null>(null);
  const [region, setRegion] = useState<Rect | null>(null);
  const [message, setMessage] = useState('可直接手動建立盤面，或載入自製測試圖片。真實遊戲模板尚不足。');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [json, setJson] = useState(''); const [mode, setMode] = useState<RuleMode>('verified-only');
  const controller = useRef<AbortController | null>(null);
  const ownedURL = useRef<string | null>(null); const seenSnapshot = useRef<Snapshot | null>(null);
  const selectionStart = useRef<{ x: number; y: number } | null>(null);
  function updateBoard(value: Board) { setBoard(value); }
  async function run(url: string, profile: 'game' | 'synthetic', crop: Rect | null) {
    controller.current?.abort(); const request = new AbortController(); controller.current = request;
    setBusy(true); setError(''); setEditing(false); setReport(null); setRecognized(null);
    try {
      const result = await analyzeImage(url, profile, crop, request.signal);
      if (request.signal.aborted) return;
      setBoard(result.board); setRecognized(result.board); setRegion(result.region); setMessage(result.message);
    } catch (e) { if (!request.signal.aborted) { setBoard(createBoard()); setMessage('辨識失敗，盤面已保留為未知，可手動編輯。'); setError(e instanceof Error ? e.message : '無法辨識圖片'); } }
    finally { if (!request.signal.aborted) setBusy(false); }
  }
  function replaceImage(url: string, profile: 'game' | 'synthetic', label: string, owned = false) {
    controller.current?.abort(); setBusy(false);
    if (ownedURL.current) URL.revokeObjectURL(ownedURL.current);
    ownedURL.current = owned ? url : null;
    setImage({ url, profile, label }); setRegion(null); setBoard(createBoard()); setError('');
    void run(url, profile, null);
  }
  // This responds to an explicit single-frame capture, never polls the stream.
  useEffect(() => { if (snapshot && snapshot !== seenSnapshot.current) { seenSnapshot.current = snapshot; replaceImage(snapshot.url, 'game', '最近一次手動截圖'); } }, [snapshot]);
  useEffect(() => () => { controller.current?.abort(); if (ownedURL.current) URL.revokeObjectURL(ownedURL.current); }, []);
  function loadImage(file: File | undefined) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 16 * 1024 * 1024) { setError('請選擇16 MB以內的 PNG、JPEG 或 WebP'); return; }
    replaceImage(URL.createObjectURL(file), 'game', file.name.slice(0, 100), true);
  }
  function importJSON(text: string) {
    try { const next = parseBoardJSON(text); controller.current?.abort(); setBusy(false); setBoard(next); setRecognized(null); setImage(null); setRegion(null); setReport(null); setEditing(false); setError(''); setMessage('已匯入盤面；來源為檔案自述，請人工核對後確認。'); }
    catch (e) { setError(e instanceof Error ? e.message : 'JSON 格式錯誤'); }
  }
  function readJSON(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_000_000) { setError('JSON 超過1 MB'); return; }
    const reader = new FileReader(); reader.onload = () => { const value = String(reader.result); setJson(value); importJSON(value); }; reader.onerror = () => setError('檔案讀取失敗'); reader.readAsText(file);
  }
  function downloadJSON() {
    const text = exportBoardJSON(board); setJson(text);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'test14-board.json'; link.click(); URL.revokeObjectURL(url);
  }
  function point(event: React.PointerEvent<HTMLDivElement>) { const box = event.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)), y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)) }; }
  const actions = possibleActions(board, mode);
  return <>
    <section className="panel recognition-panel" aria-labelledby="recognition-heading">
      <div className="panel-heading"><h2 id="recognition-heading"><span className="step">02</span> 盤面辨識與修正</h2><span className="soon">前瞻布局</span></div>
      <div className="board-actions"><button className="secondary" disabled={busy} aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? '完成修正' : '修正盤面'}</button>
        <button className="secondary" disabled={busy || !image} onClick={() => { if (image) setReport({ image, recognized, board, region }); }}>回報辨識錯誤</button></div>
      {!image && <p className="muted">回報需要先截圖或載入圖片；可直接進入修正模式建立盤面。</p>}
      <div className="board-actions"><button className="secondary" disabled={busy} onClick={() => { try { replaceImage(testImageURL(), 'synthetic', '自製色碼測試圖（非遊戲畫面）'); } catch (e) { setError(String(e)); } }}>載入測試圖片</button>
        <label className="file-button">載入本機圖片<input type="file" aria-label="載入本機圖片" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { loadImage(e.target.files?.[0]); e.target.value = ''; }} /></label></div>
      <p className="notice" role="status">{busy ? '正在本機解碼與辨識…' : message}</p>
      {image && <details open><summary>圖片與手動選區 · {image.label}</summary>
        <p className="muted">拖曳框選外圈邊框，或輸入百分比，再按「套用選區辨識」。新結果會重設盤面，請先匯出要保留的修正。</p>
        <div className="image-selection" onPointerDown={e => { if (busy) return; selectionStart.current = point(e); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => {
          if (!selectionStart.current) return; const end = point(e), start = selectionStart.current;
          setRegion({ x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) });
        }} onPointerUp={() => { selectionStart.current = null; }} onPointerCancel={() => { selectionStart.current = null; }}>
          <img src={image.url} alt="待辨識圖片與選區" draggable={false} />
          {region && validRegion(region) && <div className="crop-overlay" style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }}>
            {cellRegions(FULL).map(c => <span key={c.id} style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.width * 100}%`, height: `${c.height * 100}%` }}>{c.id}</span>)}
          </div>}
        </div>
        <fieldset className="crop-fields" disabled={busy}><legend>擷取區域（百分比）</legend>{(['x', 'y', 'width', 'height'] as const).map(key => <label key={key}>{{ x: '左', y: '上', width: '寬', height: '高' }[key]} %<input type="number" min="0" max="100" step="0.1" value={Number(((region ?? FULL)[key] * 100).toFixed(2))} onChange={e => setRegion({ ...(region ?? FULL), [key]: Number(e.target.value) / 100 })} /></label>)}</fieldset>
        <div className="board-actions"><button className="secondary" disabled={busy} onClick={() => { const crop = region ?? FULL; if (!validRegion(crop)) { setError('選區不可超出圖片且寬高須大於0'); return; } void run(image.url, image.profile, crop); }}>套用選區辨識</button>
          <button className="quiet" disabled={busy} onClick={() => { setRegion(null); void run(image.url, image.profile, null); }}>重新自動定位</button></div>
      </details>}
      {error && <p role="alert" className="notice error">{error}</p>}
      <BoardEditor board={board} onChange={updateBoard} disabled={busy} editing={editing} />
      {report && <FeedbackDialog context={report} onClose={() => setReport(null)} />}
      <details className="json-panel"><summary>匯入／匯出盤面 JSON</summary><p className="muted">只包含結構化盤面，不含圖片；匯入檔案仍須重新確認。<a href={`${import.meta.env.BASE_URL}examples/test-board.json`} download="test14-example.json">下載原創測試 JSON</a></p>
        <textarea aria-label="盤面 JSON" value={json} maxLength={1_000_001} onChange={e => setJson(e.target.value)} spellCheck={false} />
        <div className="board-actions"><button className="secondary" disabled={busy} onClick={downloadJSON}>匯出 JSON</button><button className="secondary" disabled={busy} onClick={() => importJSON(json)}>匯入 JSON</button>
          <label className="file-button">選擇 JSON 檔<input aria-label="選擇 JSON 檔" type="file" accept="application/json,.json" disabled={busy} onChange={e => { readJSON(e.target.files?.[0]); e.target.value = ''; }} /></label></div>
      </details>
    </section>
    <section className="panel suggestions-panel"><div className="panel-heading"><h2><span className="step">03</span> 下一步建議</h2><span className="soon">策略引擎尚未開放</span></div>
      <p className="notice">{actions.message}</p><label>規則模式<select aria-label="規則模式" value={mode} onChange={e => setMode(e.target.value as RuleMode)}><option value="verified-only">保守模式：僅顯示已確認盤面選項</option><option value="experimental-single">實驗：單一食物鏈假設</option><option value="experimental-two">實驗：雙食物鏈假設</option></select></label>
      {mode !== 'verified-only' && <p className="notice">實驗結果不是正式服合法性保證；不模擬升階、每日消耗或連鎖，也不選最佳步。</p>}
      <ul>{actions.blockedBy.map(reason => <li key={reason}>{reason}</li>)}</ul>
      {actions.candidates.length > 0 && <><h3>可能操作（未排序）</h3><ul>{actions.candidates.map((action, index) => <li key={index}>{action.kind === 'patrol' ? `巡視位置 ${action.target}` : `實驗：${action.actor} → 吞食 ${action.target}`}：{action.explanation}</li>)}</ul></>}
    </section>
  </>;
}
