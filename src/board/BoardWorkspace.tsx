import { useEffect, useRef, useState } from 'react';
import type { Snapshot } from '../capture/frame';
import { analyzeImage } from '../recognition/image';
import { cellRegions, validRegion } from '../recognition/raster';
import { createBoard, evidence, type Board, type Rect } from './model';
import { BoardEditor } from './BoardEditor';
import { officeBoard } from './mechanics';
import { ToolPicker } from './ToolPicker';
import { DecisionControls } from './DecisionControls';
import { NextAdvice } from './NextAdvice';
import { usePlanner } from './usePlanner';
import { FeedbackDialog } from './FeedbackDialog';
import type { ReportContext } from './feedback';
import { boardDiff } from '../video/history';
import { track } from '../analytics/analytics';

const FULL: Rect = { x: 0, y: 0, width: 1, height: 1 };
export function BoardWorkspace({ snapshot }: { snapshot: Snapshot | null }) {
  const [board, setBoard] = useState<Board>(()=>officeBoard(createBoard()));
  const [recognized, setRecognized] = useState<Board | null>(null);
  const [report, setReport] = useState<ReportContext | null>(null);
  const [image, setImage] = useState<{ url: string; profile: 'game' | 'synthetic'; label: string } | null>(null);
  const [region, setRegion] = useState<Rect | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const ownedURL = useRef<string | null>(null); const seenSnapshot = useRef<Snapshot | null>(null);
  const heldTools = useRef<string[] | null>(null);
  const selectionStart = useRef<{ x: number; y: number } | null>(null);
  const confirmed = useRef<Board | null>(null);
  function updateBoard(value: Board) {
    if(value.reviewedAt&&!board.reviewedAt){
      const diff=boardDiff(confirmed.current??recognized??officeBoard(createBoard()),value);
      if(diff.cells.length||diff.globals.length)track('manual_correction_saved',{operation_result:'success',analysis_mode:'screenshot',correction_count:diff.cells.length});
      confirmed.current=value;
    }
    heldTools.current=value.tools;
    setBoard(officeBoard(value));
  }
  async function run(url: string, profile: 'game' | 'synthetic', crop: Rect | null, analysisMode: 'video' | 'screenshot' = 'screenshot') {
    controller.current?.abort(); const request = new AbortController(); controller.current = request;
    setBusy(true); setError(''); setReport(null); setRecognized(null);
    const started = performance.now();
    try {
      const result = await analyzeImage(url, profile, crop, request.signal);
      if (request.signal.aborted) return;
      const original=officeBoard(result.board);
      const next=original.tools===null&&heldTools.current!==null?{...original,tools:heldTools.current,fieldEvidence:{...original.fieldEvidence,tools:evidence('manual','沿用使用者核對的持有刑具；本次圖片未辨識')}}:original;
      heldTools.current=next.tools;
      setBoard(next); setRecognized(original); setRegion(result.region); setMessage(result.message);
      const success = result.board.cells.some(c => c.id !== 1 && c.state !== 'unknown');
      const params = { analysis_mode: analysisMode, operation_result: success ? 'success' as const : 'failed' as const, processing_time_ms: performance.now() - started };
      track(success ? 'board_recognition_completed' : 'board_recognition_failed', params);
      if (analysisMode === 'video') track('video_frame_analyzed', params);
    } catch (e) { if (!request.signal.aborted) { setBoard(officeBoard({...createBoard(),tools:heldTools.current})); setMessage('辨識失敗，盤面已保留為未知，可手動編輯。'); setError(e instanceof Error ? e.message : '無法辨識圖片'); track('board_recognition_failed', { analysis_mode: analysisMode, operation_result: 'failed' }); if (analysisMode === 'video') track('video_frame_analyzed', { analysis_mode: 'video', operation_result: 'failed' }); } }
    finally { if (!request.signal.aborted) setBusy(false); }
  }
  function replaceImage(url: string, profile: 'game' | 'synthetic', label: string, owned = false) {
    controller.current?.abort(); setBusy(false);
    if (ownedURL.current) URL.revokeObjectURL(ownedURL.current);
    ownedURL.current = owned ? url : null;
    setImage({ url, profile, label }); setRegion(null); setBoard(officeBoard({...createBoard(),tools:heldTools.current})); setError('');
    void run(url, profile, null, 'screenshot');
  }
  // This responds to an explicit single-frame capture, never polls the stream.
  useEffect(() => { if (snapshot && snapshot !== seenSnapshot.current) { seenSnapshot.current = snapshot; replaceImage(snapshot.url, 'game', '最近一次手動截圖'); } }, [snapshot]);
  useEffect(() => () => { controller.current?.abort(); if (ownedURL.current) URL.revokeObjectURL(ownedURL.current); }, []);
  function loadImage(file: File | undefined) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 16 * 1024 * 1024) { setError('請選擇16 MB以內的 PNG、JPEG 或 WebP'); return; }
    replaceImage(URL.createObjectURL(file), 'game', file.name.slice(0, 100), true);
  }
  function point(event: React.PointerEvent<HTMLDivElement>) { const box = event.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)), y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)) }; }
  const {plan,pending}=usePlanner(board);
  return <>
    <section className="panel recognition-panel" aria-labelledby="recognition-heading">
      <div className="panel-heading recognition-heading"><h2 id="recognition-heading"><span className="step">02</span> 盤面辨識與修正</h2>
      <div className="board-actions recognition-tools" role="group" aria-label="盤面工具">
        <button className="secondary" disabled={busy || !image} onClick={() => { if (image) setReport({ image, recognized, board, region }); }}>回報辨識錯誤</button>
        <label className="file-button">載入本機圖片<input type="file" aria-label="載入本機圖片" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { loadImage(e.target.files?.[0]); e.target.value = ''; }} /></label></div></div>
      <p className="sr-only" role="status">{busy ? '正在本機解碼與辨識…' : message}</p>
      {image && <details><summary>圖片與手動選區 · {image.label}</summary>
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
      <BoardEditor board={board} onChange={updateBoard} disabled={busy} recommendedTarget={plan?.best?.target??null} showConfirm={false}/>
      <fieldset className="board-settings" disabled={busy}>
        <ToolPicker value={board.tools} onChange={tools=>updateBoard({...board,tools})}/>
        <DecisionControls board={board} onChange={updateBoard}/>
      </fieldset>
      <div className="board-actions"><button className="secondary" disabled={busy} onClick={()=>updateBoard({...board,reviewedAt:new Date().toISOString()})}>確認整個盤面</button></div>
      <p role="status" className="compact-hint">{board.reviewedAt?'盤面已確認；未知資訊不補值。':'盤面待確認；點格子修正。'}</p>
      {report && <FeedbackDialog context={report} onClose={() => setReport(null)} />}
    </section>
    <NextAdvice plan={plan} pending={pending} tools={board.tools}/>
  </>;
}
