#!/usr/bin/env node
/**
 * Alifbo konvertori: o'zbek lotin (1995) → yangi alifbo (ö, ğ, ş, ç)
 *
 * Qoidalar:
 *   o' o’ oʻ → ö    (ў → ö; ё → yö: yosh→yöş, yoz→yöz, yoq→yöq)
 *   g' g’ gʻ → ğ    (ғ → ġ)
 *   sh → ş (SH→Ş, Sh→Ş)
 *   ch → ç (CH→Ç, Ch→Ç)
 *
 * Himoya:
 *   - kod so'zlari qism sifatida: fetch, chart, search, shadow, charset, catch...
 *   - sluglar (URL manzillari o'zgarmaydi)
 *   - apostrofdan keyin harf kelishi talab qilinadi ('g' kabi kod satrlari buzilmaydi)
 *   - bu skript o'zini konvertatsiya qilmaydi
 *
 * Ishga tushirish: node scripts/convert-alphabet.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = path.resolve(fileURLToPath(import.meta.url));

/* ---------- himoya: kod so'zlari (qism-sifatida) ---------- */
const CODE_SUBSTRINGS = [
  'fetch', 'Fetch', 'chart', 'Chart', 'cache', 'Cache', 'charset', 'catch', 'Catch',
  'shadow', 'push', 'show', 'shown', 'search', 'Search', 'each', 'Each', 'match',
  'check', 'chunk', 'switch', 'Change', 'character', 'Character', 'querySelector',
  'share', 'Share', 'hash', 'flush', 'shell'
];

/* ---------- himoya: sluglar va kategoriya kalitlari (chegarali) ---------- */
const uzCountries = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/uz-countries.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/indicators-catalog.json'), 'utf8'));
const SLUGS = new Set();
for (const v of Object.values(uzCountries.countries)) SLUGS.add(v[1]);
for (const ind of catalog.indicators) SLUGS.add(ind.slug);
for (const k of Object.keys(catalog.categories)) SLUGS.add(k);
// sahifa yo'llari (URL) — konvertatsiya qilinmaydi
for (const p of ['davlatlar', 'korsatkichlar', 'taqqoslash', 'lugat', 'manbalar', 'haqida', 'data', 'tashqi-savdo']) SLUGS.add(p);

/* ---------- konvertor ---------- */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const APOS = "['\u2019\u02BB\u02BC\u2018]"; // ' ’ ʻ ʼ ‘

function convertText(text, protectSubstrings = [], protectSlugs = SLUGS) {
  if (text == null) return text;
  const masks = [];
  let t = text;

  // 1) kod so'zlari — qism sifatida maskalanadi (LineChart, fetchJSON, indSearch...)
  for (const tok of [...protectSubstrings, ...CODE_SUBSTRINGS].sort((a, b) => b.length - a.length)) {
    if (!t.includes(tok)) continue;
    t = t.split(tok).join(`\x00${masks.length}\x00`);
    masks.push(tok);
  }

  // 2) sluglar — so'z chegarasi bilan maskalanadi
  for (const tok of [...protectSlugs].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(?<![A-Za-z0-9_\\-])${esc(tok)}(?![A-Za-z0-9_])`, 'g');
    t = t.replace(re, () => {
      masks.push(tok);
      return `\x00${masks.length - 1}\x00`;
    });
  }

  // 3) harf almashtirish
  //    apostrofdan keyin harf kelishi sharti (lookahead) 'g' flagini va
  //    so'z oxiridagi tutun qo'shtirnoqlarini buzmaslik uchun;
  //    "Ko\'rsatkich" dagi escape ham qamrab olinadi.
  const oRule = (ch, res) =>
    new RegExp(`${ch}(?:\\\\)?${APOS}(?=[A-Za-z])`, 'g');
  t = t
    .replace(oRule('o'), 'ö')
    .replace(oRule('O'), 'Ö')
    .replace(oRule('g'), 'ğ')
    .replace(oRule('G'), 'Ğ')
    .replace(/yosh/g, 'yöş').replace(/Yosh/g, 'Yöş')
    .replace(/yoz/g, 'yöz').replace(/Yoz/g, 'Yöz')
    .replace(/yoq(?!['\u2019\u02BB\u02BC\u2018])/g, 'yöq')
    .replace(/sh/g, 'ş').replace(/SH/g, 'Ş').replace(/Sh/g, 'Ş')
    .replace(/ch/g, 'ç').replace(/CH/g, 'Ç').replace(/Ch/g, 'Ç');

  // 4) maskalarni qaytarish
  t = t.replace(/\x00(\d+)\x00/g, (m, i) => masks[+i]);
  return t;
}

/* ---------- fayl ma'muriyati ---------- */
function convertSourceFile(absPath) {
  if (path.resolve(absPath) === SELF) return 0; // o'zini o'zgartirmaydi
  const src = fs.readFileSync(absPath, 'utf8');
  const out = convertText(src);
  if (out !== src) {
    fs.writeFileSync(absPath, out);
    return 1;
  }
  return 0;
}

function walk(dir, exts) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (['node_modules', 'dist', '.astro', '.git', 'raw'].includes(name)) continue;
      out.push(...walk(p, exts));
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(p);
    }
  }
  return out;
}

let changedFiles = 0;

// 1) manba fayllar
for (const f of walk(path.join(ROOT, 'src'), ['.astro', '.mjs', '.ts'])) {
  changedFiles += convertSourceFile(f);
}
for (const f of walk(path.join(ROOT, 'scripts'), ['.mjs'])) {
  changedFiles += convertSourceFile(f);
}
changedFiles += convertSourceFile(path.join(ROOT, 'astro.config.mjs'));

// package.json — faqat izoh maydoni
{
  const p = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  pkg.description = convertText(pkg.description, []);
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
}

// 2) JSON ma'lumot fayllari — maydon-maydon (sluglar va kalitlarga tegilmaydi)
{
  const p = path.join(ROOT, 'data/uz-countries.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const k of Object.keys(j.regions)) j.regions[k] = convertText(j.regions[k], []);
  for (const k of Object.keys(j.countries)) j.countries[k][0] = convertText(j.countries[k][0], []);
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}
{
  const p = path.join(ROOT, 'data/uz-capitals.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const k of Object.keys(j)) j[k] = convertText(j[k], []);
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}
{
  const p = path.join(ROOT, 'data/indicators-catalog.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const k of Object.keys(j.categories)) j.categories[k] = convertText(j.categories[k], []);
  for (const ind of j.indicators) {
    ind.name = convertText(ind.name, []);
    ind.unit = convertText(ind.unit, []);
    ind.desc = convertText(ind.desc, []);
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}
{
  const p = path.join(ROOT, 'data/countries.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const c of j) {
    c.nameUz = convertText(c.nameUz, []);
    c.regionUz = convertText(c.regionUz, []);
    c.incomeUz = convertText(c.incomeUz, []);
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 1));
}

console.log(`Konvertatsiya tugadi. O'zgargan manba fayllar soni: ${changedFiles}`);
