import { useEffect, useRef, useState } from 'react';
import { captureFrame, shareError, type Snapshot } from './frame';
import { track as trackAnalytics } from '../analytics/analytics';

export function useScreenCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const urlRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'sharing'>('idle');
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const supported = typeof window !== 'undefined' && window.isSecureContext && !!navigator.mediaDevices?.getDisplayMedia;

  function release() {
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    if (videoRef.current) videoRef.current.srcObject = null;
  }
  function stop() { generation.current++; release(); setStatus('idle'); setError(''); }
  async function start() {
    if (busy.current) return;
    if (!supported) { setError('需要 HTTPS（本機可使用 localhost），並使用支援畫面分享的 Chrome 或 Edge。'); return; }
    busy.current = true;
    const token = ++generation.current;
    release(); setStatus('requesting'); setError('');
    try {
      // Must remain directly within the click handler: browsers require user activation.
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (token !== generation.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState === 'ended') throw new Error('分享來源沒有可用的影像軌道，請重新選擇。');
      track.onended = () => {
        if (token !== generation.current) return;
        generation.current++; release(); setStatus('idle'); setError('畫面分享已中斷，請按「開始分享」重新授權。');
      };
      const video = videoRef.current;
      if (!video) throw new Error('影像元件尚未就緒，請重試。');
      video.srcObject = stream;
      await video.play();
      if (token === generation.current) { setStatus('sharing'); trackAnalytics('capture_started', { operation_result: 'success', analysis_mode: 'screenshot' }); }
    } catch (cause) {
      if (token === generation.current) { release(); setStatus('idle'); setError(shareError(cause)); }
    } finally { busy.current = false; }
  }
  const captureBusy = useRef(false);
  async function capture() {
    if (captureBusy.current || status !== 'sharing' || !videoRef.current) return;
    captureBusy.current = true; setCapturing(true); setError('');
    trackAnalytics('board_analysis_requested', { analysis_mode: 'screenshot' });
    const token = generation.current;
    try {
      const result = await captureFrame(videoRef.current);
      if (token !== generation.current) { URL.revokeObjectURL(result.url); return; }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = result.url; setSnapshot(result);
      trackAnalytics('capture_completed', { operation_result: 'success', analysis_mode: 'screenshot' });
    } catch (cause) {
      if (token === generation.current) { setError(cause instanceof Error ? cause.message : '無法取得影像，請重新分享。'); trackAnalytics('capture_failed', { operation_result: 'failed', analysis_mode: 'screenshot' }); }
    } finally { captureBusy.current = false; setCapturing(false); }
  }
  useEffect(() => () => {
    generation.current++; release();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);
  return { videoRef, supported, status, capturing, error, snapshot, start, stop, capture };
}
