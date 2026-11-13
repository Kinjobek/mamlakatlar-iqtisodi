#!/usr/bin/env node
/**
 * Ma'lumot quvuri — Mamlakatlar iqtisodi
 *
 * Bosqichlar:
 *   1. Davlatlar ro'yxati — World Bank API (1 ta so'rov)
 *   2. WDI bulk CSV — barcha ko'rsatkichlar bir arxivda (data/raw/)
 *   3. IMF DataMapper — davlat qarzi va byudjet taqchilligi
 *   4. OWID/UNDP — inson taraqqiyoti indeksi (HDI)
 *
 * Ishga tushirish: npm run data
 * Bulk arxivni oldindan yuklab qo'yish (tavsiya):
 *   curl -C - -o data/raw/WDI_CSV_2026_10_08.zip \
 *     "https://datacatalogfiles.worldbank.org/ddh-published/0037712/DR0095335/WDI_CSV_2026_10_08.zip"
 *   cd data/raw && unzip WDI_CSV_2026_10_08.zip
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline';
import fs from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'mamlakatlar-iqtisodi/0.1 (research; github.com/Kinjobek)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const catalog = JSON.parse(readFileSync(resolve(ROOT, 'data/indicators-catalog.json'), 'utf8'));
const uzMap = JSON.parse(readFileSync(resolve(ROOT, 'data/uz-countries.json'), 'utf8'));
const RAW = resolve(ROOT, 'data/raw');

mkdirSync(resolve(ROOT, 'data/wb'), { recursive: true });
mkdirSync(resolve(ROOT, 'data/imf'), { recursive: true });
mkdirSync(resolve(ROOT, 'data/owid'), { recursive: true });
mkdirSync(RAW, { recursive: true });

const BULK_URL =
  'https://datacatalogfiles.worldbank.org/ddh-published/0037712/DR0095335/WDI_CSV_2026_10_08.zip';

async function fetchJSON(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === tries) throw e;
      await sleep(1500 * i);
    }
  }
}

/* ---------- 1. Davlatlar ro'yxati ---------- */
async function fetchCountries() {
  console.log('→ Davlatlar roʻyxati yuklanmoqda...');
  const raw = await fetchJSON('https://api.worldbank.org/v2/country?format=json&per_page=400');
  const rows = raw[1] ?? [];
  const agg = new Set(uzMap.aggregates);
  const countries = [];
  for (const r of rows) {
    const iso3 = r.id;
    const isAgg = r.region?.id === 'NA';
    if (isAgg && !agg.has(iso3)) continue;
    const uz = uzMap.countries[iso3];
    if (!uz) {
      console.warn(`  ⚠ ${iso3} (${r.name}) uchun oʻzbekcha nom yoʻq — oʻtkazib yuborildi`);
      continue;
    }
    countries.push({
      iso3,
      iso2: r.iso2Code,
      nameUz: uz[0],
      nameEn: r.name,
      slug: uz[1],
      capitalEn: r.capitalCity,
      regionId: r.region?.id,
      regionUz: uzMap.regions[r.region?.id] ?? r.region?.value,
      incomeId: r.incomeLevel?.id,
      incomeUz: uzMap.income[r.incomeLevel?.id] ?? null,
      lat: parseFloat(r.longitude) || null,
      lng: parseFloat(r.latitude) || null,
      isAggregate: isAgg
    });
  }
  countries.sort((a, b) => a.nameUz.localeCompare(b.nameUz, 'uz'));
  writeFileSync(resolve(ROOT, 'data/countries.json'), JSON.stringify(countries, null, 1));
  console.log(`  ✓ ${countries.length} davlat saqlandi (data/countries.json)`);
}

/* ---------- 2. WDI bulk: yuklash ---------- */
function findWdiCsv() {
  if (!existsSync(RAW)) return null;
  for (const name of readdirSync(RAW)) {
    if (/^WDICSV\.csv$/i.test(name)) return resolve(RAW, name);
    // zip ichida boshqa nom bo'lishi mumkin
    if (/\.csv$/i.test(name) && /WDI/i.test(name)) return resolve(RAW, name);
  }
  return null;
}

async function ensureBulk() {
  if (findWdiCsv()) return;
  const zipPath = resolve(RAW, 'WDI_CSV_2026_10_08.zip');
  if (!existsSync(zipPath)) {
    console.log('→ WDI bulk arxivi yuklanmoqda (~270 MB)...');
    const res = spawnSync('curl', ['-sS', '-C', '-', '-o', zipPath, BULK_URL], {
      stdio: 'inherit'
    });
    if (res.status !== 0) throw new Error('WDI arxivini yuklash muvaffaqiyatsiz tugadi');
  }
  console.log('→ Arxiv ochilmoqda...');
  const r = spawnSync('unzip', ['-o', '-q', 'WDI_CSV_2026_10_08.zip'], { cwd: RAW, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('unzip muvaffaqiyatsiz');
  const csv = findWdiCsv();
  if (!csv) throw new Error('WDICSV.csv topilmadi');
}

/* ---------- 2b. WDI bulk: tahlil (streaming) ---------- */

/** CSV qatorini vergulga ajratadi (qo'shtirnoq ichidagi vergullarni hisobga oladi). */
function splitCSVLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function parseWdi() {
  const csvPath = findWdiCsv();
  if (!csvPath) throw new Error('WDICSV.csv topilmadi — ensureBulk() ishlamadi');
  const wanted = new Map(catalog.indicators.filter((i) => i.source === 'World Bank').map((i) => [i.code, i]));
  const nameEn = {};
  const data = {}; // code -> iso3 -> [[year, value], ...]

  const firstLine = fs.readFileSync(csvPath, 'utf8').slice(0, 2000).split('\n')[0].replace(/^\uFEFF/, '');
  const cols = firstLine.split(',');
  const WIDE = /^\d{4}$/.test(cols[4] ?? '');
  console.log(`→ WDI tahlili (${WIDE ? 'keng' : 'uzun'} format, ${wanted.size} ko'rsatkich)...`);

  // kerakli kodlar uchun tezkor regex filtr
  const alt = [...wanted.keys()].map((c) => c.replace(/\./g, '\\.')).join('|');
  const lineFilter = new RegExp(`"(?:${alt})"`);

  const wideCols = WIDE
    ? cols
        .map((c, idx) => ({ idx, year: parseInt(c, 10) }))
        .filter((c) => Number.isFinite(c.year) && c.idx >= 4)
    : [];

  const rl = readline.createInterface({ input: fs.createReadStream(csvPath, 'utf8'), crlfDelay: Infinity });
  let n = 0;
  let hit = 0;
  for await (const line of rl) {
    n++;
    if (n === 1) continue; // sarlavha
    if (!lineFilter.test(line)) continue;
    hit++;
    const parts = splitCSVLine(line);
    if (WIDE) {
      const code = parts[3];
      if (!wanted.has(code)) continue;
      const iso3 = parts[1];
      nameEn[code] ??= parts[2];
      const row = (data[code] ??= {})[iso3] ??= [];
      for (const { idx, year } of wideCols) {
        const raw = parts[idx];
        if (raw === '' || raw == null) continue;
        const v = parseFloat(raw);
        if (Number.isFinite(v)) row.push([year, v]);
      }
    } else {
      const code = parts[3];
      if (!wanted.has(code)) continue;
      const iso3 = parts[1];
      const year = parseInt(parts[4], 10);
      const v = parseFloat(parts[5]);
      if (Number.isFinite(v) && Number.isFinite(year)) {
        nameEn[code] ??= parts[2];
        ((data[code] ??= {})[iso3] ??= []).push([year, v]);
      }
    }
    if (hit % 10_000 === 0) console.log(`  ... ${hit.toLocaleString('en-US')} mos qator tahlil qilindi`);
  }
  console.log(`  ... jami ${n.toLocaleString('en-US')} qator, ${hit.toLocaleString('en-US')} mos qator`);

  const failed = [];
  for (const [code] of wanted) {
    if (!data[code]) {
      failed.push(code);
      continue;
    }
    for (const iso3 of Object.keys(data[code])) {
      data[code][iso3].sort((a, b) => a[0] - b[0]);
    }
    writeFileSync(
      resolve(ROOT, `data/wb/${code}.json`),
      JSON.stringify({ code, nameEn: nameEn[code], data: data[code], fetchedAt: new Date().toISOString() })
    );
  }
  console.log(`  ✓ ${Object.keys(data).length}/${wanted.size} ko'rsatkich saqlandi`);
  if (failed.length) console.log('  ⚠ topilmadi: ' + failed.join(', '));
  return failed;
}

/* ---------- 3. IMF DataMapper ---------- */
async function fetchIMF(code) {
  console.log(`→ IMF: ${code}...`);
  const raw = await fetchJSON(`https://www.imf.org/external/datamapper/api/v1/${code}`);
  const vals = raw?.values?.[code] ?? {};
  const data = {};
  for (const [iso3, years] of Object.entries(vals)) {
    const arr = Object.entries(years)
      .map(([y, v]) => [parseInt(y, 10), v])
      .filter(([, v]) => v != null);
    if (arr.length) data[iso3] = arr.sort((a, b) => a[0] - b[0]);
  }
  if (!Object.keys(data).length) throw new Error('boʻsh javob');
  writeFileSync(
    resolve(ROOT, `data/imf/${code}.json`),
    JSON.stringify({ code, nameEn: code, data, fetchedAt: new Date().toISOString() }, null, 1)
  );
  console.log(`  ✓ ${Object.keys(data).length} davlat saqlandi`);
}

/* ---------- 4. OWID HDI (UNDP) ---------- */
async function fetchHDI() {
  console.log('→ UNDP HDI (OWID orqali)...');
  const url = 'https://ourworldindata.org/grapher/human-development-index.csv?v=1&csvType=full';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const codeIdx = header.findIndex((h) => h === 'Code');
  const yearIdx = header.findIndex((h) => h === 'Year');
  const valIdx = header.findIndex((h) => /human development/i.test(h));
  if (codeIdx < 0 || yearIdx < 0 || valIdx < 0) throw new Error('CSV ustunlari topilmadi');
  const data = {};
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    const iso3 = cols[codeIdx];
    const v = parseFloat(cols[valIdx]);
    if (!/^[A-Z]{3}$/.test(iso3) || !Number.isFinite(v)) continue;
    (data[iso3] ??= []).push([parseInt(cols[yearIdx], 10), v]);
  }
  for (const iso3 of Object.keys(data)) data[iso3].sort((a, b) => a[0] - b[0]);
  writeFileSync(
    resolve(ROOT, 'data/owid/HDI.json'),
    JSON.stringify({ code: 'OWID.HDI', nameEn: 'Human Development Index', data, fetchedAt: new Date().toISOString() }, null, 1)
  );
  console.log(`  ✓ HDI: ${Object.keys(data).length} davlat saqlandi`);
}

/* ---------- 4b. OWID CO2 (Global Carbon Budget) ---------- */
async function fetchCO2() {
  console.log('→ CO2 jon boshiga (OWID / Global Carbon Budget)...');
  const url = 'https://ourworldindata.org/grapher/co-emissions-per-capita.csv?v=1&csvType=full';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const codeIdx = header.findIndex((h) => h === 'Code');
  const yearIdx = header.findIndex((h) => h === 'Year');
  const valIdx = header.findIndex((h) => /CO₂|CO2/i.test(h));
  if (codeIdx < 0 || yearIdx < 0 || valIdx < 0) throw new Error('CSV ustunlari topilmadi');
  const data = {};
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    const iso3 = cols[codeIdx];
    const v = parseFloat(cols[valIdx]);
    if (!/^[A-Z]{3}$/.test(iso3) || !Number.isFinite(v)) continue;
    (data[iso3] ??= []).push([parseInt(cols[yearIdx], 10), v]);
  }
  for (const iso3 of Object.keys(data)) data[iso3].sort((a, b) => a[0] - b[0]);
  writeFileSync(
    resolve(ROOT, 'data/owid/CO2_PC.json'),
    JSON.stringify({ code: 'OWID.CO2_PC', nameEn: 'CO2 emissions per capita', data, fetchedAt: new Date().toISOString() }, null, 1)
  );
  console.log(`  ✓ CO2: ${Object.keys(data).length} davlat saqlandi`);
}

/* ---------- Boshqaruv ---------- */
async function main() {
  const failed = [];
  await fetchCountries();
  try {
    await ensureBulk();
    await parseWdi();
  } catch (e) {
    failed.push({ step: 'WDI', error: String(e) });
  }
  try { await fetchIMF('GGXWDG_NGDP'); } catch (e) { failed.push({ code: 'IMF.GGXWDG_NGDP', error: String(e) }); }
  try { await fetchIMF('GGXCNL_NGDP'); } catch (e) { failed.push({ code: 'IMF.GGXCNL_NGDP', error: String(e) }); }
  try { await fetchHDI(); } catch (e) { failed.push({ code: 'OWID.HDI', error: String(e) }); }
  try { await fetchCO2(); } catch (e) { failed.push({ code: 'OWID.CO2_PC', error: String(e) }); }

  console.log('\n=== YAKUN ===');
  if (failed.length) {
    console.log('Muvaffaqiyatsiz qadamlar:');
    for (const f of failed) console.log(`  ✗ ${f.step ?? f.code}: ${f.error}`);
    process.exitCode = 2;
  } else {
    console.log('Barcha ma\'lumotlar muvaffaqiyatli yuklandi.');
  }
}

main();
