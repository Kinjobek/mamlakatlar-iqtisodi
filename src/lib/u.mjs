/** Ichki havolalar uchun baza prefiksi (GitHub Pages: /mamlakatlar-iqtisodi). */
export const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
export const u = (p) => (p === '/' ? `${BASE}/` : `${BASE}${p}`);
