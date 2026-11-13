import type { APIRoute } from 'astro';
import { registry } from '../../lib/data.mjs';

/** Taqqoslash sahifasi uchun barcha ko'rsatkichlarning so'nggi qiymatlari. */
export const GET: APIRoute = () => {
  const R = registry();
  const countries = R.countries.map((c) => ({
    n: c.nameUz,
    s: c.slug,
    i3: c.iso3
  }));
  const indicators = {};
  for (const ind of R.indicators) {
    indicators[ind.slug] = {
      n: ind.name,
      u: ind.unit,
      c: ind.cat,
      v: ind.latest
    };
  }
  const cats = R.catalog.categories;
  return new Response(JSON.stringify({ countries, cats, indicators }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
};
