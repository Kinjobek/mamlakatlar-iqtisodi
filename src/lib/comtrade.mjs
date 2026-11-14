/* UN Comtrade Plus (AG6) tashqi savdo ma'lumotlari — yuklovchi */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'data/comtrade');

export function tradeFiles() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.json') && f.length === 8 && !f.startsWith('_'))
    .map((f) => f.slice(0, 3));
}

export function hasTrade(iso3) {
  return fs.existsSync(path.join(DIR, `${iso3}.json`));
}

export function loadTrade(iso3) {
  return JSON.parse(fs.readFileSync(path.join(DIR, `${iso3}.json`), 'utf8'));
}

/** Barcha mavjud davlatlar savdo xaritasi: iso3 → trade (to'liq) */
let _cache = null;
export function allTrade() {
  if (_cache) return _cache;
  const map = new Map();
  for (const iso3 of tradeFiles()) {
    try {
      map.set(iso3, loadTrade(iso3));
    } catch {
      /* fayl yarim yozilgan bo'lsa o'tkazib yuboradi */
    }
  }
  _cache = map;
  return map;
}
