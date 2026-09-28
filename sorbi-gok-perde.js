/* sorbi-gok-perde.js — ana sayfa hero'sunun arkasındaki canlı gökyüzü.
 * Renkler elle seçilmedi: "Bak" paletindeki gökyüzü olaylarından (airglow, mavi saat /
 * Chappuis, altın saat, Rayleigh) Güneş'in gerçek yüksekliğine göre ara değerlenir.
 * Yıldız renkleri siyah cisim sıcaklıklarından. Hiçbir veri sunucuya gitmez.
 * Test için ?saat=19.5 (yerel saat) verilebilir.
 */
(function(){
"use strict";
var hero = document.querySelector('.hero'); if(!hero || window.__gokPerde) return; window.__gokPerde = 1;
var M = Math, RAD = M.PI/180, H = document.documentElement;

/* ── konum: Türkiye saat dilimindeyse İstanbul; değilse kayıtlı doğum yeri; yoksa İstanbul ── */
var yer = {lat:41.0082, lon:28.9784, ad:'İstanbul'};
try{
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if(tz !== 'Europe/Istanbul'){
    var b = JSON.parse(localStorage.getItem('sorbi_birth')||'null');
    var ad = b && (b.place||'').split(',')[0].trim();
    if(b && +b.lat && +b.lon && ad) yer = {lat:+b.lat, lon:+b.lon, ad:ad};
  }
}catch(e){}

function simdi(){
  var d = new Date(), m = location.search.match(/[?&]saat=([\d.]+)/);
  if(m){ var s = parseFloat(m[1]); d.setHours(M.floor(s), M.round((s%1)*60), 0, 0); }
  return d;
}
/* Güneş yüksekliği (NOAA sadeleştirilmiş, renk için ±0,5° yeter) */
function gunesYuk(d, lat, lon){
  var jd = d.getTime()/864e5 + 2440587.5, n = jd - 2451545.0;
  var L = (280.460 + 0.9856474*n) % 360, g = (357.528 + 0.9856003*n) % 360;
  var lam = L + 1.915*M.sin(g*RAD) + 0.020*M.sin(2*g*RAD), eps = 23.439 - 0.0000004*n;
  var ra = M.atan2(M.cos(eps*RAD)*M.sin(lam*RAD), M.cos(lam*RAD))/RAD;
  var dec = M.asin(M.sin(eps*RAD)*M.sin(lam*RAD))/RAD;
  var gmst = (280.46061837 + 360.98564736629*n) % 360, ha = gmst + lon - ra;
  return M.asin(M.sin(lat*RAD)*M.sin(dec*RAD) + M.cos(lat*RAD)*M.cos(dec*RAD)*M.cos(ha*RAD))/RAD;
}
function ayEvre(d){
  var A = window.Astronomy;
  if(A && A.Illumination && A.MoonPhase){ try{
    var f = A.Illumination(A.Body.Moon, d).phase_fraction, lon = A.MoonPhase(d), nm;
    if(lon < 8 || lon > 352) nm = 'yeni ay'; else if(lon < 80) nm = 'büyüyen hilal'; else if(lon < 100) nm = 'ilk dördün';
    else if(lon < 172) nm = 'büyüyen ay'; else if(lon < 188) nm = 'dolunay'; else if(lon < 260) nm = 'küçülen ay';
    else if(lon < 280) nm = 'son dördün'; else nm = 'küçülen hilal';
    return {yuzde: M.round(f*100), ad: nm};
  }catch(e){} }
  var P = 29.530588853, yas = ((d.getTime()/864e5 - 10962.7597) % P + P) % P; /* 2000-01-06 18:14 UT yeni ay */
  var ayd = (1 - M.cos(2*M.PI*yas/P))/2, ad;
  if(yas < 1.2 || yas > P-1.2) ad = 'yeni ay'; else if(yas < 6.4) ad = 'büyüyen hilal';
  else if(yas < 8.4) ad = 'ilk dördün'; else if(yas < 13.6) ad = 'büyüyen ay';
  else if(yas < 15.9) ad = 'dolunay'; else if(yas < 21.2) ad = 'küçülen ay';
  else if(yas < 23.2) ad = 'son dördün'; else ad = 'küçülen hilal';
  return {yuzde: M.round(ayd*100), ad: ad};
}

/* ── palet (Bak · gökyüzünden hesaplanmış): [Güneş yüksekliği, zirve, ufuk, ufuk ışığı, ışık gücü] ── */
var GECE = [
  [-90,'#0B0810','#181E28','#181E28',0],
  [-18,'#0B0810','#181E28','#181E28',0],
  [-12,'#0E121C','#151C29','#29334D',0.15],
  [ -8,'#131A28','#182030','#434558',0.35],
  [ -4,'#1A2033','#272C3F','#8C4801',0.42],
  [ -1,'#1E2438','#2E3350','#AF6F1B',0.75],
  [  2,'#222A40','#353A55','#EFD08D',0.55],
  [  8,'#1B2233','#2A3148','#2A3148',0],
  [ 90,'#1B2233','#2A3148','#2A3148',0]
];
var GUNDUZ = [
  [-90,'#DCE0EA','#EDEBE5','#EDEBE5',0],
  [-8,'#DCE0EA','#EDEBE5','#EDEBE5',0],
  [-2,'#D9DDEA','#F1E6D2','#EFD08D',0.45],
  [ 3,'#CFDDF6','#F3E7CC','#EFD08D',0.35],
  [12,'#C9DBF8','#E9F3F8','#E9F3F8',0],
  [90,'#C4D8F8','#E4F1F8','#E4F1F8',0]
];
function hex(h){ return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]; }
function mix(a,b,t){ a=hex(a); b=hex(b); return 'rgb('+[0,1,2].map(function(i){return M.round(a[i]+(b[i]-a[i])*t);}).join(',')+')'; }
function ara(tab, h){
  for(var i=0;i<tab.length-1;i++){ var A=tab[i], B=tab[i+1];
    if(h>=A[0] && h<=B[0]){ var t=(h-A[0])/(B[0]-A[0]); t=t*t*(3-2*t);
      return {z:mix(A[1],B[1],t), u:mix(A[2],B[2],t), i:mix(A[3],B[3],t), g:A[4]+(B[4]-A[4])*t}; } }
  var L=tab[tab.length-1]; return {z:L[1],u:L[2],i:L[3],g:L[4]};
}

/* ── katmanlar ── */
var css = document.createElement('style');
css.textContent =
 '.hero{position:relative;isolation:isolate}' +
 '.gok-perde{position:absolute;z-index:-1;top:-64px;bottom:-1px;left:50%;width:100vw;transform:translateX(-50%);pointer-events:none;overflow:hidden;' +
 '-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 85%,transparent 100%);mask-image:linear-gradient(180deg,#000 0%,#000 85%,transparent 100%)}' +
 '.gok-perde>div,.gok-perde>canvas{position:absolute;inset:0;width:100%;height:100%;transition:opacity 1.2s,background 1.2s}' +
 '.gok-durum{font:500 .8rem/1.6 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.03em;color:var(--mut);margin:.6rem auto 0;max-width:34rem}' +
 /* nav dikişi: ana sayfada menü gökyüzünü kesmesin */
 '.sbnav{background:rgba(var(--bg-rgb),.55)!important;border-bottom-color:rgba(var(--ink-rgb),.06)!important}' +
 '.gok-durum b{font-weight:500;color:var(--ink)}';
document.head.appendChild(css);

var perde = document.createElement('div'); perde.className = 'gok-perde'; perde.setAttribute('aria-hidden','true');
var zemin = document.createElement('div'), isik = document.createElement('div'), cv = document.createElement('canvas');
perde.appendChild(zemin); perde.appendChild(cv); perde.appendChild(isik);
hero.insertBefore(perde, hero.firstChild);

var durum = document.createElement('div'); durum.className = 'gok-durum';
var p = hero.querySelector('p'); if(p) p.insertAdjacentElement('afterend', durum);

/* ── yıldızlar: gün boyu aynı gök (tohum = tarih), renkler siyah cisimden ── */
var RENK = [['#AABFF9',3],['#D6DDF9',8],['#F8F2F9',14],['#F9EADF',16],['#F9D7B4',12],['#F9BB77',5]];
var torba = []; RENK.forEach(function(r){ for(var i=0;i<r[1];i++) torba.push(r[0]); });
var yildiz = [], tohum;
function rnd(){ tohum = (tohum*16807) % 2147483647; return (tohum-1)/2147483646; }
function yildizKur(){
  var d = simdi(); tohum = d.getFullYear()*372 + d.getMonth()*31 + d.getDate() + 7;
  var w = perde.clientWidth, h = perde.clientHeight, n = M.round(M.min(420, w*h/3600));
  yildiz = [];
  for(var i=0;i<n;i++){ var parlak = M.pow(rnd(), 3.2);
    yildiz.push({x:rnd()*w, y:rnd()*h*0.9, r:0.35+parlak*1.5, a:0.35+parlak*0.65, c:torba[M.floor(rnd()*torba.length)], f:rnd()*6.283, s:0.4+rnd()*1.1}); }
}
var ctx = cv.getContext('2d'), dpr = M.min(2, window.devicePixelRatio||1), gorunurluk = 0;
var hareket = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function boyut(){ cv.width = perde.clientWidth*dpr; cv.height = perde.clientHeight*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); yildizKur(); }
var gorunur = true, calisiyor = false;
function baslat(){ if(!calisiyor && gorunur){ calisiyor = true; requestAnimationFrame(ciz); } }
function ciz(t){
  ctx.clearRect(0,0,cv.width,cv.height);
  if(gorunurluk > 0.01) for(var i=0;i<yildiz.length;i++){ var s = yildiz[i];
    var tit = hareket ? 0.78 + 0.22*M.sin(t/1000*s.s + s.f) : 1;
    ctx.globalAlpha = s.a*tit*gorunurluk; ctx.fillStyle = s.c;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }
  ctx.globalAlpha = 1;
  if(hareket && gorunurluk > 0.01 && gorunur) requestAnimationFrame(ciz); else calisiyor = false;
}

/* ── hesapla ve boya ── */
function evreAdi(h, saat){
  var sabah = saat < 12;
  if(h > 6) return 'gündüz';
  if(h > 0) return 'altın saat';
  if(h > -4) return sabah ? 'şafak' : 'gün batımı';
  if(h > -6) return 'mavi saat';
  if(h > -12) return 'alacakaranlık';
  if(h > -18) return sabah ? 'tan ağarmadan önce' : 'gece iniyor';
  return 'gece';
}
/* "06:52'de", "19:10'da", "07:40'ta" — son okunan sayının ünlüsü ve sertliği */
function saatEk(sa, dk){
  var n = dk || sa % 12 || 12, son;
  var BIR = {0:'',1:'bir',2:'iki',3:'üç',4:'dört',5:'beş',6:'altı',7:'yedi',8:'sekiz',9:'dokuz'};
  var ON = {1:'on',2:'yirmi',3:'otuz',4:'kırk',5:'elli'};
  son = n % 10 ? BIR[n % 10] : (ON[M.floor(n/10)] || 'on iki');
  if(!dk && (sa % 12 === 0)) son = 'iki';
  var unlu = son.replace(/[^aeıioöuü]/g,'').slice(-1), kalin = /[aıou]/.test(unlu);
  var sert = /[çfhkpsşt]$/.test(son);
  return "'" + (sert ? 't' : 'd') + (kalin ? 'a' : 'e');
}
/* bir sonraki gün doğumu (gece) ya da batımı (gündüz), 2 dk adımla ≤ 26 saat ileri */
function sonrakiOlay(d, gunduz){
  var t = d.getTime(), onceki = gunesYuk(d, yer.lat, yer.lon) + 0.833;
  for(var k=1;k<=780;k++){
    var u = new Date(t + k*120000), v = gunesYuk(u, yer.lat, yer.lon) + 0.833;
    if(gunduz ? (onceki > 0 && v <= 0) : (onceki < 0 && v >= 0)){
      var sa = ('0'+u.getHours()).slice(-2) + ':' + ('0'+u.getMinutes()).slice(-2);
      var yarin = u.getDate() !== d.getDate() && d.getHours() >= 12;
      return (yarin ? 'yarın ' : '') + sa + saatEk(u.getHours(), u.getMinutes()) + (gunduz ? ' batıyor' : ' doğuyor');
    }
    onceki = v;
  }
  return '';
}
function boya(){
  var d = simdi(), h = gunesYuk(d, yer.lat, yer.lon), gunduzTema = H.getAttribute('data-tema') === 'gunduz';
  var c = ara(gunduzTema ? GUNDUZ : GECE, h);
  zemin.style.background = 'linear-gradient(180deg,' + c.z + ' 0%,' + c.u + ' 100%)';
  isik.style.background = 'radial-gradient(120% 55% at 50% 82%,' + c.i + ' 0%,rgba(0,0,0,0) 70%)';
  isik.style.opacity = c.g.toFixed(2);
  gorunurluk = gunduzTema ? 0 : (h <= -12 ? 1 : h >= 4 ? 0.12 : 0.12 + 0.88*(4-h)/16);
  if(hareket){ if(gorunurluk > 0.01) baslat(); } else ciz(0);
  var ay = ayEvre(d), yk = M.round(M.abs(h)), gun;
  if(M.abs(h) < 8){ gun = 'Güneş ufkun <b>' + yk + '°</b> ' + (h > 0 ? 'üstünde' : 'altında'); }
  else { var olay = sonrakiOlay(d, h > 0); gun = olay ? 'Güneş <b>' + olay + '</b>' : ''; }
  var yerde = /[aıou][^aeıioöuü]*$/.test(yer.ad) ? "'da" : "'de";
  if(/[fstkçşhp]$/i.test(yer.ad)) yerde = yerde.replace('d','t');
  durum.innerHTML = '<span style="display:block">Şu an ' + yer.ad + yerde + ' <b>' + evreAdi(h, d.getHours()) + '</b></span>' +
    '<span style="display:block">' + (gun ? gun + ' · ' : '') + 'Ay <b>%' + ay.yuzde + '</b>, ' + ay.ad.replace(/ ay$/, '') + '</span>';
}
boyut(); boya(); if(hareket) baslat(); else ciz(0);
if('IntersectionObserver' in window) new IntersectionObserver(function(e){ gorunur = e[0].isIntersecting; if(gorunur && hareket) baslat(); }).observe(perde);
(function bekle(n){ if(window.Astronomy) boya(); else if(n < 60) setTimeout(function(){ bekle(n+1); }, 500); })(0);
setInterval(boya, 60000);
var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ boyut(); if(!hareket) ciz(0); }, 150); });
new MutationObserver(boya).observe(H, {attributes:true, attributeFilter:['data-tema']});
})();
