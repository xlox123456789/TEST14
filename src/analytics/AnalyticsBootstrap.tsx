import { useEffect, useState } from 'react';
import { debugEnabled, initializeAnalytics } from './analytics';

export function Analytics() {
  const [events, setEvents] = useState<object[]>([]);
  useEffect(() => {
    const listener = (event: Event) => setEvents(old => [...old.slice(-29), (event as CustomEvent).detail]);
    window.addEventListener('test14-analytics-event', listener);
    return () => window.removeEventListener('test14-analytics-event', listener);
  }, []);
  useEffect(() => { initializeAnalytics(); }, []);
  if (!debugEnabled()) return null;
  return <details className="analytics-debug"><summary>GA4 偵錯事件（送入 gtag，不代表伺服器已收件）</summary><pre>{JSON.stringify(events, null, 2)}</pre></details>;
}
