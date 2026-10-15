import type { Species } from './model';
const paths: Record<Species, string> = {
  mammoth: 'M9 28 Q2 8 16 8 Q27 4 30 16 L30 29 Q30 36 24 32 L24 20 M10 15 Q2 10 5 24 Q9 31 15 23 M16 29 L16 34 M9 29 L9 34',
  lion: 'M20 3 L25 7 L31 7 L32 13 L36 19 L32 25 L31 32 L25 33 L20 37 L15 33 L9 32 L8 25 L4 19 L8 13 L9 7 L15 7 Z M14 16 L15 17 M25 16 L24 17 M17 23 L23 23 L20 26 Z M15 29 Q20 33 25 29',
  wolf: 'M8 6 L16 13 L24 13 L32 6 L30 27 L20 35 L10 27 Z M14 20 L16 21 M26 20 L24 21 M17 28 L23 28 L20 31 Z',
  rat: 'M12 17 C0 16 4 2 12 6 Q17 7 17 14 L23 14 Q23 5 30 6 C40 10 33 20 28 17 Q34 28 20 35 Q5 29 12 17 M15 22 L15 23 M25 22 L25 23 M18 29 L22 29 M10 27 L3 24 M30 27 L37 24',
};
export function BeastIcon({ species }: { species: Species | null }) {
  return species ? <svg viewBox="0 0 40 40" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d={paths[species]} /></svg> : <span aria-hidden="true">?</span>;
}
