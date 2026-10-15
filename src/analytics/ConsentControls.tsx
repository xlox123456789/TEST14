import { useEffect, useState } from 'react';
import { debugEnabled, getConsent, initializeAnalytics, setConsent } from './analytics';
export function ConsentControls() {
  const [value, setValue] = useState(getConsent);
  const [open, setOpen] = useState(value === null);
  const [events, setEvents] = useState<object[]>([]);
  useEffect(() => { const listener = (event: Event) => setEvents(old => [...old.slice(-29), (event as CustomEvent).detail]); window.addEventListener('test14-analytics-event',listener); return () => window.removeEventListener('test14-analytics-event',listener); }, []);
  useEffect(() => { initializeAnalytics(); const update = () => setValue(getConsent()); window.addEventListener('test14-consent', update); return () => window.removeEventListener('test14-consent', update); }, []);
  return <div className="analytics-consent">
    <button className="info-trigger" onClick={() => setOpen(!open)}>分析統計設定</button>
    {open && <div className="consent-content" role="region" aria-label="分析統計同意設定"><p>是否同意使用 GA4 統計網站瀏覽及操作？Google 可能使用 Cookie 與連線／裝置資料；不傳送圖片、影片、盤面、名稱或檔案路徑。拒絕不影響功能，可隨時停用。</p>
      <p>目前：{value === 'granted' ? '已同意' : value === 'denied' ? '已拒絕' : '尚未選擇，未啟用追蹤'}</p>
      <button className="secondary" onClick={() => { setConsent('granted'); setOpen(false); }}>同意分析統計</button> <button className="quiet" onClick={() => { setConsent('denied'); setOpen(false); }}>拒絕／停用分析</button></div>}
    {debugEnabled() && <details><summary>GA4 偵錯事件（送入 gtag，不代表伺服器已收件）</summary><pre>{JSON.stringify(events,null,2)}</pre></details>}
  </div>;
}
