# 1. Tadqiqot: countryeconomy.com saytining to'liq tahlili

> Tadqiqot sanasi: 2026-yil 13-noyabr. Barcha ma'lumotlar saytning ochiq
> sahifalaridan to'plandi.

## 1.1. Sayt haqida umumiy ma'lumot

**countryeconomy.com** — jahon davlatlarining iqtisodiy va demografik
ko'rsatkichlarini jamlaydigan ma'lumotnoma sayt. Asosiy xususiyatlari:

- **Qamrov:** ~196 davlat + Yevropa zonası + AQSH shtatlari
- **Til versiyalari:** ingliz, ispan (datosmacro.expansion.com), fransuz
  (fr.countryeconomy.com), portugal (pt.countryeconomy.com) — bizning loyiha
  aynan shu modelni takrorlaydi, lekin **o'zbek tilida**.
- **Valyuta almashtirgich:** barcha summalarni yevro yoki dollarda ko'rsatish (€ $)
- **O'z ma'lumot manbalari** (saytning "Sources" sahifasidan): IMF, Eurostat,
  World Bank, Yevropa Markaziy banki, AQSH Mehnat statistikasi byurosi (BLS),
  Angliya banki, har bir davlatning statistika idoralari va Markaziy banklari.

## 1.2. Asosiy navigatsiya (sayt xaritasi)

```
/  (Bosh sahifa)
├── Ma'lumotlar (Data) → /indicators
│   ├── Tashqi savdo → /trade
│   ├── Demografiya → /demography
│   ├── Energetika va atrof-muhit → /energy-and-environment
│   ├── Hukumat → /government
│   ├── Soliqlar → /taxes
│   ├── Pul bozori → /money-market
│   ├── Mehnat → /labour
│   ├── Bozorlar → /markets
│   ├── Biznes → /business
│   ├── Narxlar → /prices
│   └── Boshqa ko'rsatkichlar → /indicators
├── Davlatlar (Countries) → /countries
│   ├── [davlat sahifasi] → /countries/{slug}
│   └── Taqqoslash → /countries/compare/{slug1}/{slug2}
├── Hisobotlar (Reports) → /reports/current
├── Lug'at (Dictionary) → /dictionary
└── Qidiruv (Search) → /search
```

**Bosh menyudagi tezkor havolalar (Top menu):**

| Havola | Manzil | O'zbekcha nomi |
|---|---|---|
| Bonds | /bonds | Davlat obligatsiyalari (10 yillik) |
| CPI | /cpi | Iste'mol narxlari indeksi (IIP) |
| Currencies | /currencies | Valyuta kurslari |
| Debt | /national-debt | Davlat qarzi |
| Deficit | /deficit | Byudjet taqchilligi |
| GDP | /gdp | Yalpi ichki mahsulot (YaIM) |
| LFS | /labour-force-survey | Mehnat kuchini o'rganish |
| Minimum Wage | /national-minimum-wage | Eng kam ish haqi |
| Ratings | /ratings | Suveren kredit reytinglari |
| Raw materials | /raw-materials | Xomashyo narxlari |
| Risk Premium | /risk-premium | Risk mukofoti |
| Stocks | /stock-exchange | Birja indekslari |
| Unemployment | /unemployment | Ishsizlik darajasi |

Bosh sahifada, shuningdek: **"Latest published data"** (so'nggi e'lon qilingan
ma'lumotlar — yangiliklar lentasi) va **"Compare countries"** (davlatlarni
taqqoslash) bloklari bor.

## 1.3. Mamlakat sahifasi tuzilishi (O'zbekiston misolida)

Manba: `https://countryeconomy.com/countries/uzbekistan`

Sahifa tarkibi yuqoridan pastga:

1. **Sarlavha:** davlat bayrog'i + davlat nomi + ijtimoiy tarmoqlar havolalari
2. **Tezkor ma'lumotlar paneli:**
   - Poytaxt: Toshkent
   - Aholi: 38 237 000 kishi
   - Maydoni: 448 924 km²
   - Valyuta: O'zbek so'mi (1 EUR = 13 282,14 UZS)
   - Dini: asosan islom
   - A'zo tashkilotlar: ACD, MDH (CIS), ECO, IMF, BMT, XBTD (OSCE), XHT (SCO)
3. **Xulosa matni:** davlat geografiyasi, aholi soni bo'yicha o'rin (38/196),
   aholi zichligi (85 kishi/km²), YaIM bo'yicha o'rin (64), davlat qarzi
   (28,59% YaIM), so'nggi inflyatsiya, ITT (HDI) o'rni va boshqalar — matn
   shaklida.
4. **Ko'rsatkichlar jadvallari** — quyidagi 10 guruhga bo'lingan (jami ~80 ta
   qator): Hukumat, Mehnat, Bozorlar, Narxlar, Pul bozori, Biznes, Tashqi
   savdo, Demografiya, Energetika va atrof-muhit, Boshqalar (COVID-19).
   Har bir qator: ko'rsatkich nomi (havolali) | sana | qiymat.
5. **Oldingi/keyingi davlat navigatsiyasi** (Uruguay → O'zbekiston → Vanuatu)
6. **Davlatlarni taqqoslash** interfeysi (ikkita davlat tanlanadi)
7. **Til almashtirish havolalari** (FR / PT / ES)
8. **Valyuta almashtirgich** (€ $)

## 1.4. Ko'rsatkich sahifasi tuzilishi (GDP misolida)

Manba: `https://countryeconomy.com/gdp`

- Sarlavha + izoh: ko'rsatkich ta'rifi (masalan, "YaIM — davlatda muayyan
  davrda ishlab chiqarilgan barcha tayyor tovar va xizmatlarning bozor qiymati")
- **Jami 196+ qatorli jadval:** davlat nomi (havola) | sana | yillik YaIM € |
  yillik YaIM $ | YaIM o'sishi %
- Yo'l-yo'lakay: yillik YaIM, aholi jon boshiga YaIM, choraklik YaIM,
  choraklik jon boshiga YaIM — 4 ta alohida taqqoslash jadvali
- Qit'alar bo'yicha filtrlash (World/Europe/Asia/...)
- Tushuntirish matni + formula: `YaIM = C + I + G + (X − M)`
- Davat bo'yicha sahifa: `/gdp/uzbekistan` — barcha yillar jadvali

**URL naqshlari (biz ham shunday quramiz):**

| Naqsh | Misol | Mazmuni |
|---|---|---|
| `/davlatlar` | — | Barcha davlatlar ro'yxati |
| `/davlatlar/{slug}` | /davlatlar/ozbekiston | Bir davlatning sahifasi |
| `/korsatkichlar` | — | Ko'rsatkichlar katalogi |
| `/korsatkichlar/{kod}` | /korsatkichlar/yaim | Ko'rsatkich (barcha davlatlar jadvali) |
| `/korsatkichlar/{kod}/{slug}` | /korsatkichlar/yaim/ozbekiston | Bir davlatda bir ko'rsatkich (yillar kesimi) |
| `/taqqoslash/{slug1}/{slug2}` | — | Ikki davlatni taqqoslash |
| `/yangiliklar` | — | So'nggi e'lon qilingan ma'lumotlar |
| `/lugat` | — | Atamalar lug'ati |

## 1.5. Ko'rsatkichlarning to'liq inventarizatsiyasi

Saytda e'lon qilinadigan barcha ko'rsatkichlar toifalar bo'yicha:

### Hukumat (Government)
- YaIM (bozor narxlarida, €/$, o'sish %, jon boshiga, choraklik)
- Davlat qarzi (mln. €/$, YaIMga nisbati %, jon boshiga)
- Byudjet taqchilligi / profitsiti (mln. €/$, YaIM %)
- Umumiy davlat xarajatlari (mln. €/$, YaIM %, jon boshiga)
- Ta'lim xarajatlari, Sog'liqni saqlash xarajatlari, Mudofaa xarajatlari
- Harbiy xizmatchilar 100 000 aholiga nisbati
- Suveren kredit reytinglari (Moody's, S&P, Fitch)
- Korrupsiya idrok indeksi (Transparency International, 0–100)
- Global raqobatbardoshlik indeksi, Mo'rt davlatlar indeksi (FSI)
- Axborot olish huquqi reytingi (RTI), Global innovatsiyalar indeksi

### Mehnat (Labour)
- Ishsizlik darajasi (%)
- Mehnat kuchini o'rganish natijalari (LFS)
- Eng kam (minimum) ish haqi (milliy valyuta, €, $)
- O'rtacha ish haqi
- Inson kapitali indeksi

### Soliqlar (Taxes)
- QQS stavkasi
- Jismoniy shaxslar daromad solig'i
- Soliq daromadlari (YaIM %)

### Pul bozori (Money market)
- Asosiy stavkalar (Markaziy bank qayta moliyalash stavkasi)

### Bozorlar (Markets)
- Valyuta kurslari (evro va dollar nisbatida)
- 10 yillik davlat obligatsiyalari daromadliligi
- Risk mukofoti (Germaniya benchmarkiga nisbatan)
- Birja indekslari (Dow Jones, FTSE 100, DAX, IBEX 35, CAC 40...)
- Xomashyo narxlari: neft (OPEC savat, Brent, WTI)

### Biznes (Business)
- Doing Business reytingi (biznes yuritish qulayligi)
- Sanoat ishlab chiqarish indeksi (IPI, yillik %)
- Yengil avtomobillar yillik savdosi va 1000 kishiga nisbati
- Avtomobil ishlab chiqarish, ishlatilayotgan avtomobillar

### Tashqi savdo (Trade)
- Xalqaro turizm (yillik kelgan sayyohlar)
- Eksport (mln. €/$, YaIM %)
- Import (mln. €/$, YaIM %)
- Savdo balansi (mln. €/$, YaIM %)
- Chakana savdo aylanmasi

### Narxlar (Prices)
- Iste'mol narxlari indeksi — IIP (umumiy indeks, yillik %)
- HICP — Yevropa uchun garmonizatsiyalashtirilgan indeks
- Ishlab chiqaruvchi narxlar indeksi (PPI, yillik %)
- Yoqilg'i narxlari (benzin Euro-95, dizel, oshxona uchun gaz moyi)

### Energetika va atrof-muhit
- CO₂ chiqindilari (tonna jon boshiga), metan (CH₄) chiqindilari
- Xom neft ishlab chiqarishi (kuniga ming barrel), neft zaxiralari (mln. barrel)
- Elektr energiyasi iste'moli va ishlab chiqarishi (GWh)
- Uy xo'jaliklari uchun elektr narxi

### Demografiya (Socio-Demography)
- Aholi soni, aholi zichligi
- Imigratsiya/Emigratsiya stoki va ulushi (%), migrant pul o'tkazmalari
- Inson taraqqiyoti indeksi — ITT (HDI, 0–1)
- Ijtimoiy taraqqiyot indeksi (SPI), Tinchlik indeksi, Global AgeWatch
- Gender tafovut indeksi, Jaxolat (Gini) indeksi, Baxt indeksi
- Kambag'allik xavfidagi aholi ulushi (%)
- Tug'ilish darajasi (‰), o'lim darajasi (‰), umumiy fertillik ko'rsatkichi
- O'rtacha umr davomiyligi (yil)
- Nikohlar, ajralishlar
- O'z joniga qasd qilish soni va 100 000 kishiga nisbati
- Qasddan o'ldirishlar soni va 100 000 kishiga nisbati
- Mahbuslar soni, savodxonlik darajasi, din tarkibi
- Aholi piramidasi

### Boshqalar (Others)
- COVID-19: tasdiqlangan holatlar, vafotlar, million aholiga vafotlar, emlanish

## 1.6. Bizning MVP uchun tanlangan asosiy ko'rsatkichlar (1-bosqich)

To'liq 80+ ko'rsatkichning hammasi birinchi versiyada shart emas. Bepul va
ishonchli manba (World Bank) bilan qoplanadigan asosiy to'plam:

1. YaIM ($ + jon boshiga + o'sish %)
2. Inflyatsiya (IIP, yillik %)
3. Ishsizlik darajasi (%)
4. Aholi soni va zichligi
5. Davlat qarzi (YaIM %)
6. Byudjet taqchilligi (YaIM %) — mavjud bo'lsa
7. Eksport, Import, savdo balansi ($ va YaIM %)
8. O'rtacha umr davomiyligi, tug'ilish/o'lim darajasi, fertillik
9. CO₂ jon boshiga, elektr ishlab chiqarishi/iste'moli
10. Gini indeksi, kambag'allik ulushi
11. Valyuta kursi (milliy valyuta = 1 $)
12. Maydoni, poytaxt, mintaqa (metama'lumot)
13. ITT (HDI) — UNDP dan statsionar fayl
14. Migrant pul o'tkazmalari (YaIM %)

2–3-bosqichlarda: obligatsiyalar, birjalar, reytinglar, benzin narxlari,
minimum ish haqi va boshqalar qo'shadi (manba: IMF, UNCTAD, narx-bayroq API'lari).
