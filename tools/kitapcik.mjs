/* Doğum Haritası Kitapçığı — örnek üretici.
   Ürün kuralı: kişi hakkında iddia yok. Hesap + geleneğin okuması (atıflı) + kaç kişide bir.
   Çalıştırma: node kitapcik.mjs  → kitapcik.html
*/
import fs from 'fs'; import vm from 'vm';
const D = process.env.D, SITE = D + '/site', KOR = '/mnt/user-data/uploads/sorbi-website-cini/_gecici-korpus';

const ctx = { console, Math, Date, Intl, JSON, Object, Array, String, Number, isNaN, parseInt, parseFloat, TextEncoder, setTimeout };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; vm.createContext(ctx);
ctx.module = { exports: {} };
for (const f of ['astronomy.browser.min.js', 'sorbi-astro.js', 'sorbi-dignite.js', 'sorbi-yildiz-say.js', 'sorbi-ozellik.js'])
  vm.runInContext(fs.readFileSync(SITE + '/' + f, 'utf8'), ctx, { filename: f });
const A = ctx.window.SorbiAstro, DIG = ctx.window.SorbiDignite, YSAY = ctx.window.SORBI_YILDIZ_SAY;
const OZL = ctx.window.SorbiOzellik;
const VERI = JSON.parse(fs.readFileSync(SITE + '/ozellik-veri.json', 'utf8'));
const NAD = JSON.parse(fs.readFileSync(SITE + '/nadirlik-veri.json', 'utf8'));
const kor = n => JSON.parse(fs.readFileSync(KOR + '/' + n + '.json', 'utf8'));
const BURCTA = kor('natal_planets_in_signs'), EVDE = kor('natal_planets_in_houses'),
      ACIK = kor('natal_aspects'), ALAN = kor('life_areas');

/* ── girdi ── */
const o = { y: 1996, mo: 10, d: 8, h: 16, mi: 44, tz: 'Europe/Istanbul', lat: 41.0082, lon: 28.9784, house: 'P', yer: 'İstanbul' };
const CH0 = A.chart(o);
const ch = CH0;

const BURC = ['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
const AD = { sun:'Güneş', moon:'Ay', mer:'Merkür', ven:'Venüs', mar:'Mars', jup:'Jüpiter', sat:'Satürn', ura:'Uranüs', nep:'Neptün', plu:'Plüton' };
const nrm = x => ((x % 360) + 360) % 360;
const bn = l => Math.floor(nrm(l) / 30);
const der = l => Math.floor(nrm(l) % 30);
const dak = l => Math.round((nrm(l) % 1) * 60);
const kon = l => der(l) + '° ' + BURC[bn(l)] + ' ' + String(dak(l)).padStart(2, '0') + '′';
const tr = n => n.toLocaleString('tr-TR');

/* ── kütüphane: bu haritada gerçekleşen her özellik + kaç kişide bir ── */
const KAT = {}; OZL.OZ.forEach(x => KAT[x.id] = x);
/* eski 24.000'lik örneklem, yalnız üçlü karşılaştırması için */
function kacta(k, sign) {
  const a = NAD.b[k]; if (!a) return null;
  const n = a[sign]; if (!n) return null;
  return Math.round(NAD.t / n);
}
function kactaMetin(k, sign) {
  const r = kacta(k, sign);
  return r ? (r <= 1 ? 'neredeyse herkeste' : tr(r) + ' kişide bir') : null;
}

const P = {}; ch.pls.forEach(p => { if (AD[p.k]) P[p.k] = p; });

/* ── kütüphane ── */
const IDS = OZL.tara(ch);
function ozKac(id) { const n = VERI.say[id]; return n ? Math.round(VERI.n / n) : null; }
const OZL_LIST = IDS.filter(i => i.indexOf(':') < 0)
  .map(i => ({ id: i, ad: (KAT[i] || {}).ad || i, grup: (KAT[i] || {}).grup || '', k: ozKac(i) }))
  .filter(x => x.k).sort((a, b) => b.k - a.k);
const UCLU_KOD = (IDS.find(i => i.startsWith('uclu:')) || '').slice(5);
const UCLU_N = VERI.uclu[UCLU_KOD];
const asps = A.within(ch, 1, false).filter(x => AD[x.a.k] && AD[x.b.k]);

/* ── öne çıkanlar: deterministik tespit ── */
const one = [];
{ /* yığın */
  const s = new Array(12).fill(0);
  ['sun','moon','mer','ven','mar','jup','sat'].forEach(k => s[bn(P[k].lon)]++);
  const i = s.indexOf(Math.max(...s));
  if (s[i] >= 3) one.push(['Yığın', s[i] + ' gezegen ' + BURC[i] + ' burcunda toplanmış. Sayımımıza göre yedi klasik gezegenden en az üçünün aynı burçta olduğu gün, günlerin yüzde kırk üçü; dört ve üstü on iki günde bir.']);
}
{ /* dignite */
  let l = [];
  try {
    const t = DIG.tablo(ch);
    l = t.filter(x => x.etiketler && x.etiketler.length).map(x => x.ad + ' ' + x.burc + '\u2019da: ' + x.etiketler.map(e => e.t).join(', '));
  } catch (e) {}
  if (l.length) one.push(['Asalet ve zarar', l.join(' · ') + '. Klasik astroloji bir gezegenin kendi burcunda ya da yüceldiği burçta olmasını güçlü, karşıtında ya da düştüğü burçta olmasını zayıf sayar.']);
}
{ /* element */
  const e = [0,0,0,0], EL = ['ateş','toprak','hava','su'];
  ['sun','moon','mer','ven','mar','jup','sat'].forEach(k => e[bn(P[k].lon) % 4]++);
  const i = e.indexOf(Math.max(...e)), j = e.indexOf(Math.min(...e));
  one.push(['Element dengesi', 'Ateş ' + e[0] + ', toprak ' + e[1] + ', hava ' + e[2] + ', su ' + e[3] + '. En çok ' + EL[i] + ', en az ' + EL[j] + '. Gelenek bu dağılımı haritanın mizacı diye okur.']);
}
{ /* harita yöneticisi */
  const YON = ['mar','ven','mer','moon','sun','mer','ven','mar','jup','sat','sat','jup'];
  const y = YON[bn(ch.asc)], p = P[y];
  one.push(['Harita yöneticisi', 'Yükselen ' + BURC[bn(ch.asc)] + ', eski yöneticisi ' + AD[y] + '. Bu haritada ' + AD[y] + ' ' + kon(p.lon) + ', ' + p.house + '. evde. Gelenek harita yöneticisinin bulunduğu eve ağırlık verir.']);
}
{ /* retro */
  const l = []; for (const k in P) if (P[k].rx) l.push(AD[k]);
  one.push(['Geri hareket', l.length ? 'Doğum günü geri görünen gezegenler: ' + l.join(', ') + '. Sayımımıza göre Merkür yılın %19,1’inde, Venüs %7,2’sinde geri görünür.' : 'Doğum günü hiçbir gezegen geri görünmüyordu; sayımımıza göre bu günlerin azınlığı.']);
}
{ /* sabit yıldız */
  const YIL = { Regulus: 149.8, Spica: 203.8, Antares: 249.8, Aldebaran: 69.8, Algol: 56.1, Sirius: 104.1, Fomalhaut: 333.8, Vega: 285.3, Altair: 301.8, Arcturus: 204.2 };
  const yil = o.y, kay = (yil - 2000) * (50.3 / 3600);
  const hit = [];
  for (const [ad, lon0] of Object.entries(YIL)) {
    const lon = nrm(lon0 + kay);
    for (const k in P) { const d = Math.abs(nrm(P[k].lon - lon)); const dd = d > 180 ? 360 - d : d; if (dd <= 1) hit.push(AD[k] + ' – ' + ad + ' (' + dd.toFixed(1) + '°)'); }
    const da = Math.abs(nrm(ch.asc - lon)), da2 = da > 180 ? 360 - da : da; if (da2 <= 1) hit.push('Yükselen – ' + ad + ' (' + da2.toFixed(1) + '°)');
  }
  if (hit.length) one.push(['Sabit yıldız', hit.join(' · ') + '. Sayımımıza göre on sekiz parlak yıldızdan en az birine değmek %65,7; ama belirli bir yıldıza değmek çok daha seyrek.']);
}

/* ── nadirlik özeti ── */
const nadSat = [
  ['Güneş ' + BURC[bn(P.sun.lon)] + '’da', kactaMetin('sun', bn(P.sun.lon))],
  ['Ay ' + BURC[bn(P.moon.lon)] + '’da', kactaMetin('moon', bn(P.moon.lon))],
  ['Yükselen ' + BURC[bn(ch.asc)], kactaMetin('asc', bn(ch.asc))],
].filter(x => x[1]);
const ucluN = UCLU_N ? tr(Math.round(VERI.n / UCLU_N)) + ' kişide bir' : 'bu örneklemde hiç görülmedi';

/* ── HTML ── */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const satir = (a, b) => '<tr><td>' + a + '</td><td>' + b + '</td></tr>';

let gezSat = '';
for (const k of ['sun','moon','mer','ven','mar','jup','sat','ura','nep','plu']) {
  const p = P[k];
  const dis = ['ura','nep','plu'].indexOf(k) >= 0;
  const r = ozKac('burc.' + k + '.' + bn(p.lon));
  const nadMetin = dis ? 'kuşak yerleşimi' : (r ? tr(r) + ' kişide bir' : '—');
  gezSat += '<tr><td class="g">' + p.g + '</td><td><b>' + AD[k] + '</b></td><td class="m">' + kon(p.lon) + '</td><td class="m">' + p.house + '. ev</td><td class="m">' + (p.rx ? 'R' : '') + '</td><td class="m s">' + nadMetin + '</td></tr>';
}

let yorum = '';
for (const k of ['sun','moon','mer','ven','mar','jup','sat']) {
  const p = P[k], sg = BURC[bn(p.lon)];
  const tb = (BURCTA[AD[k]] || {})[sg], te = (EVDE[AD[k]] || {})[String(p.house)];
  const alan = ALAN[String(p.house)] || {};
  yorum += '<section class="y"><h3>' + AD[k] + ' · ' + kon(p.lon) + ' · ' + p.house + '. ev</h3>';
  yorum += '<p class="hesap">Hesap: ' + AD[k] + ' ' + kon(p.lon) + ', ' + p.house + '. evde' + (p.rx ? ', geri hareketli' : '') + '. Bu ev geleneksel olarak ' + (alan.name_tr ? alan.name_tr.toLowerCase() : 'hayatın bir alanı') + ' konusuyla anılır.</p>';
  if (tb) yorum += '<p><span class="atf">Klasik metinler ' + AD[k] + '’in ' + sg + ' burcundaki konumunu şöyle okur:</span> ' + esc(tb) + '</p>';
  if (te) yorum += '<p><span class="atf">' + p.house + '. evdeki konumu için:</span> ' + esc(te) + '</p>';
  const rb = ozKac('burc.' + k + '.' + bn(p.lon)), re = ozKac('ev.' + k + '.' + p.house);
  const par = [];
  if (rb) par.push('burçta ' + tr(rb) + ' kişide bir');
  if (re) par.push('evde ' + tr(re) + ' kişide bir');
  if (par.length) yorum += '<p class="say">Sayım: ' + par.join(', ') + '.</p>';
  yorum += '</section>';
}

let aciSat = '';
asps.slice(0, 10).forEach(x => {
  const ad1 = x.a.n, ad2 = x.b.n, tip = x.as.n;
  const anah = ad1 + '-' + ad2, anah2 = ad2 + '-' + ad1;
  const t = (ACIK[tip] || {})[anah] || (ACIK[tip] || {})[anah2];
  aciSat += '<tr><td><b>' + ad1 + ' ' + tip.toLowerCase() + ' ' + ad2 + '</b><br><span class="m s">' + Math.abs(x.orb).toFixed(1) + '° sapma</span></td><td>' + (t ? esc(t) : '<span class="s">Bu açı için gelenekte ayrı bir okuma kaydedilmemiş.</span>') + '</td></tr>';
});

const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<title>Doğum Haritası Kitapçığı — 8 Ekim 1996</title>
<style>
@page{size:A4;margin:18mm 16mm}
*{box-sizing:border-box}
body{margin:0;background:#F6F3EC;color:#1A1720;font-family:Georgia,'Times New Roman',serif;line-height:1.7;font-size:11pt}
.wrap{max-width:720px;margin:0 auto;padding:28px 22px 60px}
h1{font-size:26pt;line-height:1.15;margin:0 0 6px;font-weight:600;letter-spacing:-.01em}
h2{font-size:14pt;margin:34px 0 10px;padding-bottom:6px;border-bottom:1px solid rgba(26,23,32,.18);font-weight:600}
h3{font-size:12pt;margin:20px 0 6px;font-weight:600}
p{margin:.45rem 0}
.kunye{font-family:ui-monospace,Menlo,monospace;font-size:8.5pt;color:#5C5966;letter-spacing:.02em;margin-bottom:22px}
.kunye b{color:#1A1720;font-weight:600}
.giris{font-size:11.5pt;color:#3A3640;border-left:2px solid #A85A36;padding-left:14px;margin:18px 0 6px}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10pt}
td,th{text-align:left;padding:6px 8px;border-bottom:1px solid rgba(26,23,32,.1);vertical-align:top}
th{font-size:8.5pt;text-transform:uppercase;letter-spacing:.1em;color:#5C5966;font-weight:600}
.m{font-family:ui-monospace,Menlo,monospace;font-size:9pt}
.s{color:#5C5966}
.g{font-size:13pt;width:26px;color:#A85A36}
.y{margin:16px 0;page-break-inside:avoid}
.hesap{font-family:ui-monospace,Menlo,monospace;font-size:9pt;color:#5C5966}
.atf{color:#5C5966;font-style:italic}
.say{font-size:10pt;color:#A85A36}
.one{background:rgba(26,23,32,.03);border-radius:8px;padding:12px 14px;margin:10px 0;page-break-inside:avoid}
.one b{display:block;font-size:10pt;letter-spacing:.06em;text-transform:uppercase;color:#5C5966;margin-bottom:3px}
.yontem{font-size:9.5pt;color:#5C5966;border-top:1px solid rgba(26,23,32,.18);margin-top:34px;padding-top:12px}
.yontem b{color:#1A1720}
.not{font-size:9pt;color:#5C5966;margin-top:26px;font-style:italic}
</style></head><body><div class="wrap">

<h1>Doğum Haritası<br>Kitapçığı</h1>
<div class="kunye">
<b>8 EKİM 1996 · 16:44 · İSTANBUL</b><br>
41,01°K 28,98°D · Placidus · Tropikal · Gerçek düğüm<br>
Efemeris: astronomy-engine · Zaman dilimi: IANA tarihsel veri (Europe/Istanbul)
</div>

<p class="giris">Bu kitapçık bir yorum değil, bir hesap dökümüdür. Her bölümde önce ne hesaplandığı yazılır, sonra klasik metinlerin o yerleşimi nasıl okuduğu aktarılır, sonunda o yerleşimin kaç kişide bir görüldüğü söylenir. Hakkında bir iddia yoktur; ne olduğu ve ne kadar seyrek olduğu vardır.</p>

<h2>Üçlü</h2>
<table>
<tr><th>Nokta</th><th>Konum</th><th>Ev</th><th>Kaç kişide bir</th></tr>
${satir('<b>Güneş</b>', '<span class="m">' + kon(P.sun.lon) + '</span></td><td class="m">' + P.sun.house + '. ev</td><td class="m s">' + (kactaMetin('sun', bn(P.sun.lon)) || '—') + '</span>')}
${satir('<b>Ay</b>', '<span class="m">' + kon(P.moon.lon) + '</span></td><td class="m">' + P.moon.house + '. ev</td><td class="m s">' + (kactaMetin('moon', bn(P.moon.lon)) || '—') + '</span>')}
${satir('<b>Yükselen</b>', '<span class="m">' + kon(ch.asc) + '</span></td><td class="m">1. ev</td><td class="m s">' + (kactaMetin('asc', bn(ch.asc)) || '—') + '</span>')}
${satir('<b>MC</b>', '<span class="m">' + kon(ch.mc) + '</span></td><td class="m">10. ev</td><td class="m s">' + (kactaMetin('mc', bn(ch.mc)) || '—') + '</span>')}
</table>
<p class="say">Bu üçlünün tamamı (Güneş ${BURC[bn(P.sun.lon)]} · Ay ${BURC[bn(P.moon.lon)]} · Yükselen ${BURC[bn(ch.asc)]}) örneklemimizde <b>${ucluN}</b> görülüyor.</p>
<p class="s">Not: tek bir gezegenin bir burçta olması kabaca on iki kişide birdir, yani tek başına seyrek değildir. Asıl seyreklik birleşimlerde çıkar: üçlünün tamamı, sabit yıldız teması, yığın ve dar açılar. Bu kitapçıkta sayı yalnızca ortalamadan saptığı yerlerde verilir.</p>
<p>Harita ${ch.day ? 'gündüz' : 'gece'} haritasıdır: doğum anında Güneş ufkun ${ch.day ? 'üstündeydi' : 'altındaydı'}. Klasik astroloji bu ayrıma sect der ve hangi gezegenlerin rahat çalıştığını buna göre değerlendirir.</p>

<h2>Gezegenler</h2>
<table>
<tr><th></th><th>Gezegen</th><th>Konum</th><th>Ev</th><th></th><th>Kaç kişide bir</th></tr>
${gezSat}
</table>

<h2>Öne çıkanlar</h2>
${one.map(x => '<div class="one"><b>' + x[0] + '</b>' + x[1] + '</div>').join('')}

<h2>Yerleşimler</h2>
${yorum}

<h2>Nadirlik</h2>
<p class="s">Bu haritada kütüphanenin <b>${IDS.length}</b> özelliği gerçekleşiyor. Aşağıda en seyrek on iki tanesi. Sayılar 1950–2009 arasından örneklenmiş <b>${tr(VERI.n)} gök anına</b> dayanır; ${VERI.katalog} özellikli katalogdan üretilmiştir.</p>
<table>
<tr><th>Kaç kişide bir</th><th>Özellik</th><th>Grup</th></tr>
${OZL_LIST.slice(0, 12).map(x => '<tr><td class="m"><b>' + tr(x.k) + '</b></td><td>' + x.ad + '</td><td class="s">' + x.grup + '</td></tr>').join('')}
</table>
<p class="say">Üçlünün tamamı: <b>${ucluN}</b>. Örneklemde 1.728 olası üçlüden ${tr(Object.keys(VERI.uclu).length)} tanesi görüldü.</p>

<h2>Açılar</h2>
<p class="s">Aşağıda 1° orbla bulunan açılar, sapması en küçük olandan başlayarak sıralanmıştır. Toplam ${asps.length} açı bulundu.</p>
<table>${aciSat}</table>

<div class="yontem">
<p><b>Yöntem.</b> Gezegen konumları astronomy-engine ile hesaplandı; ev başlangıçları ve açısal noktalar Swiss Ephemeris çıktısına karşı doğrulandı. Zaman dilimi ve yaz saati IANA tarihsel verisinden alındı — Türkiye'de 1978–1985 arası kalıcı yaz saati dahil tüm rejim değişiklikleri hesaba katılmıştır.</p>
<p><b>Sayılar.</b> "Kaç kişide bir" ifadeleri Sorbi Astroloji Kütüphanesi'nden gelir: ${VERI.katalog} özellikli bir katalog, 1950–2009 arasından iki günde bir ve günde altı saat örneklenmiş ${tr(VERI.n)} gök anı üzerinde sayılır. Ev ve açısal noktalar İstanbul enlemiyle hesaplanmıştır. Sabit yıldız oranları ayrıca 1.367.496 gök anına dayanır. Bunlar gökyüzü dağılımıdır, doğum istatistiği değildir: doğumlar gün ve mevsim içinde tam eşit dağılmaz.</p>
<p><b>Sınırlar.</b> Bu kitapçık bir hesap dökümü ve gelenek aktarımıdır. Gelecekle ilgili bir iddia içermez, kişilik teşhisi değildir, tıbbi, hukuki ya da finansal tavsiye yerine geçmez.</p>
</div>

<p class="not">sorbiapp.com · Bu kitapçık otomatik üretilmiştir; aynı doğum verisi her zaman aynı kitapçığı verir.</p>
</div></body></html>`;

fs.writeFileSync(D + '/kitapcik.html', html);
console.log('yazıldı:', (html.length / 1024).toFixed(1) + ' KB');
console.log('üçlü:', BURC[bn(P.sun.lon)], BURC[bn(P.moon.lon)], BURC[bn(ch.asc)], '→', ucluN);
console.log('açı:', asps.length, '· öne çıkan:', one.length);
