import { useEffect, useRef, useState } from 'react';
import { reportEndpoint, sendReport, type ReportContext } from './feedback';
import { track } from '../analytics/analytics';

export function FeedbackDialog({ context, onClose }: { context: ReportContext; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const endpoint = reportEndpoint(import.meta.env.VITE_REPORT_ENDPOINT);
  useEffect(() => { dialog.current?.showModal(); return () => { request.current?.abort(); }; }, []);
  async function submit() {
    if (!consent || !endpoint || status !== 'idle') return;
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    setStatus('sending'); setError('');
    try { const id = await sendReport(context, endpoint, controller.signal); setReceipt(id); setStatus('sent'); track('error_report_submitted', { operation_result: 'success' }); }
    catch (e) { if (dialog.current?.open) { setStatus('idle'); setError(controller.signal.aborted ? '傳送逾時或已取消；無法確認接收狀態，請稍後查詢再重試。' : e instanceof Error ? e.message : '傳送失敗'); } }
    finally { window.clearTimeout(timeout); }
  }
  return <dialog ref={dialog} className="info-modal feedback-modal" aria-labelledby="feedback-title" onCancel={onClose}>
    <div className="modal-heading"><h2 id="feedback-title">回報辨識錯誤</h2><button aria-label="關閉錯誤回報" onClick={onClose}>×</button></div>
    <div className="info-content">
      <p><strong>將分享以下完整圖片，以及原始辨識結果、目前修正盤面、選區與版號，供維護者改進辨識。</strong>不需要登入 GitHub。</p>
      <p className="notice"><strong>圖片可能包含角色名稱、聊天或其他私人內容。請先檢查，避免分享私人資訊。</strong></p>
      <p className="muted">全站每日最多200筆，台灣時間00:00重置；另有每IP短時間限流。</p>
      <img className="report-preview" src={context.image.url} alt="即將分享的完整回報圖片" />
      <details><summary>檢查將分享的盤面資料</summary><pre>{JSON.stringify({ recognizedBoard: context.recognized, correctedBoard: context.board, region: context.region, profile: context.image.profile }, null, 2)}</pre></details>
      {!endpoint && <p role="status" className="notice">回報接收服務尚未設定，目前無法傳送。圖片與盤面仍留在本機。</p>}
      {endpoint && <p className="muted">接收位置：{new URL(endpoint).origin}。送出後無法由本頁撤回。</p>}
      {status !== 'sent' ? <><label className="report-consent"><input type="checkbox" checked={consent} disabled={status === 'sending'} onChange={e => setConsent(e.target.checked)} />我已檢查圖片，同意分享圖片與盤面辨識結果，協助改進。</label>
        <div className="board-actions"><button className="secondary" disabled={!consent || !endpoint || status === 'sending'} onClick={() => void submit()}>{status === 'sending' ? '傳送中…' : '同意並送出回報'}</button><button className="quiet" onClick={onClose}>{status === 'sending' ? '取消等待' : '取消'}</button></div></> : <p role="status" className="notice">回報已送出，感謝協助改善辨識。<br/>收據編號：{receipt}</p>}
      {error && <p role="alert" className="notice error">{error}</p>}
    </div>
  </dialog>;
}
