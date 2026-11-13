import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cache = new Map();

/** Boshqaruv "past bo'lsa yaxshi" ko'rsatkichlari — reyting teskari hisoblanadi. */
export const LOWER_BETTER = new Set([
  'ishsizlik',
  'yoshlar-ishsizligi',
  'inflyatsiya',
  'gini',
  'qashshoqlik',
  'bola-olimi',
  'qotilliklar',
  'davlat-qarzi',
  'taqchillik',
  'olim-darajasi',
  'co2',
  'kredit-stavkasi',
  'depozit-stavkasi',
  'valyuta-kursi',
  'real-foiz-stavkasi',
  'pul-massasi-osishi',
  'yaim-deflyatori',
  'effektiv-kurs'
]);

function readJSON(rel) {
  if (!cache.has(rel)) {
    cache.set(rel, JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')));
  }
  return cache.get(rel);
}

export function getCountries() {
  return readJSON('data/countries.json');
}

export function getCatalog() {
  return readJSON('data/indicators-catalog.json');
}

export function getCapitals() {
  return readJSON('data/uz-capitals.json');
}

const indicatorFile = (code) =>
  code.startsWith('IMF.')
    ? `data/imf/${code.slice(4)}.json`
    : code.startsWith('OWID.')
      ? `data/owid/${code.slice(5)}.json`
      : `data/wb/${code}.json`;

export function loadSeries(code) {
  try {
    return readJSON(indicatorFile(code));
  } catch {
    return null;
  }
}

export function latestOf(series, capYear) {
  if (!series || series.length === 0) return null;
  let last = series[series.length - 1];
  if (capYear) {
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i][0] <= capYear) { last = series[i]; break; }
    }
  }
  return { year: last[0], value: last[1] };
}

/**
 * Butun sayt uchun ko'rsatkichlar reyestri: har bir ko'rsatkich uchun
 * so'nggi qiymatlar, reytinglar va seriyalar.
 */
let _registry = null;
export function registry() {
  if (_registry) return _registry;
  const catalog = getCatalog();
  const countries = getCountries();
  const capitals = getCapitals();
  const agg = new Set(countries.filter((c) => c.isAggregate).map((c) => c.iso3));
  const byIso = new Map(countries.map((c) => [c.iso3, c]));
  const CAP_YEAR = new Date().getFullYear(); // prognoz yillari reytingga kirmaydi

  const indicators = [];
  const missing = [];
  for (const cat of catalog.indicators) {
    const raw = loadSeries(cat.code);
    if (!raw || !raw.data || Object.keys(raw.data).length === 0) {
      missing.push(cat.code);
      continue;
    }
    const latest = {};
    for (const [iso3, series] of Object.entries(raw.data)) {
      if (!byIso.has(iso3)) continue; // faqat ma'lum davlatlar (agregat kodlar tashqarida)
      const l = latestOf(series, CAP_YEAR);
      if (l && l.value != null && Number.isFinite(l.value)) latest[iso3] = l;
    }
    const entries = Object.entries(latest).filter(([iso3]) => !agg.has(iso3));
    const lowerBetter = LOWER_BETTER.has(cat.slug);
    entries.sort((a, b) => (lowerBetter ? a[1].value - b[1].value : b[1].value - a[1].value));
    const rank = new Map(entries.map(([iso3], i) => [iso3, i + 1]));
    indicators.push({
      ...cat,
      rawName: raw.nameEn,
      latest,
      rank,
      rankedTotal: entries.length,
      lowerBetter,
      series: raw.data
    });
  }

  _registry = {
    catalog,
    countries,
    capitals,
    byIso,
    aggregates: agg,
    indicators,
    bySlug: new Map(indicators.map((i) => [i.slug, i])),
    missing
  };
  return _registry;
}

/* ---------- Son formatlash (o'zbekcha) ---------- */

function groupDigits(intStr) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

export function fmtNum(v, dec = 0) {
  if (v == null || !Number.isFinite(v)) return '—';
  const neg = v < 0;
  const fixed = Math.abs(v).toFixed(dec);
  const [i, f] = fixed.split('.');
  let out = groupDigits(i);
  if (f) out += ',' + f;
  return (neg ? '−' : '') + out;
}

export function fmtMoney(v, dec) {
  if (v == null || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e12) return fmtNum(v / 1e12, 2) + '\u00A0trln\u00A0$';
  if (abs >= 1e9) return fmtNum(v / 1e9, 1) + '\u00A0mlrd\u00A0$';
  if (abs >= 1e6) return fmtNum(v / 1e6, 1) + '\u00A0mln\u00A0$';
  return fmtNum(v, dec ?? 0) + '\u00A0$';
}

const UNIT_SUFFIX = {
  '%': '%',
  '% YaIM': '%',
  'USD': null,
  'xalqaro dollar': null,
  'kishi': null,
  'ming kishi': null,
  'yil': null,
  'bola / ayol': null,
  'bola/ayol': null,
  'ball (0-100)': null,
  'indeks (0-1)': null,
  'indeks (2010 = 100)': null,
  "o'rin": null
};

export function fmtValue(ind, v) {
  if (v == null || !Number.isFinite(v)) return '—';
  const unit = ind.unit ?? '';
  if (unit === 'USD') return fmtMoney(v, ind.dec);
  if (unit === 'xalqaro dollar') return fmtMoney(v, ind.dec);
  const suffix = UNIT_SUFFIX[unit];
  if (suffix === '%') return fmtNum(v, ind.dec) + '%';
  if (suffix === '‰') return fmtNum(v, ind.dec) + '\u00A0‰';
  if (unit === 'ming tonna') return fmtNum(v, 0);
  if (unit === "o'rin") return fmtNum(v, 0) + "-o'rin";
  return fmtNum(v, ind.dec);
}

export function fmtDelta(v, dec = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  const s = fmtNum(Math.abs(v), dec);
  if (v === 0) return '0';
  return (v > 0 ? '+' : '−') + s;
}

/* ---------- Yordamchilar ---------- */

export function rankOf(ind, iso3) {
  const r = ind.rank.get(iso3);
  if (!r) return null;
  return { rank: r, total: ind.rankedTotal };
}

export function seriesOf(ind, iso3) {
  return ind.series[iso3] ?? null;
}

/** UZB boshqa davlatlar bilan solishtirganda ko'rsatiladigan davlat (standart) */
export const HOME_ISO = 'UZB';

export function countryUrl(c) {
  return `/davlatlar/${c.slug}`;
}

export function indicatorUrl(ind) {
  return `/korsatkichlar/${ind.slug}`;
}

export const MONTHS_UZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

export function siteDataDate() {
  const d = new Date();
  return `${d.getFullYear()}-yil ${MONTHS_UZ[d.getMonth()]}`;
}
