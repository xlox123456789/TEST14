import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const KEY = 'test14-theme';
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* Browsers may block storage. */ }
  }, [theme]);
  return <div className="theme-toggle" role="group" aria-label="顯示模式">
    <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>深色</button>
    <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>淺色</button>
  </div>;
}
