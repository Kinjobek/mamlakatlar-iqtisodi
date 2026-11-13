# Mamlakatlar iqtisodi 🌐

> Jahon davlatlarining iqtisodiy-demografik körsatkiçliri **özbek tilida** (yangi alifbo:
> ö, ğ, ş, ç). [countryeconomy.com](https://countryeconomy.com) kabi xalqaro ma'lumotnoma
> saytlaridan ilhomlangan mustaqil loyiha.

**Jonli sayt:** <https://kinjobek.github.io/mamlakatlar-iqtisodi/>

## Imkoniyatlar

| Bo'lim | Mazmuni |
|---|---|
| **Davlatlar** | 220 davlat va agregat (Jahon, YE, Yevropa İttifoqi): poytaxt, aholi, YaIM, reytinglar |
| **Körsatkiçlar** | 72 körsatkiç × 10 toifa: iqtisodiyot, moliya, mehnat, demografiya, energetika |
| **Davlat sahifasi** | Tezkor faktlar + 6 ta SVG grafik (JS'siz) + 72 körsatkiç jadvali |
| **Taqqoslaş** | 3 tagacha davlatni yonma-yon soliştiriş |
| **Lug'at / Manbalar** | İzohli terminlar va ma'lumot manbalari |

## Ma'lumot manbalari

- **World Bank** — WDI bulk arxivi (68 körsatkiç) · CC BY 4.0
- **IMF DataMapper** — davlat qarzi, byudjet taqçilligi
- **UNDP** (OWID orqali) — inson taraqqiyoti indeksi
- **Global Carbon Budget** (OWID) — CO₂ çiqindilari

## Texnologiyalar

- **Astro** — statik qurilish (299 sahifa ~2 sekundda)
- Grafiklar — server tomonida çiziladigan inline SVG (JavaScript'siz)
- **GitHub Actions** — avtomatik deploy va haftalik ma'lumot yangilanishi

## İshga tushirish

```bash
npm install          # paketlar
npm run data         # ma'lumotlarni yuklab olish (World Bank, IMF, UNDP)
npm run build        # 299 sahifani qurish → dist/
npm run preview      # lokal ko'rish
```

Ma'lumot fayllari repoda saqlanadi (`data/`) — qayta yuklash shart emas.
`npm run data` faqat yangilash uchun ishlatiladi.

## Papkalar

```
├── data/                  # davlatlar, katalog, yuklangan körsatkiçlar (17 MB)
│   ├── uz-countries.json  # o'zbekça nomlar + sluglar (o'zgartirilsa e'tiborli bo'ling!)
│   ├── indicators-catalog.json  # 72 körsatkiç: nom, birlik, izoh, toifa
│   └── wb/ imf/ owid/     # yuklangan seriyalar (npm run data)
├── scripts/
│   ├── fetch-data.mjs     # ma'lumot quvuri (World Bank bulk, IMF, UNDP)
│   └── convert-alphabet.mjs  # yangi alifbo konvertori (faqat matnga ta'sir qiladi)
├── src/                   # Astro sahifalar, komponentlar, uslublar
└── .github/workflows/     # deploy.yml + update-data.yml (haftalik avtomatik yangilanish)
```

## Hujjatlar

- [`docs/01-tadqiqot.md`](docs/01-tadqiqot.md) — manba sayt tahlili (eski alifboda)
- [`docs/02-terminologiya.md`](docs/02-terminologiya.md) — terminologiya lug'ati
- [`docs/03-texnik-reja.md`](docs/03-texnik-reja.md) — texnik reja va yo'l xaritasi

## Litsenziya va mas'uliyat

Sayt matnlari va dizayni mualliflik huquqi bilan himoyalangan. Ma'lumotlar ochiq
manbalardan olingan (World Bank CC BY 4.0, IMF, UNDP) — ular rasmiy statistikadan
farq qilishi mumkin. Sayt "countryeconomy.com" bilan bog'liq emas.
