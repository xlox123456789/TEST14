import { useEffect, useRef, useState } from 'react';
import { captureFrame, type Snapshot } from '../capture/frame';
import { track } from '../analytics/analytics';
import type { Board, Rect } from '../board/model';
import { boardDiff, exportDataset, parseDataset, recognitionScore, stepTime, validateVideo, type LabeledFrame, type Operation, type Validation } from './history';
import { annotateFrame } from './annotate';
import { analyzeImage } from '../recognition/image';

export function VideoLab({ board, recognized, region, current, busy, onFrame, onLoad, onSourceChange }: {
  board: Board; recognized: Board | null; region: Rect | null; current: { url: string; timeSeconds: number; profile: 'game' | 'synthetic' } | null; busy: boolean;
  onFrame: (snapshot: Snapshot, time: number, profile: 'game' | 'synthetic') => void; onLoad: (frame: LabeledFrame) => void;
  onSourceChange: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null), url = useRef<string | null>(null), generation = useRef(0), capturing = useRef(false);
  const regression = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState('');
  const [source, setSource] = useState(''), [duration, setDuration] = useState(0), [time, setTime] = useState(0), [fps, setFPS] = useState(30);
  const [ready, setReady] = useState(false), [seeking, setSeeking] = useState(false), [working, setWorking] = useState(false), [error, setError] = useState('');
  const [profile, setProfile] = useState<'game' | 'synthetic'>('game');
  const [frames, setFrames] = useState<LabeledFrame[]>([]), [before, setBefore] = useState<LabeledFrame | null>(null), [after, setAfter] = useState<LabeledFrame | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]), [action, setAction] = useState(''), [validation, setValidation] = useState<Validation>('unknown'), [note, setNote] = useState('');
  useEffect(() => () => { generation.current++; regression.current?.abort(); if (url.current) URL.revokeObjectURL(url.current); }, []);
  function importVideo(file: File | undefined) {
    if (!file) return;
    try { validateVideo(file); generation.current++; onSourceChange(); setReady(false); setDuration(0); setTime(0); setSeeking(false); setError(''); setBefore(null); setAfter(null); setFrames([]); setOperations([]); if (url.current) URL.revokeObjectURL(url.current); url.current = URL.createObjectURL(file); setSource(url.current); }
    catch (e) { setError(String(e)); }
  }
  function seek(next: number) { if (!video.current || !ready || working) return; video.current.pause(); const target = Math.max(0, Math.min(duration, next)); if (Math.abs(video.current.currentTime - target) < .000001) return; setSeeking(true); video.current.currentTime = target; setTime(target); }
  async function extract() {
    const element = video.current; if (!element || !ready || seeking || capturing.current || busy) return;
    capturing.current = true; setWorking(true); setError(''); element.pause(); const token = generation.current; const timestamp = element.currentTime;
    track('board_analysis_requested', { analysis_mode: 'video' });
    try { const frame = await captureFrame(element); if (token !== generation.current) { URL.revokeObjectURL(frame.url); return; } onFrame(frame, timestamp, profile); }
    catch (e) { setError(String(e)); track('capture_failed', { operation_result: 'failed', analysis_mode: 'video' }); }
    finally { capturing.current = false; setWorking(false); }
  }
  async function saveFrame(kind: 'sample' | 'before' | 'after') {
    if (!current || busy || working) return; setWorking(true); setError(''); const token = generation.current;
    try {
      const blob = await fetch(current.url).then(r => r.blob());
      const imagePng = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
      if (token !== generation.current) return;
      const next: LabeledFrame = { id: crypto.randomUUID(), timeSeconds: current.timeSeconds, profile: current.profile, imagePng, board: structuredClone(board), recognizedBoard: recognized ? structuredClone(recognized) : null, region: region ? { ...region } : null };
      if (imagePng.length > 4_000_000) throw new Error('此影格超過資料集4 MB限制，請降低影片解析度');
      if (kind === 'before') setBefore(next); else if (kind === 'after') setAfter(next);
      else { if (frames.length >= 50) throw new Error('最多50個標註影格'); const nextFrames = [...frames, next]; parseDataset(exportDataset(nextFrames, operations)); setFrames(nextFrames); }
    } catch (e) { setError(String(e)); } finally { setWorking(false); }
  }
  function download(text: string, name: string, type: string) { const local = URL.createObjectURL(new Blob([text], { type })); const link = document.createElement('a'); link.href = local; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(local), 1000); }
  function exportData() { try { const data = exportDataset(frames, operations); parseDataset(data); download(data, 'test14-video-dataset.json', 'application/json'); } catch (e) { setError(String(e)); } }
  async function importData(file: File | undefined) { if (!file) return; try { if (file.size > 25_000_000) throw new Error('資料集超過25 MB'); const next = parseDataset(await file.text()); generation.current++; onSourceChange(); setFrames(next.frames); setOperations(next.operations); setBefore(null); setAfter(null); setError(''); } catch (e) { setError(String(e)); } }
  const scores = frames.filter(f => f.recognizedBoard).map(f => ({ frame: f, score: recognitionScore(f.recognizedBoard!, f.board) }));
  async function rerun() {
    if (working || !frames.length) return; const request = new AbortController(); regression.current = request; setWorking(true); setError(''); const token = generation.current;
    try { const next: LabeledFrame[] = []; for (const frame of frames) { setProgress(`回歸測試 ${next.length + 1}/${frames.length}`); const result = await analyzeImage(frame.imagePng,frame.profile,frame.region,request.signal); next.push({...frame,recognizedBoard:result.board}); } if (token === generation.current && !request.signal.aborted) setFrames(next); }
    catch(e) { if (token === generation.current) setError(request.signal.aborted ? '回歸已取消；原結果保留' : String(e)); }
    finally { setWorking(false); setProgress(''); }
  }
  const total = scores.reduce((n, s) => n + s.score.total, 0), correct = scores.reduce((n, s) => n + s.score.correct, 0);
  return <details className="video-lab"><summary>影片回放測試模式（本機）</summary>
    <p className="muted">影片不自動上傳。先擷取影格，在下方修正及確認盤面，再儲存標註或操作前／後。匯入新影片會清除目前資料集，請先匯出；匯出資料含圖片，請勿公開私人內容。逐格以指定FPS換算時間，變動幀率影片不保證精確對齊原始影格。</p>
    <label className="file-button">匯入影片<input aria-label="匯入影片" type="file" accept="video/mp4,video/webm,.mp4,.webm" disabled={working} onChange={e => { importVideo(e.target.files?.[0]); e.target.value = ''; }} /></label>
    <p className="muted">原創測試素材：<a href={`${import.meta.env.BASE_URL}fixtures/original-board.webm`} download>下載 WebM</a> ／ <a href={`${import.meta.env.BASE_URL}fixtures/original-board.mp4`} download>下載 MP4</a>（3秒，前兩秒為色碼盤面，最後一秒為無效黑畫面；需選原創測試模式）。</p>
    <video key={source} ref={video} src={source || undefined} controls playsInline preload="metadata" onLoadedMetadata={() => { const v = video.current!; if (!Number.isFinite(v.duration) || !v.videoWidth || v.videoWidth * v.videoHeight > 33_177_600) { setError('無效、過大或不支援的影片'); return; } setDuration(v.duration); setReady(true); track('video_imported', { operation_result: 'success', analysis_mode: 'video' }); }} onTimeUpdate={() => setTime(video.current?.currentTime ?? 0)} onSeeked={() => setSeeking(false)} onSeeking={() => setSeeking(true)} onError={() => { if (source) { setReady(false); setError('影片無法解碼，請使用瀏覽器支援的 MP4／WebM 編碼'); } }} />
    <label>影片時間（秒）<input aria-label="影片時間（秒）" type="number" min="0" max={duration} step="0.001" value={Number(time.toFixed(3))} disabled={!ready || working} onChange={e => seek(Number(e.target.value))} /></label>
    <label>逐格FPS（人工指定）<input type="number" min="1" max="240" value={fps} onChange={e => setFPS(Math.max(1, Math.min(240, Number(e.target.value) || 30)))} /></label>
    <label>辨識模式<select value={profile} onChange={e => setProfile(e.target.value as typeof profile)}><option value="game">真實遊戲（模板不足保留未知）</option><option value="synthetic">原創色碼測試影片（非遊戲辨識率）</option></select></label>
    <div className="board-actions"><button className="quiet" disabled={!ready || working} onClick={() => seek(stepTime(time, -1, fps, duration))}>前一格</button><button className="quiet" disabled={!ready || working} onClick={() => seek(stepTime(time, 1, fps, duration))}>下一格</button><button className="secondary" disabled={!ready || seeking || working || busy} onClick={() => void extract()}>擷取並分析此影格</button></div>
    <p className="muted">片長：{duration.toFixed(3)}秒；已擷取影格：{current ? `${current.timeSeconds.toFixed(3)}秒` : '尚無'}。修改辨識模式只影響下一次擷取。</p>
    <div className="board-actions"><button className="secondary" disabled={!current || busy || working || !board.reviewedAt} onClick={() => void saveFrame('sample')}>儲存已確認標註影格</button><button className="quiet" disabled={!current || busy || working || !board.reviewedAt} onClick={() => void saveFrame('before')}>記錄操作前盤面</button><button className="quiet" disabled={!current || busy || working || !board.reviewedAt} onClick={() => void saveFrame('after')}>記錄操作後盤面</button></div>
    <p className="muted">操作前：{before?.timeSeconds ?? '未記錄'}秒／操作後：{after?.timeSeconds ?? '未記錄'}秒</p>
    <label>玩家實際動作<input value={action} maxLength={500} onChange={e => setAction(e.target.value)} placeholder="例如：位置2吞食位置3（僅記錄實際選擇）" /></label>
    <label>規則驗證狀態<select value={validation} onChange={e => setValidation(e.target.value as Validation)}><option value="unknown">未知</option><option value="provisional">暫定</option><option value="verified">已驗證（僅使用者本次觀察，非官方認證）</option></select></label>
    <label>證據與限制<input value={note} maxLength={1000} onChange={e => setNote(e.target.value)} /></label>
    <button className="secondary" disabled={!before || !after || !action.trim() || working} onClick={() => {
      if (!before || !after) return; if (after.timeSeconds < before.timeSeconds) { setError('操作後時間不可早於操作前'); return; }
      const next = [...operations, { id: crypto.randomUUID(), before, after, action: action.trim(), validation, evidence: 'user-annotation' as const, note }];
      try { parseDataset(exportDataset(frames, next)); setOperations(next); setBefore(null); setAfter(null); setAction(''); setError(''); } catch (e) { setError(String(e)); }
    }}>儲存操作紀錄</button>
    <h3>標註影格與辨識統計</h3><p>影格 {frames.length} 筆／操作 {operations.length} 筆；人工已知欄位準確率：{total ? `${correct}/${total}（${(correct / total * 100).toFixed(1)}%）` : '尚無可評分標註'}。未知標註不納入分母；此數值不代表真實遊戲泛化準確率。</p>
    <div className="board-actions"><button className="secondary" disabled={working || !frames.length} onClick={() => void rerun()}>重新辨識資料集並計算準確率</button>{progress && <button className="quiet" onClick={() => regression.current?.abort()}>取消回歸測試</button>}</div><p role="status">{progress}</p>
    {scores.map(({ frame, score }) => <details key={frame.id}><summary>{frame.timeSeconds.toFixed(3)}秒：{score.correct}/{score.total} 已知欄位正確／辨識覆蓋率 {score.coverage === null ? '未知' : `${(score.coverage * 100).toFixed(1)}%`}</summary><ul>{score.errors.map(e => <li key={`${e.cell}-${e.field}`}>格{e.cell} {e.field}：辨識 {String(e.actual)}／標註 {String(e.expected)}</li>)}</ul></details>)}
    <ul>{frames.map(frame => <li key={frame.id}>{frame.timeSeconds.toFixed(3)}秒 <button className="quiet" onClick={() => onLoad(frame)}>載入標註盤面</button><button className="quiet" onClick={() => { void annotateFrame(frame).then(async data => { const blob = await fetch(data).then(r => r.blob()); const href = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = href; a.download = `annotated-${frame.timeSeconds.toFixed(3)}.png`; a.click(); window.setTimeout(() => URL.revokeObjectURL(href),1000); }).catch(e => setError(String(e))); }}>下載標註圖片</button></li>)}</ul>
    {operations.map(op => <details key={op.id}><summary>{op.before.timeSeconds.toFixed(3)} → {op.after.timeSeconds.toFixed(3)}秒：{op.action}（{op.validation}／使用者標註）</summary><pre>{JSON.stringify(boardDiff(op.before.board, op.after.board), null, 2)}</pre><p>{op.note}</p></details>)}
    <div className="board-actions"><button className="secondary" disabled={working} onClick={exportData}>匯出標註資料集 JSON</button><label className="file-button">匯入標註資料集<input aria-label="匯入標註資料集" type="file" accept="application/json,.json" disabled={working} onChange={e => { void importData(e.target.files?.[0]); e.target.value = ''; }} /></label></div>
    {error && <p role="alert" className="notice error">{error}</p>}
  </details>;
}
