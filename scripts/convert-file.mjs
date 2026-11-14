#!/usr/bin/env node
/**
 * JSON fayl(lar)idagi matn qiymatlarini yangi alifboga (ö, ğ, ş, ç) konvertatsiya qiladi.
 * Işlatiş: node scripts/convert-file.mjs fayl1.json [fayl2.json ...]
 * Qoidalar: o'→ö, g'→ğ, ş→ş, ç→ç, yöş→yöş, yöz→yöz, yöq→yöq (faqat matn qiymatlariga)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const APOS = "['\u2019\u02BB\u02BC\u2018]";
const LETTER = '[A-Za-z\u00e7\u00c7\u015f\u015e\u00f6\u00d6\u011f\u011e]'; // lotin + yangi alifbo harflari
const CODE_WORDS = ['fetch', 'chart', 'search', 'cache', 'charset', 'catch', 'shadow', 'push', 'show', 'shown', 'each', 'Each', 'share', 'Share', 'hash', 'flush', 'shell'];

function convertText(text) {
  if (text == null) return text;
  const masks = [];
  let t = text;
  for (const tok of CODE_WORDS) {
    if (t.includes(tok)) {
      t = t.split(tok).join(`\x00${masks.length}\x00`);
      masks.push(tok);
    }
  }
  const oA = `o(?:\\\\)?${APOS}(?=${LETTER})`;
  const gA = `g(?:\\\\)?${APOS}(?=${LETTER})`;
  t = t
    .replace(new RegExp(oA.replace(/^o/, 'o'), 'g'), 'ö')
    .replace(new RegExp(oA.replace(/^o/, 'O'), 'g'), 'Ö')
    .replace(new RegExp(gA.replace(/^g/, 'g'), 'g'), 'ğ')
    .replace(new RegExp(gA.replace(/^g/, 'G'), 'g'), 'Ğ')
    .replace(/yöş/g, 'yöş').replace(/Yöş/g, 'Yöş')
    .replace(/yöz/g, 'yöz').replace(/Yöz/g, 'Yöz')
    .replace(/yöq(?!['\u2019\u02BB\u02BC\u2018])/g, 'yöq')
    .replace(/ş/g, 'ş').replace(/Ş/g, 'Ş').replace(/Ş/g, 'Ş')
    .replace(/ç/g, 'ç').replace(/Ç/g, 'Ç').replace(/Ç/g, 'Ç');
  t = t.replace(/\x00(\d+)\x00/g, (m, i) => masks[+i]);
  return t;
}

function walk(v) {
  if (typeof v === 'string') return convertText(v);
  if (Array.isArray(v)) return v.map(walk);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = walk(val);
    return out;
  }
  return v;
}

for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf8');
  let out;
  if (file.endsWith('.json')) {
    const data = JSON.parse(src);
    out = JSON.stringify(walk(data), null, 1) + '\n';
  } else {
    out = convertText(src);
  }
  if (out !== src) {
    writeFileSync(file, out);
    console.log(`✓ konvertatsiya: ${file}`);
  } else {
    console.log(`— özgarmagan: ${file}`);
  }
}
