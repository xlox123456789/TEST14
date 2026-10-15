import { currentVersion } from '../releases';
export const EVENTS = ['capture_started', 'capture_completed', 'capture_failed', 'board_analysis_requested', 'board_recognition_completed', 'board_recognition_failed', 'manual_correction_saved', 'video_imported', 'video_frame_analyzed', 'error_report_submitted'] as const;
export type AnalyticsEvent = typeof EVENTS[number];
type Params = { operation_result?: 'success' | 'failed'; analysis_mode?: 'screenshot' | 'video'; correction_count?: number; processing_time_ms?: number };
const KEY = 'test14-analytics-consent-v1';
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: `ga-disable-${string}`]: boolean };
const w = () => window as unknown as AnalyticsWindow;
let initialized = false, viewed = false;
export function getConsent(): 'granted' | 'denied' | null { try { const value = localStorage.getItem(KEY); return value === 'granted' || value === 'denied' ? value : null; } catch { return null; } }
export function eligible() {
  return import.meta.env.PROD && import.meta.env.MODE !== 'test' && location.origin === 'https://xlox123456789.github.io' && location.pathname === '/TEST14/' && (!navigator.webdriver || debugEnabled()) && !new URLSearchParams(location.search).has('no_analytics') && /^G-[A-Z0-9]+$/.test(import.meta.env.VITE_GA_MEASUREMENT_ID ?? '');
}
export function debugEnabled() { return new URLSearchParams(location.search).get('analytics_debug') === '1'; }
export function initializeAnalytics() {
  if (!eligible() || getConsent() !== 'granted') return;
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  w()[`ga-disable-${id}`] = false;
  if (!initialized) {
    initialized = true;
    w().dataLayer = w().dataLayer ?? [];
    w().gtag = function () { w().dataLayer!.push(arguments); };
    w().gtag!('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    w().gtag!('js', new Date());
    w().gtag!('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_prefix: 'test14', cookie_path: '/TEST14/', cookie_domain: 'none', cookie_expires: 60 * 60 * 24 * 30,
      page_location: 'https://xlox123456789.github.io/TEST14/', page_referrer: '', page_title: 'Tartarus Planner', ...(debugEnabled() ? { debug_mode: true } : {}) });
    const script = document.createElement('script'); script.id = 'test14-gtag'; script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; document.head.append(script);
  }
  if (!viewed) { viewed = true; w().gtag!('event', 'page_view', { page_location: 'https://xlox123456789.github.io/TEST14/', page_referrer: '', page_title: 'Tartarus Planner', app_version: currentVersion }); if (debugEnabled()) window.dispatchEvent(new CustomEvent('test14-analytics-event',{detail:{event:'page_view'}})); }
}
export function setConsent(value: 'granted' | 'denied') {
  try { localStorage.setItem(KEY, value); } catch { /* Storage-disabled browsers retain the safe default. */ }
  if (value === 'granted') initializeAnalytics();
  else {
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
    w()[`ga-disable-${id}`] = true;
    document.getElementById('test14-gtag')?.remove();
    initialized = false;
    // Disable before updating consent: no cookieless pings before/after denial.
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (name.startsWith('test14_ga')) document.cookie = `${name}=;Max-Age=0;path=/TEST14/;SameSite=Lax;Secure`;
    }
  }
  window.dispatchEvent(new Event('test14-consent'));
}
export function track(event: AnalyticsEvent, params: Params = {}) {
  if (!EVENTS.includes(event) || !eligible() || getConsent() !== 'granted') return;
  initializeAnalytics();
  // Explicit allowlist: never forward arbitrary caller data, filenames, errors or boards.
  const safe: Record<string, string | number> = { app_version: currentVersion };
  if (params.operation_result === 'success' || params.operation_result === 'failed') safe.operation_result = params.operation_result;
  if (params.analysis_mode === 'screenshot' || params.analysis_mode === 'video') safe.analysis_mode = params.analysis_mode;
  for (const key of ['correction_count', 'processing_time_ms'] as const) if (Number.isFinite(params[key]) && params[key]! >= 0) safe[key] = Math.min(3_600_000, Math.round(params[key]!));
  w().gtag?.('event', event, safe);
  if (debugEnabled()) window.dispatchEvent(new CustomEvent('test14-analytics-event',{detail:{event,...safe}}));
}
