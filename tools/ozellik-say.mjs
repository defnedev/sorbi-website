/* Sorbi Astroloji Kütüphanesi — özellik sayımı.
   Katalogdaki HER özelliğin örneklemde kaç kez gerçekleştiğini sayar.
   Çıktı: ozellik-veri.json  { n, yil, bas, adim, say:{id:adet}, uclu:{kod:adet} }

   Çalıştırma (repo kökünde):  node tools/ozellik-say.mjs [yilBas] [yilSon] [gunAdim] [saatAdet]
   Varsayılan: 1950 2009 2 6  → ~65.000 harita, ~15 dk.

   Kural: sayı elle yazılmaz. Katalog büyüyünce bu dosya yeniden çalıştırılır.
*/
import fs from 'fs'; import vm from 'vm';

const ctx = { console, Math, Date, Intl, JSON, Object, Array, String, Number, isNaN, parseInt, parseFloat, TextEncoder, setTimeout, module: { exports: {} } };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; vm.createContext(ctx);
for (const f of ['astronomy.browser.min.js', 'sorbi-astro.js', 'sorbi-ozellik.js'])
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
const A = ctx.window.SorbiAstro, OZ = ctx.window.SorbiOzellik;

const [, , a1, a2, a3, a4] = process.argv;
const YIL_BAS = +(a1 || 1950), YIL_SON = +(a2 || 2009);
const GUN_ADIM = +(a3 || 2), SAAT_ADET = +(a4 || 6);
const LAT = 41.0082, LON = 28.9784, TZ = 'Europe/Istanbul';

const say = Object.create(null);
const uclu = Object.create(null);
let n = 0, hata = 0;
const t0 = Date.now();

for (let y = YIL_BAS; y <= YIL_SON; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 31; d += GUN_ADIM) {
      const test = new Date(Date.UTC(y, m - 1, d));
      if (test.getUTCMonth() !== m - 1) continue;
      for (let s = 0; s < SAAT_ADET; s++) {
        const dk = Math.round(s * 1440 / SAAT_ADET);
        let ch;
        try {
          ch = A.chart({ y, mo: m, d, h: Math.floor(dk / 60), mi: dk % 60, tz: TZ, lat: LAT, lon: LON, house: 'P' });
        } catch (e) { hata++; continue; }
        let ids;
        try { ids = OZ.tara(ch); } catch (e) { hata++; continue; }
        for (const id of ids) {
          const i = id.indexOf(':');
          if (i < 0) say[id] = (say[id] || 0) + 1;
          else uclu[id.slice(i + 1)] = (uclu[id.slice(i + 1)] || 0) + 1;
        }
        n++;
      }
    }
  }
  if ((y - YIL_BAS) % 10 === 9)
    console.error(y + ' bitti · ' + n + ' harita · ' + ((Date.now() - t0) / 1000 | 0) + ' sn');
}

const out = {
  n, hata,
  yil: YIL_BAS + '–' + YIL_SON,
  gunAdim: GUN_ADIM, saatAdet: SAAT_ADET,
  yer: 'İstanbul (41,01°K 28,98°D) — ev ve açısal noktalar enleme bağlıdır',
  uretim: new Date().toISOString().slice(0, 10),
  katalog: OZ.OZ.length,
  say, uclu
};
fs.writeFileSync('ozellik-veri.json', JSON.stringify(out));

/* özet */
const ent = Object.entries(say).sort((a, b) => a[1] - b[1]);
console.error('\n' + n + ' harita · ' + OZ.OZ.length + ' özellik · ' + Object.keys(say).length + ' tanesi en az bir kez görüldü · hata ' + hata);
console.error('gruplar:', JSON.stringify(OZ.gruplar()));
console.error('\nen seyrek 12:');
ent.slice(0, 12).forEach(([k, v]) => console.error('  ' + k.padEnd(26) + String(v).padStart(6) + '  ' + (v ? Math.round(n / v) + ' kişide bir' : '—')));
console.error('\nen yaygın 8:');
ent.slice(-8).reverse().forEach(([k, v]) => console.error('  ' + k.padEnd(26) + String(v).padStart(6) + '  ' + Math.round(n / v) + ' kişide bir'));
console.error('\nüçlü: ' + Object.keys(uclu).length + ' farklı kombinasyon (kuramsal 1728)');
