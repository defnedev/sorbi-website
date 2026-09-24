/* Paralel sayım parçalarını tek dosyada birleştirir.
   node tools/ozellik-birlestir.mjs parca-1.json parca-2.json [...] → ozellik-veri.json */
import fs from 'fs';
const dosyalar = process.argv.slice(2);
if (!dosyalar.length) { console.error('kullanım: node tools/ozellik-birlestir.mjs parca-*.json'); process.exit(1); }
const p = dosyalar.map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const out = { n: 0, hata: 0, say: Object.create(null), uclu: Object.create(null),
  katalog: p[0].katalog, gunAdim: p[0].gunAdim, saatAdet: p[0].saatAdet,
  izgara: p[0].izgara || 'sabit',          /* saat ızgarası künyeye taşınır — servis bunu basar */
  yer: p[0].yer, uretim: new Date().toISOString().slice(0, 10), parca: dosyalar.length };
const yillar = [];
for (const x of p) {
  out.n += x.n; out.hata += x.hata || 0; yillar.push(x.yil);
  for (const k in x.say) out.say[k] = (out.say[k] || 0) + x.say[k];
  for (const k in x.uclu) out.uclu[k] = (out.uclu[k] || 0) + x.uclu[k];
}
const bas = Math.min(...yillar.map(y => +y.split('–')[0]));
const son = Math.max(...yillar.map(y => +y.split('–')[1]));
out.yil = bas + '–' + son;
fs.writeFileSync('ozellik-veri.json', JSON.stringify(out));
const ent = Object.entries(out.say).sort((a, b) => a[1] - b[1]);
console.log(out.n + ' harita · ' + out.yil + ' · ' + Object.keys(out.say).length + '/' + out.katalog + ' özellik görüldü · ' + Object.keys(out.uclu).length + ' üçlü');
console.log('\nen seyrek 15:');
ent.slice(0, 15).forEach(([k, v]) => console.log('  ' + String(Math.round(out.n / v)).padStart(7) + ' kişide bir   ' + k + '  (' + v + ')'));
