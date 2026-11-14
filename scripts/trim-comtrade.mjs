#!/usr/bin/env node
/**
 * data/comtrade/*.json — fayllarni yiğiş:
 * mahsulot röyxatlarini top-300 gaça qisqartiradi, töliq sonini saqlaydi.
 * (fetch-comtrade.mjs ning eski versiyasi töliq röyxat saqlagan bölsa)
 * Işga tuşiriş: node scripts/trim-comtrade.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../data/comtrade');
const KEEP = 100;

let trimmed = 0;
for (const f of readdirSync(DIR)) {
  if (!f.endsWith('.json') || f.startsWith('_')) continue;
  const p = resolve(DIR, f);
  const j = JSON.parse(readFileSync(p, 'utf8'));
  let çanged = false;
  for (const flow of ['x', 'm']) {
    const list = j.products?.[flow];
    if (Array.isArray(list) && list.length > KEEP) {
      j.products[`${flow}Count`] ??= list.length;
      j.products[flow] = list.slice(0, KEEP);
      çanged = true;
    }
  }
  if (çanged) {
    writeFileSync(p, JSON.stringify(j, null, 1));
    trimmed++;
    console.log(`✓ ${f} → top-${KEEP} (${j.products.xCount ?? '?'} / ${j.products.mCount ?? '?'})`);
  }
}
console.log(trimmed ? `Yiğilgan fayllar: ${trimmed}` : 'Hammasi allaqaçon yiğiq.');
