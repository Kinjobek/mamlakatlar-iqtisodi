#!/usr/bin/env node
/**
 * UN Comtrade Plus — tashqi savdo ma'lumotlari (AG6) yuklovchi
 *
 * Har bir davlat uchun (so'nggi mavjud yil):
 *   - hamkorlar kesimi (eksport/import, TOTAL)
 *   - mahsulotlar kesimi (AG6, 6 xonali HS kodlari, Jahon hamkori)
 *
 * Chegara: bepul obuna — 500 so'rov/kun, 1 so'rov/sekund.
 *   → davlatga ~4 so'rov; bir ishga tushirishda --limit (standart 60) davlat.
 *   → qayta ishga tushirishda mavjud fayllar o'tkazib yuboriladi (davom ettirish).
 *
 * Ishga tushirish:  node scripts/fetch-comtrade.mjs [--limit 60] [--force] [--only UZB,KAZ]
 * Kalit:            .env faylda COMTRADE_KEY=... yoki muhit o'zgaruvchisi
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'data/comtrade');
const RAW = resolve(ROOT, 'data/raw');
mkdirSync(OUT, { recursive: true });
mkdirSync(RAW, { recursive: true });

/* ---- .env (dependency'siz) ---- */
if (existsSync(resolve(ROOT, '.env'))) {
  for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const KEY = process.env.COMTRADE_KEY;
if (!KEY) {
  console.error('✗ COMTRADE_KEY topilmadi. .env faylga yozing: COMTRADE_KEY=...');
  process.exit(1);
}

/* ---- argumentlar ---- */
const args = process.argv.slice(2);
const force = args.includes('--force');
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg > -1 ? parseInt(args[limitArg + 1], 10) : 60;
const onlyArg = args.indexOf('--only');
const ONLY = onlyArg > -1 ? args[onlyArg + 1].split(',').map((s) => s.trim().toUpperCase()) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- davlatlar (bizning katalog) ---- */
const countries = JSON.parse(readFileSync(resolve(ROOT, 'data/countries.json'), 'utf8'));
const byIso = new Map(countries.map((c) => [c.iso3, c]));

/* ---- referens kataloglar (kalit talab qilmaydi) ---- */
async function ensureRefs() {
  for (const [name, url] of [
    ['Reporters.json', 'https://comtradeapi.un.org/files/v1/app/reference/Reporters.json'],
    ['H6.json', 'https://comtradeapi.un.org/files/v1/app/reference/H6.json']
  ]) {
    const p = resolve(RAW, name);
    if (!existsSync(p) || force) {
      console.log(`→ Referens: ${name} yuklanmoqda...`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
      writeFileSync(p, await res.text());
    }
  }
  const rep = JSON.parse(readFileSync(resolve(RAW, 'Reporters.json'), 'utf8'));
  const repArr = Array.isArray(rep) ? rep : rep.results || [];
  const partnerMap = {};
  for (const r of repArr) {
    partnerMap[r.reporterCode] = {
      iso3: r.reporterCodeIsoAlpha3 || null,
      nameEn: r.reporterDesc || r.text,
      isGroup: !!r.isGroup
    };
  }
  const h6 = JSON.parse(readFileSync(resolve(RAW, 'H6.json'), 'utf8'));
  const h6Arr = Array.isArray(h6) ? h6 : h6.results || [];
  const hs6 = {};
  for (const c of h6Arr) hs6[String(c.id)] = c.text;
  hs6['999999'] ??= '999999 - Commodities not elsewhere specified';
  hs6['TOTAL'] ??= 'TOTAL - Jami';
  return { partnerMap, hs6 };
}

/* ---- API so'rovi (1 so'rov/sekund, retry bilan) ---- */
let lastCall = 0;
async function comtradeGet(params, tries = 3) {
  const wait = Math.max(0, 1100 - (Date.now() - lastCall));
  await sleep(wait);
  const qs = new URLSearchParams({ ...params, 'subscription-key': KEY });
  const url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?${qs}`;
  for (let i = 1; i <= tries; i++) {
    lastCall = Date.now();
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.status === 429) {
        console.log('  … 429 (limit), 20 s kutamiz');
        await sleep(20000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { count: json.count ?? 0, rows: json.data ?? [] };
    } catch (e) {
      if (i === tries) throw e;
      await sleep(3000 * i);
    }
  }
}

/* ---- davlat uchun to'liq ma'lumot ---- */
async function fetchCountry(iso3, partnerMap, hs6) {
  const code = parseInt(Object.entries(partnerMap).find(([, p]) => p.iso3 === iso3)?.[0], 10);
  if (!Number.isFinite(code)) throw new Error(`${iso3} uchun Comtrade kodi topilmadi`);

  const YEARS = [2024, 2023, 2022];
  let year = null;
  let partnerRowsX = null;
  let worldX = null;
  for (const y of YEARS) {
    const r = await comtradeGet({
      reporterCode: String(code),
      period: String(y),
      flowCode: 'X',
      cmdCode: 'TOTAL',
      maxRecords: '500'
    });
    if (r.count === 0) {
      console.log(`  ${y}: ma'lumot yo'q, ${y - 1} sinanadi`);
      continue;
    }
    year = y;
    partnerRowsX = r.rows;
    worldX = r.rows.find((row) => row.partnerCode === 0);
    break;
  }
  if (!year) throw new Error('2022-2024 da ma\'lumot topilmadi');

  const rM = await comtradeGet({
    reporterCode: String(code),
    period: String(year),
    flowCode: 'M',
    cmdCode: 'TOTAL',
    maxRecords: '500'
  });
  const partnerRowsM = rM.rows;
  const worldM = partnerRowsM.find((row) => row.partnerCode === 0);

  const totX = worldX?.primaryValue ?? 0;
  const totM = worldM?.primaryValue ?? 0;

  /* hamkorlar jadvali */
  const byPartner = new Map();
  for (const row of partnerRowsX) {
    if (row.partnerCode === 0) continue;
    byPartner.set(row.partnerCode, { code: row.partnerCode, x: row.primaryValue ?? 0, m: 0 });
  }
  for (const row of partnerRowsM) {
    if (row.partnerCode === 0) continue;
    const p = byPartner.get(row.partnerCode) ?? { code: row.partnerCode, x: 0, m: 0 };
    p.m = row.primaryValue ?? 0;
    byPartner.set(row.partnerCode, p);
  }
  const partners = [...byPartner.values()]
    .map((p) => {
      const ref = partnerMap[p.code];
      const our = ref?.iso3 ? byIso.get(ref.iso3) : null;
      return {
        code: p.code,
        iso3: ref?.iso3 ?? null,
        name: our?.nameUz ?? ref?.nameEn ?? `Kod ${p.code}`,
        x: p.x,
        m: p.m,
        balance: p.x - p.m,
        shareX: totX ? (p.x / totX) * 100 : 0,
        shareM: totM ? (p.m / totM) * 100 : 0
      };
    })
    .sort((a, b) => b.x + b.m - (a.x + a.m));

  /* AG6 mahsulotlar (Jahon hamkori) — top-100 saqlanadi (sahifada ko'rsatiladigan miqdor) */
  async function products(flow) {
    const r = await comtradeGet({
      reporterCode: String(code),
      period: String(year),
      flowCode: flow,
      partnerCode: '0',
      cmdCode: 'AG6',
      maxRecords: '20000'
    });
    const total = flow === 'X' ? totX : totM;
    const all = r.rows
      .map((row) => {
        const codeStr = String(row.cmdCode);
        return {
          code: codeStr,
          name: hs6[codeStr] ?? `HS ${codeStr}`,
          value: row.primaryValue ?? 0,
          share: total ? ((row.primaryValue ?? 0) / total) * 100 : 0
        };
      })
      .sort((a, b) => b.value - a.value);
    return { top: all.slice(0, 100), count: all.length };
  }
  const px = await products('X');
  const pm = await products('M');

  const out = {
    iso3,
    comtradeCode: code,
    year,
    totals: { x: totX, m: totM, balance: totX - totM },
    partnerCount: partners.length,
    partners,
    products: { x: px.top, m: pm.top, xCount: px.count, mCount: pm.count },
    source: 'UN Comtrade Plus',
    fetchedAt: new Date().toISOString()
  };
  writeFileSync(resolve(OUT, `${iso3}.json`), JSON.stringify(out, null, 1));
  console.log(
    `  ✓ ${iso3} (${year}): eksport $${Math.round(totX / 1e9 * 10) / 10} mlrd, import $${Math.round(totM / 1e9 * 10) / 10} mlrd, ${partners.length} hamkor, ${px.count}+${pm.count} mahsulot (top-300 saqlandi)`
  );
}

/* ---- boshqaruv ---- */
async function main() {
  const { partnerMap, hs6 } = await ensureRefs();
  writeFileSync(
    resolve(OUT, '_refs.json'),
    JSON.stringify({ partners: partnerMap, hs6 }, null, 0)
  );

  const PRIORITY = [
    'UZB', 'KAZ', 'KGZ', 'TJK', 'TKM', 'RUS', 'CHN', 'TUR', 'AFG', 'PAK',
    'IRN', 'IND', 'KOR', 'JPN', 'DEU', 'FRA', 'ITA', 'NLD', 'POL', 'GBR',
    'USA', 'BLR', 'UKR', 'MDA', 'GEO', 'AZE', 'ARM', 'VNM', 'THA', 'IDN',
    'MYS', 'BGD', 'SAU', 'ARE', 'ISR', 'EGY', 'BRA', 'MEX', 'CAN', 'CHE',
    'SWE', 'BEL', 'AUT', 'CZE', 'HUN', 'ROU', 'ESP', 'PRT', 'GRC', 'BGR',
    'EST', 'LVA', 'LTU', 'FIN', 'DNK', 'ZAF', 'NGA', 'ETH', 'KEN', 'MAR'
  ];
  const list = ONLY ?? PRIORITY;
  const queue = list.filter((iso3) => {
    if (ONLY || force) return true;
    return !existsSync(resolve(OUT, `${iso3}.json`));
  });

  console.log(`Navbat: ${queue.length} davlat (limit ${LIMIT})`);
  let done = 0;
  const failed = [];
  for (const iso3 of queue) {
    if (done >= LIMIT) {
      console.log(`Limit (${LIMIT}) tugadi — qolganlari keyingi ishga tushirishda.`);
      break;
    }
    console.log(`→ ${iso3}...`);
    try {
      await fetchCountry(iso3, partnerMap, hs6);
      done++;
    } catch (e) {
      failed.push(`${iso3}: ${e.message}`);
      console.log(`  ✗ ${e.message}`);
    }
  }
  console.log('\n=== YAKUN ===');
  console.log(`Yuklandi: ${done} davlat. Jami fayllar: ${readdirSync(OUT).filter((f) => f.endsWith('.json') && !f.startsWith('_')).length}`);
  if (failed.length) console.log('Xatolar:\n  ' + failed.join('\n  '));
}

main();
