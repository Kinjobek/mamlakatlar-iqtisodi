#!/usr/bin/env node
/* Batç fayllarini yangi alifboga ötkaziş holatini tekşiriş */
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);
for (const f of files) {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  const problems = [];
  for (const [code, v] of Object.entries(j)) {
    // o' yoki g' bilan yözilgan qolgan joylar (glottal ma'lumot/ma'noli bundan mustasno)
    const cleaned = v.replace(/ma'lumot|ma'noli|ma'noda/g, 'X');
    if (/[og]['’ʻʼ‘][A-Za-zçşöğ]/.test(cleaned)) problems.push(code + ': o\u2019/g\u2019 qolgan → ' + v.slice(0, 60));
    if (/ş|ç(?!a)|yöş/.test(cleaned)) problems.push(code + ': ş/ç qolgan → ' + v.slice(0, 60));
  }
  console.log(f + ': ' + Object.keys(j).length + ' yözuv, muammolar: ' + (problems.length ? problems.length : 0));
  for (const p of problems.slice(0, 6)) console.log('  ' + p);
}
