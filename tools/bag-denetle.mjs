/* Sorbi Astroloji Kütüphanesi — bağlantı denetimi.
   Site kökündeki tüm *.html dosyalarındaki site içi bağlantıları tarar ve
   hedefi olmayanları (kayıp dosya, kayıp #id) kırık olarak bildirir.
   Dış bağlantılar, mailto:, tel:, javascript:, data: atlanır.
   _redirects kuralları hesaba katılır: yönlendirmesi olan yol kırık sayılmaz,
   ama site içine yönlendiriyorsa hedefi de ayrıca doğrulanır.

   Çalıştırma (repo kökünde):  node tools/bag-denetle.mjs
   Çıkış kodu: kırık varsa 1, temizse 0. Temizse tek satır özet basar.

   Kural: deploy öncesi çalışır — _d.sh'den ÖNCE. Kırık bağlantı çıkarsa
   yayına çıkılmaz; ölü çapa (#dogum-haritasi gibi) böyle yakalanır.
*/
import fs from 'fs'; import path from 'path';

const KOK = process.cwd();

/* ── kaynak dosyalar ── */
const htmlDosyalar = fs.readdirSync(KOK).filter(f => f.endsWith('.html')).sort();

/* ── _redirects: [kaynak, hedef] çiftleri ── */
const yonlendirmeler = [];
const ryol = path.join(KOK, '_redirects');
if (fs.existsSync(ryol)) {
  for (const satir of fs.readFileSync(ryol, 'utf8').split('\n')) {
    const s = satir.trim();
    if (!s || s.startsWith('#')) continue;
    const p = s.split(/\s+/);
    if (p.length >= 2) yonlendirmeler.push([p[0], p[1]]);
  }
}

/* Yol bir yönlendirme kuralıyla eşleşiyor mu? Eşleşiyorsa hedefini döndürür. */
function yonlendir(yol) {
  for (const [kaynak, hedef] of yonlendirmeler) {
    if (kaynak.endsWith('/*')) {
      const on = kaynak.slice(0, -1);
      if (yol.startsWith(on)) return hedef.replace(':splat', yol.slice(on.length));
    } else if (kaynak === yol) return hedef;
  }
  return null;
}

/* ── dosya çözümü: /x → x.html, /x.html → x.html, / → index.html ── */
function dosyaCoz(yol) {
  const temiz = yol.split('?')[0].replace(/\/$/, '');
  if (temiz === '' || temiz === '/') return 'index.html';
  const ad = temiz.replace(/^\//, '');
  if (ad.endsWith('.html')) return ad;
  if (fs.existsSync(path.join(KOK, ad + '.html'))) return ad + '.html';
  return ad; // uzantısız varlık (js/json/png vb.) olabilir
}
function dosyaVar(ad) { return fs.existsSync(path.join(KOK, ad)); }

/* ── id havuzu: dosya → Set(id) ── */
const idHavuz = new Map();
function idler(dosya) {
  if (idHavuz.has(dosya)) return idHavuz.get(dosya);
  const küme = new Set();
  const tam = path.join(KOK, dosya);
  if (fs.existsSync(tam)) {
    const m = fs.readFileSync(tam, 'utf8');
    for (const e of m.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) küme.add(e[1]);
    for (const e of m.matchAll(/<a\s[^>]*name\s*=\s*["']([^"']+)["']/g)) küme.add(e[1]);
  }
  idHavuz.set(dosya, küme);
  return küme;
}

/* ── bağlantı toplama: <a href> ve <link|script|img src> ── */
const BAG = /<(a|link|script|img)\s[^>]*?(href|src)\s*=\s*["']([^"']*)["']/gi;
const ATLA = /^(https?:|\/\/|mailto:|tel:|javascript:|data:|#!)/i;

const kirik = [];
let sayilan = 0;

for (const dosya of htmlDosyalar) {
  const metin = fs.readFileSync(path.join(KOK, dosya), 'utf8');
  const satirBasi = [0];
  for (let i = 0; i < metin.length; i++) if (metin[i] === '\n') satirBasi.push(i + 1);
  const satirNo = ofs => { let a = 0, b = satirBasi.length - 1;
    while (a < b) { const o = (a + b + 1) >> 1; if (satirBasi[o] <= ofs) a = o; else b = o - 1; }
    return a + 1; };

  for (const e of metin.matchAll(BAG)) {
    const ham = e[3].trim();
    if (!ham || ATLA.test(ham)) continue;
    sayilan++;
    const satir = satirNo(e.index);
    const bildir = sebep => kirik.push(`${dosya}:${satir} → ${ham} → ${sebep}`);

    /* üç sınıf: çapa (#id), dosya yolu, dosya+çapa */
    let yolKismi = ham, capa = '';
    const d = ham.indexOf('#');
    if (d >= 0) { yolKismi = ham.slice(0, d); capa = ham.slice(d + 1); }

    let hedefDosya;
    if (yolKismi === '') {
      hedefDosya = dosya;                       // aynı sayfa içi çapa
    } else {
      const yol = yolKismi.startsWith('/') ? yolKismi : '/' + yolKismi;
      hedefDosya = dosyaCoz(yol);
      if (!dosyaVar(hedefDosya)) {
        const yeni = yonlendir(yol.split('?')[0]);
        if (yeni === null) { bildir('dosya yok'); continue; }
        if (/^https?:/i.test(yeni)) continue;   // dışarı yönlendiriliyor, sorun yok
        hedefDosya = dosyaCoz(yeni);
        if (!dosyaVar(hedefDosya)) { bildir(`yönlendirme hedefi yok (${yeni})`); continue; }
      }
    }
    if (capa && !idler(hedefDosya).has(decodeURIComponent(capa)))
      bildir(`#${capa} ${hedefDosya} içinde yok`);
  }
}

if (kirik.length) {
  for (const s of kirik) console.log(s);
  console.log(`\n${kirik.length} kırık bağlantı (${htmlDosyalar.length} dosya, ${sayilan} site içi bağlantı).`);
  process.exit(1);
}
console.log(`Temiz: ${htmlDosyalar.length} dosya, ${sayilan} site içi bağlantı, kırık yok.`);
