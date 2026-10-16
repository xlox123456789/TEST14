import { beforeEach, afterEach, expect, it, vi } from 'vitest';
beforeEach(() => {
  vi.resetModules(); localStorage.clear(); document.head.querySelector('#test14-gtag')?.remove();
  delete (window as unknown as Record<string,unknown>).gtag; delete (window as unknown as Record<string,unknown>).dataLayer;
  vi.stubEnv('PROD',true); vi.stubEnv('MODE','production'); vi.stubEnv('VITE_GA_MEASUREMENT_ID','G-TEST000001');
  vi.stubGlobal('location',new URL('https://xlox123456789.github.io/TEST14/'));
  Object.defineProperty(navigator,'webdriver',{ configurable:true, value:false });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const layer = () => (window as unknown as {dataLayer?: ArrayLike<unknown>[]}).dataLayer?.map(v=>Array.from(v)) ?? [];
it('automatically initializes production analytics without a consent choice', async () => {
  const a = await import('../analytics/analytics'); a.initializeAnalytics(); a.track('capture_completed');
  expect(document.querySelector('#test14-gtag')).not.toBeNull();
  expect(layer().some(e=>e[1]==='capture_completed')).toBe(true);
  expect(localStorage.length).toBe(0);
});
it('ignores the retired consent setting and initializes only once across StrictMode', async () => {
  localStorage.setItem('test14-analytics-consent-v1','denied');
  const a = await import('../analytics/analytics'); a.initializeAnalytics(); a.initializeAnalytics();
  expect(document.querySelectorAll('#test14-gtag')).toHaveLength(1);
  expect(layer().filter(e=>e[0]==='event' && e[1]==='page_view')).toHaveLength(1);
  expect(layer().find(e=>e[0]==='config')?.[2]).toMatchObject({ send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false, page_referrer:'' });
});
it('strips arbitrary sensitive parameters from automatic analytics', async () => {
  const a = await import('../analytics/analytics');
  a.track('video_imported', { analysis_mode:'video', processing_time_ms:1.5, filename:'private.mp4', board:{secret:1}, error:'private' } as never);
  const event = layer().at(-1); expect(event?.[2]).toMatchObject({ analysis_mode:'video', processing_time_ms:2 });
  expect(JSON.stringify(event)).not.toMatch(/private|secret|filename/);
});
it.each(['http://localhost:5173/TEST14/','https://xlox123456789.github.io/TEST14/?no_analytics=1','https://example.com/TEST14/','https://xlox123456789.github.io/other/'])('excludes development, previews and explicit opt-out: %s', async url => {
  vi.stubGlobal('location',new URL(url)); const a = await import('../analytics/analytics'); a.initializeAnalytics(); a.track('video_imported'); expect(layer()).toHaveLength(0);
});
it('excludes automated tests, invalid IDs and unrecognized event names', async () => {
  const a = await import('../analytics/analytics'); Object.defineProperty(navigator,'webdriver',{ configurable:true,value:true }); a.initializeAnalytics(); expect(layer()).toHaveLength(0);
  Object.defineProperty(navigator,'webdriver',{ configurable:true,value:false }); vi.stubEnv('VITE_GA_MEASUREMENT_ID','fake'); a.initializeAnalytics(); expect(layer()).toHaveLength(0);
  vi.stubEnv('VITE_GA_MEASUREMENT_ID','G-TEST000001'); a.track('unrecognized_event' as never); expect(layer()).toHaveLength(0);
});
