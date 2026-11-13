# 3. Texnik reja va yo'l xaritasi

## 3.1. Arxitektura qarori

Sayt **statik** bo'ladi: server kerak emas, GitHub Pages bepul xosting qiladi.

```
Ma'lumot manbalari (World Bank API, UNDP, IMF)
        │
        ▼  scripts/fetch-data.mjs (Node.js skript)
data/*.json  (repoda statsionar JSON fayllar)
        │
        ▼  Qurilish (build) — sahifalar oldindan generatsiya qilinadi
dist/  (statik HTML + CSS + JS + grafiklar)
        │
        ▼  git push → GitHub Actions → GitHub Pages
https://<login>.github.io/<repo>/
```

**Nega statik JSON, nega emas jonli API:**
- World Bank API'dan har sahifa ochilganda so'rov yuborish sekinlashtiradi va
  API limitiga tushadi (tekshirish paytida bir nechta parallel so'rov olov
  devori tomonidan bloklandi — bir martalik yuklab olish bu muammoni yechadi).
- Ma'lumot yiliga bir-ikki marta yangilanadi — "live" bo'lishi shart emas.
- GitHub Actions' haftalik cron bilan `fetch-data.mjs` ishga tushiradi, JSON
  yangilanadi va sayt qayta quriladi — to'liq avtomatik yangilanish.

## 3.2. Texnologiyalar

| Qatlam | Tanlov | Asos |
|---|---|---|
| Qurilish (SSG) | **Astro** (yoki soddaroq variant: sof HTML+JS SPA) | ~200 davlat + ~20 ko'rsatkich sahifasi oldindan generatsiya qilinadi, SEO uchun tayyor HTML |
| Grafiklar | Chart.js yoki uPlot (yengil) | Yillar kesimi grafiklari, taqqoslash |
| Interaktivlik | Vanilla JS (katalog, filtr, taqqoslash) | Ramka shart emas — yengil va tez |
| Uslub | Yagona CSS fayl (custom dizayn) | Manba sayt dizayni ko'chirilmaydi — o'zimizniki yaratiladi |
| hosting | GitHub Pages | Bepul, HTTPS, `gh-pages` branch yoki Actions |
| Ma'lumot | JSON fayllar `data/` papkada | Git Versiya nazorati bilan izohli (auditable) ma'lumotlar |
| Yangilanish | GitHub Actions cron (haftalik) | `node scripts/fetch-data.mjs` → commit → build → deploy |

Muhit foydalanuvchi Mac'ida tayyor: git 2.54, gh CLI 2.102 (Kinjobek akkaunti),
Node v24.22.1.

## 3.3. Asosiy ma'lumot manbasi: World Bank API

- Bepul, API kaliti kerak emas, JSON qaytaradi: `api.worldbank.org/v2/...`
- Tekshirildi: O'zbekiston YaIM 2025 = $147,04 mlrd — manba sayt bilan mos.
- Litsenziya: ochiq ma'lumotlar (World Bank Open Data), manba ko'rsatilsa
  qayta ishlatishga ruxsat.

### MVP ko'rsatkichlari va API kodlari jadvali

| Ko'rsatkich | WB API kodi | Birlik |
|---|---|---|
| YaIM (joriy $) | `NY.GDP.MKTP.CD` | USD |
| YaIM o'sishi | `NY.GDP.MKTP.KD.ZG` | % yillik |
| Aholi jon boshiga YaIM | `NY.GDP.PCAP.CD` | USD |
| YaIM (PPP) | `NY.GDP.MKTP.PP.CD` | xalqaro $ |
| Inflyatsiya (iste'mol narxlari) | `FP.CPI.TOTL.ZG` | % yillik |
| Ishsizlik darajasi | `SL.UEM.TOTL.ZS` | % mehnat kuchiga nisbatan |
| Aholi soni | `SP.POP.TOTL` | kishi |
| Aholi zichligi | `EN.POP.DNST` | kishi/km² |
| Maydon | `AG.SRF.TOTL.K2` | km² |
| O'rtacha umr davomiyligi | `SP.DYN.LE00.IN` | yil |
| Tug'ilish darajasi | `SP.DYN.CBRT.IN` | ‰ |
| O'lim darajasi | `SP.DYN.CDRT.IN` | ‰ |
| Fertillik | `SP.DYN.TFRT.IN` | bola/ayol |
| Gini indeksi | `SI.POV.GINI` | indeks |
| Kambag'allik (2 $/kundagi) | `SI.POV.2DAY`? — yangi kod `SI.POV.MDIM` tekshiriladi | % |
| Eksport | `NE.EXP.GNFS.CD` / `NE.EXP.GNFS.ZS` | $ / YaIM % |
| Import | `NE.IMP.GNFS.CD` / `NE.IMP.GNFS.ZS` | $ / YaIM % |
| Rasmiy valyuta kursi | `PA.NUS.FCRF` | milliy valyuta = 1 $ |
| Migrant pul o'tkazmalari | `BX.TRF.PWKR.DT.GD.ZS` | YaIM % |
| CO₂ jon boshiga | `EN.ATM.CO2E.PC` | tonna |
| Elektr ishlab chiqarish | `EG.ELC.RNEW...`— aniq kod `EG.USE.ELEC.KH` bilan birga qurilishda tekshiriladi | GWh/kWh |
| Soliq daromadlari | `GC.TAX.TOTL.GD.ZS` | YaIM % |
| Davlat xarajatlari | `GC.XPN.TOTL.GD.ZS` | YaIM % |
| Ta'lim xarajatlari | `SE.XPD.TOTL.GD.ZS` | YaIM % |
| Sog'liqni saqlash xarajatlari | `SH.XPD.GHED.GD.ZS` | YaIM % |
| Mudofaa xarajatlari | `MS.MIL.XPND.GD.ZS` | YaIM % |
| Internet foydalanuvchilari | `IT.NET.USER.ZS` | % aholi |
| Savodxonlik | `SE.ADT.LITR.ZS` | % kattalar |
| Imigrantlar ulushi | `SI.POP.IMMIG.ZS`? — qurilishda tekshiriladi | % |

Davlatlar ro'yxati va metama'lumot: `api.worldbank.org/v2/country?format=json`
(296 yozuv — jami ~196 ta haqiqiy davlat + agregatlar filtrlanadi: region !=
"Aggregates"). Har bir yozuvda: ISO3, ISO2, nom, poytaxt, mintaqa, daromad
darajasi, kenglik/uzunlik — davlat sahifasining metama'lumoti shu yerdan.

Namuna so'rov (tekshirilgan):
```
https://api.worldbank.org/v2/country/UZB/indicator/NY.GDP.MKTP.CD?format=json&per_page=5&mrnev=1
→ 2025: $147 038 081 129
```

### Qo'shimcha manbalar (2-bosqich uchun)

| Ko'rsatkich | Manba | Olish usuli |
|---|---|---|
| ITT (HDI) | UNDP (hdr.undp.org) | Yillik CSV yuklab olinadi, repoda statsionar saqlanadi |
| Korrupsiya indeksi | Transparency International | Yillik CSV |
| YaIM prognozlari | IMF WEO | CSV yuklab olish |
| Neft narxi (Brent/WTI) | FRED yoki EIA | API (bepul, kalit bilan) |
| O'zbekiston bo'yicha mahalliy ma'lumot | stat.uz, cbu.uz | Qo'lda/CSV — keyingi bosqich |
| Valyutalar belgisi, telefon kodi va h.k. | restcountries.com | Bir martalik JSON |

## 3.4. Ma'lumot modeli

```jsonc
// data/countries.json — davlatlar katalogi
[
  {
    "iso3": "UZB", "iso2": "UZ",
    "name": { "uz": "O'zbekiston", "en": "Uzbekistan" },
    "slug": "ozbekiston",
    "capital": "Toshkent",
    "region": "Markaziy Osiyo", "continent": "Osiyo",
    "incomeLevel": "Quyi-o'rta daromadli",
    "areaKm2": 448924,
    "currency": { "name": "O'zbek so'mi", "code": "UZS" },
    "lat": 41.3, "lng": 64.6
  }
]

// data/indicators/NY.GDP.MKTP.CD.json — ko'rsatkich kesimi
{
  "code": "NY.GDP.MKTP.CD",
  "name": { "uz": "YaIM (joriy narxlarda)", "en": "GDP (current US$)" },
  "unit": "USD", "aggregation": "sum",
  "years": [2000, 2025],
  "data": { "UZB": { "2000": 13752, "2025": 147038 }, "...": {} }
}
```

## 3.5. GitHub rejasi

1. **Repo:** `Kinjobek` akkauntida yangi ommaviy repo (nom variantlari:
   `davlat-iqtisodiyoti`, `iqtisod-uz`, `mamlakatlar-iqtisodi`).
2. **Branchlar:** `main` — kod va ma'lumot; `gh-pages` (yoki Actions artefakt) — qurilgan sayt.
3. **GitHub Actions:**
   - `deploy.yml` — push'da qurish va Pages'ga joylash
   - `update-data.yml` — haftalik cron: ma'lumot yuklash → commit → deploy
4. **GitHub Pages sozlamasi:** Settings → Pages → Actions manbasi.
5. **Mualliflik:** manba saytning dizayni, matnlari va logotipi ishlatilmaydi —
   faqat tuzilma va ochiq ma'lumotlardan ilhom olinadi. Saytda ma'lumot
   manbalari ko'rsatiladi (World Bank, UNDP) — ularning ochiq litsenziyasi
   talab qiladi.

## 3.6. Sahifa kontenti (MVP qamrovi)

1. **Bosh sahifa:** joriy ko'rsatkichlar karuseli, asosiy jadvallar (YaIM,
   inflyatsiya, ishsizlik, aholi), davlatlar xaritasi/havolalari, so'nggi
   yangilanishlar
2. **Davlatlar ro'yxati** — jadval: nom, bayroq, aholi, YaIM, jon boshiga
   YaIM, inflyatsiya; qidiruv va tartiblash
3. **Davlat sahifasi (~196):** tezkor faktlar, xulosa matni, guruhlangan
   ko'rsatkichlar jadvali, yillar grafigi (YaIM, aholi, inflyatsiya)
4. **Ko'rsatkich sahifalari (~15):** barcha davlatlar jadvali + ta'rif +
   formula + manba havolasi
5. **Ko'rsatkich+davlat sahifasi:** yillar kesimi jadvali va grafigi
6. **Taqqoslash:** 2–3 davlat yonma-yon
7. **Lug'at:** 2.3-bo'limdagi atamalar
8. **Manbalar va ma'lumotnoma** sahifasi

## 3.7. Yo'l xaritasi

| Bosqich | Ish | Natija |
|---|---|---|
| 1 (MVP) | Astro loyihasi, fetch-skript (10–15 ko'rsatkich), davlatlar katalogi, davlat + ko'rsatkich sahifalari, o'zbek UI, GitHub repo + Pages | Ishlaydigan sayt |
| 2 | Grafiklar, taqqoslash, qidiruv, lug'at, qo'shimcha ko'rsatkichlar (ITT, korrupsiya, soliqlar) | To'liq ma'lumotnoma |
| 3 | Avtomatik yangilanish (cron), Hisobotlar (yangiliklar lentasi), bayroqlar va xarita vizualizatsiyasi, SEO/sitemap | O'z-o'zini yangilovchi sayt |
| 4 (ixtiyoriy) | O'zbekiston bo'limi (stat.uz/CBU ma'lumotlari), mobil ilova, maksimal qamrov (obligatsiyalar, birjalar, benzin narxlari) | Kengaytirilgan versiya |

## 3.8. Risklar va cheklovlar

- **World Bank API bloklashi:** parallel so'rovlar olov devorini faollashtirdi.
  Skript ketma-ket (birma-bir), pauzalar bilan, `User-Agent` sarlavhasi bilan
  ishlaydi — bir martalik yuklab olishda bu muammo bo'lmaydi.
- **Apostrof (o', g') diapazoni:** fayllarda tutun belgisi (ʻ) to'g'ri
  ko'rinishi uchun HTML'da `&#697;`/`&#699;` yoki to'g'ridan-to'g'ri UTF-8
  ishlatiladi.
- **Kichik davlatlarda bo'shliqlar:** ko'rsatkich mavjud bo'lmasa "—
  (ma'lumot yo'q)" ko'rsatiladi.
- **Manba sayt bilan bog'liqlik yo'q:** u faqat tuzilma namunasi; barcha raqamlar
  birinchi qo'ldan (WB/UNDP) olinadi.
