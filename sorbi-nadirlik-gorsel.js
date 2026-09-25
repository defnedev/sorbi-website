/*! sorbi-nadirlik-gorsel.js — nadirlik gösterimi: taban halkası + kademe cetveli. Tek bileşen, iki tip.
 * <div data-sorbi-nadirlik="halka|cetvel|oto" data-n="9" data-taban="12" data-alt="0"></div>
 *   n      : kaç kişide bir (tam sayı, servisten gelir; burada değiştirilmez, yalnız gösterilir)
 *   taban  : "herkes için beklenen" (varsayılan 12 = on iki burca eşit dağılım)
 *   alt    : "1" ise örneklemde hiç görülmedi; n alt sınırdır ("n'de 1'den seyrek")
 *   oto    : N < 50 → halka, N ≥ 50 → cetvel. Sayfa yalnız N ve tabanı verir; tipi bileşen seçer.
 * API: SorbiNadirlikGorsel.kur(kok) · .tip(N) · .yaz(N) → "9'da 1" · .yuvarla(N) · .bin(N) · .ek(N)
 *      .etiket(N,taban) → {kod:'siradan'|'seyrek'|'sik', ad:'biraz daha sık', sap:0.33}
 *      .cumle(N,taban)  → "Herkeste 12'de 1 · sende 9'da 1"
 * Dış bağımlılık yok. Renk yalnız sitenin altı rolü (--bg --ink --mut --dim --acc --acc-ink) ve alfaları;
 * SVG içinde var() doğrudan çalıştığı için tema değişince yeniden çizmeye gerek yok.
 *
 * DÜRÜSTLÜK KURALI (zorunlu): tek yerleşimde beklenenden sapma %10'un altındaysa hiçbir yargı
 * sözü yazılmaz — halka zaten payı gösteriyor, "sıradan" başlığı kaldırıldı (bkz PO kararı 2026-09-25).
 * Nadirlik sözü yalnız sapma belirginken (±%10 üstü) ya da bileşimlerde (cetvel) mertebesiyle söylenir.
 */
(function(){
'use strict';
var W=window,D=document,M=Math,TAU=M.PI*2;
var ESIK=50;           /* N < ESIK → halka (sapma), N ≥ ESIK → cetvel (mertebe) */
var AZ=!!(W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches);

var CSS='.sng{display:block;min-width:0}'
+'.sng svg{width:100%;height:auto;display:block;overflow:visible}'
+'.sng-halka{max-width:190px}'
+'.sng .dilim{fill:rgba(var(--ink-rgb),.13)}'
+'.sng .dilim-sonuk{fill:rgba(var(--ink-rgb),.07)}'
+'.sng .beklenen{fill:none;stroke:rgba(var(--ink-rgb),.55);stroke-width:1;stroke-dasharray:3 3}'
+'.sng .sende{fill:var(--acc);transform-box:view-box;transform-origin:50% 50%}'
+'.sng .sende-siradan{fill:var(--ink)}'
+'.sng .buyuk{fill:var(--ink);font-family:Fraunces,Georgia,serif;font-weight:600;font-size:32px}'
+'.sng .kucuk{fill:var(--mut);font-family:Inter,system-ui,sans-serif;font-size:12px}'
+'.sng .etiket{fill:var(--acc);font-family:Inter,system-ui,sans-serif;font-size:12.5px;font-weight:600;letter-spacing:.02em}'
+'.sng .etiket-siradan{fill:var(--mut);font-weight:500}'
+'.sng .eksen{stroke:rgba(var(--ink-rgb),.28);stroke-width:1.2}'
+'.sng .kilavuz{stroke:rgba(var(--ink-rgb),.28);stroke-width:1;stroke-dasharray:2 3}'
+'.sng .centik{stroke:var(--ink);stroke-width:1.2}'
+'.sng .kademe{fill:var(--ink);font-family:ui-monospace,Menlo,monospace;font-size:11.5px}'
+'.sng .insan{fill:var(--mut);font-family:Inter,system-ui,sans-serif;font-size:11px}'
+'.sng .dolgu{stroke:var(--acc);stroke-width:4;stroke-linecap:round;opacity:.9;fill:none}'
+'.sng .isaret{fill:var(--acc);stroke:var(--bg);stroke-width:2.5}'
+'.sng .isaret-alt{fill:var(--bg);stroke:var(--acc);stroke-width:2.5}'
+'.sng .deger{fill:var(--acc);font-family:Fraunces,Georgia,serif;font-weight:600;font-size:14px}'
+'@media(prefers-reduced-motion:no-preference){'
+'.sng .sende{animation:sngBuyu .6s cubic-bezier(.2,.7,.2,1) both}'
+'.sng .dolgu{stroke-dasharray:1;stroke-dashoffset:1;animation:sngAk .8s ease-out .1s forwards}'
+'.sng .isaret,.sng .deger{opacity:0;animation:sngGel .4s ease-out .7s forwards}'
+'@keyframes sngBuyu{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}'
+'@keyframes sngAk{to{stroke-dashoffset:0}}'
+'@keyframes sngGel{to{opacity:1}}}';

/* ── sayı yazımı: tek kural ─────────────────────────────────────────
   N < 1.000 tam · 1.000–99.999 yüzlüğe · 100.000+ binliğe yuvarlanır.
   Sayı servisten gelir; burası yalnız gösterimi yuvarlar. */
function bin(n){ return String(M.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
function yuvarla(n){ n=M.round(+n||0); if(n<1000) return n; if(n<100000) return M.round(n/100)*100; return M.round(n/1000)*1000; }
/* Türkçe bulunma eki, son okunan basamağa göre: 9'da, 13'te, 40'ta, 1.600'de, 100.000'de */
function ek(n){
  var s=String(M.round(n)), m=s.match(/([1-9])(0*)$/); if(!m) return "'de";
  var d=m[1], z=m[2].length, T;
  if(z===0) T={1:"'de",2:"'de",3:"'te",4:"'te",5:"'te",6:"'da",7:"'de",8:"'de",9:"'da"};
  else if(z===1) T={1:"'da",2:"'de",3:"'da",4:"'ta",5:"'de",6:"'ta",7:"'te",8:"'de",9:"'da"};
  else if(z>=2&&z<=5) T={1:"'de",2:"'de",3:"'de",4:"'de",5:"'de",6:"'de",7:"'de",8:"'de",9:"'de"}; /* yüz, bin, on bin, yüz bin */
  else T={1:"'da",2:"'da",3:"'da",4:"'da",5:"'da",6:"'da",7:"'da",8:"'da",9:"'da"};                /* milyon */
  return T[d];
}
function yaz(n){ var y=yuvarla(n); return bin(y)+ek(y)+' 1'; }
function tip(n){ return (+n)<ESIK?'halka':'cetvel'; }
/* Sapma etiketi — dürüstlük kuralı burada. */
function etiket(n,taban){
  taban=+taban||12; var pay=taban/(+n||taban), sap=pay-1, kod, ad;
  if(M.abs(sap)<.10){ kod='siradan'; ad=''; }
  else if(sap<0){ kod='seyrek'; ad=sap<-.35?'belirgin daha seyrek':'biraz daha seyrek'; }
  else { kod='sik'; ad=sap>.35?'belirgin daha sık':'biraz daha sık'; }
  return {kod:kod, ad:ad, sap:sap};
}
function cumle(n,taban){ taban=+taban||12; return 'Herkeste '+yaz(taban)+' · sende '+yaz(n); }
/* İnsan ölçeği cümlesi (bileşim): "bir mahallede yaklaşık 1 kişi" */
function insan(n){
  n=+n;
  if(n<=1000) return 'bir mahallede yaklaşık '+M.max(1,M.round(1000/n))+' kişi';
  if(n<=100000) return 'bir ilçede yaklaşık '+M.max(1,M.round(100000/n))+' kişi';
  return 'bir ilde bir iki kişi';
}

/* ── geometri ── */
function pol(cx,cy,r,a){ return [cx+r*M.cos(a), cy+r*M.sin(a)]; }
function dilim(cx,cy,r0,r1,a0,a1){
  var p0=pol(cx,cy,r1,a0),p1=pol(cx,cy,r1,a1),p2=pol(cx,cy,r0,a1),p3=pol(cx,cy,r0,a0), big=(a1-a0)>M.PI?1:0;
  return 'M'+p0[0].toFixed(1)+' '+p0[1].toFixed(1)+' A'+r1+' '+r1+' 0 '+big+' 1 '+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+
    ' L'+p2[0].toFixed(1)+' '+p2[1].toFixed(1)+' A'+r0+' '+r0+' 0 '+big+' 0 '+p3[0].toFixed(1)+' '+p3[1].toFixed(1)+' Z';
}

/* ── HALKA: 12 eşit dilim = beklenen; senin dilimin payı kadar geniş/dar ── */
function halkaCiz(N,taban,alt){
  var cx=100,cy=100,r0=64,r1=92,gap=.022,h='',i,a0,a1;
  var tek=N<ESIK, pay=taban/N, et=etiket(N,taban), siradan=et.kod==='siradan';
  for(i=0;i<taban;i++){ a0=-M.PI/2+i*TAU/taban+gap; a1=-M.PI/2+(i+1)*TAU/taban-gap;
    h+='<path class="'+(tek?'dilim':'dilim-sonuk')+'" d="'+dilim(cx,cy,r0,r1,a0,a1)+'"/>'; }
  var aria;
  if(tek){
    var m=-M.PI/2+TAU/(taban*2), yar=(TAU/(taban*2))*pay;
    h+='<path class="beklenen" d="'+dilim(cx,cy,r0-2,r1+2,-M.PI/2+gap,-M.PI/2+TAU/taban-gap)+'"/>';
    h+='<path class="sende'+(siradan?' sende-siradan':'')+'" d="'+dilim(cx,cy,r0-2,r1+2,m-yar,m+yar)+'"/>';
    h+='<text class="buyuk" x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" dominant-baseline="central">1/'+bin(N)+'</text>';
    h+='<text class="kucuk" x="'+cx+'" y="'+(cy+20)+'" text-anchor="middle" dominant-baseline="central">beklenen 1/'+bin(taban)+'</text>';
    if(!siradan) h+='<text class="etiket" x="'+cx+'" y="'+(cy+38)+'" text-anchor="middle" dominant-baseline="central">'+et.ad+'</text>';
    aria='Herkeste '+yaz(taban)+', sende '+yaz(N)+(siradan?'.':' — '+et.ad+'.');
  } else {
    h+='<text class="kucuk" x="'+cx+'" y="'+(cy-6)+'" text-anchor="middle" dominant-baseline="central">tek dilim değil</text>';
    h+='<text class="kucuk" x="'+cx+'" y="'+(cy+9)+'" text-anchor="middle" dominant-baseline="central">bileşim → cetvel</text>';
    aria='Bu bir bileşim; mertebesi kademe cetvelinde gösterilir.';
  }
  return '<svg viewBox="0 0 200 200" role="img" aria-label="'+aria+'">'+h+'</svg>';
}

/* ── CETVEL: logaritmik kademe 12 · 100 · 1.000 · 10.000 · 100.000 + insan ölçeği ── */
var INSAN=[[30,'bir sınıf'],[1000,'bir mahalle'],[100000,'bir ilçe']];
var KADEME=[12,100,1000,10000,100000];
function cetvelCiz(N,taban,alt,gen){
  var W_=M.max(300,M.round(gen||600)),H=128,x0=30,x1=W_-30,y=84,h='',dar=W_<520;
  var lg=function(n){return M.log(n)/M.LN10;};
  var X=function(n){ return x0+(lg(n)-lg(10))/(lg(100000)-lg(10))*(x1-x0); };
  /* insan ölçeği (üst); dar ekranda ortadaki etiket bir kademe yukarı çıkar */
  INSAN.forEach(function(q,i){
    var x=X(q[0]), yy=(dar&&i===1)?y-50:y-36;
    h+='<line class="kilavuz" x1="'+x.toFixed(1)+'" y1="'+(yy+6)+'" x2="'+x.toFixed(1)+'" y2="'+(y-8)+'"/>';
    var anc=x>W_-70?'end':(x<70?'start':'middle');
    h+='<text class="insan" x="'+x.toFixed(1)+'" y="'+yy+'" text-anchor="'+anc+'">'+q[1]+' · '+bin(q[0])+'</text>';
  });
  h+='<line class="eksen" x1="'+x0+'" y1="'+y+'" x2="'+x1+'" y2="'+y+'"/>';
  /* dolgu: tabandan N'e — mertebe hissi */
  var xn=M.max(x0,M.min(x1,X(M.max(N,taban))));
  h+='<path class="dolgu" pathLength="1" d="M'+X(taban).toFixed(1)+' '+y+' L'+xn.toFixed(1)+' '+y+'"/>';
  KADEME.forEach(function(n,i){
    var x=X(n);
    h+='<line class="centik" x1="'+x.toFixed(1)+'" y1="'+(y-5)+'" x2="'+x.toFixed(1)+'" y2="'+(y+5)+'"/>';
    /* dar ekranda kademe etiketleri kademeli: tek/çift satır */
    var yy=(dar&&(i%2))?y+34:y+22;
    h+='<text class="kademe" x="'+x.toFixed(1)+'" y="'+yy+'" text-anchor="middle">'+bin(n)+'</text>';
  });
  h+='<circle class="'+(alt?'isaret-alt':'isaret')+'" cx="'+xn.toFixed(1)+'" cy="'+y+'" r="7"/>';
  var lx=M.max(x0+40,M.min(x1-40,xn)), dy=dar?52:42;
  h+='<text class="deger" x="'+lx.toFixed(1)+'" y="'+(y+dy)+'" text-anchor="middle">'+yaz(N)+(alt?"'den seyrek":'')+'</text>';
  if(dar) H=140;
  var aria='Kademe cetveli: '+yaz(N)+(alt?"'den seyrek":'')+' — '+insan(N)+'.';
  return '<svg viewBox="0 0 '+W_+' '+H+'" role="img" aria-label="'+aria+'">'+h+'</svg>';
}

/* ── kurulum ── */
var LISTE=[];
function ciz(el){
  var N=M.round(+el.getAttribute('data-n')||0), taban=+el.getAttribute('data-taban')||12;
  var alt=el.getAttribute('data-alt')==='1', t=el.getAttribute('data-sorbi-nadirlik')||'oto';
  if(t==='oto') t=tip(N);
  if(!(N>0)){ el.hidden=true; return; }
  el.hidden=false; el.classList.add('sng'); el.classList.toggle('sng-halka',t==='halka');
  el.setAttribute('data-tip',t);
  el.innerHTML = t==='halka' ? halkaCiz(N,taban,alt) : cetvelCiz(N,taban,alt,el.clientWidth);
  el.__sngImza=t+'|'+N+'|'+taban+'|'+alt+'|'+(t==='cetvel'?el.clientWidth:0);
}
function kur(kok){
  kok=kok||D;
  if(!D.getElementById('sngCss')){ var s=D.createElement('style'); s.id='sngCss'; s.textContent=CSS; (D.head||D.body).appendChild(s); }
  var L=kok.querySelectorAll?kok.querySelectorAll('[data-sorbi-nadirlik]'):[];
  for(var i=0;i<L.length;i++){ ciz(L[i]); if(LISTE.indexOf(L[i])<0) LISTE.push(L[i]); }
}
/* Cetvel genişliğe bağlı; yeniden boyutta yalnız değişenler çizilir. */
var zam=0;
W.addEventListener('resize',function(){
  clearTimeout(zam);
  zam=setTimeout(function(){
    LISTE=LISTE.filter(function(el){ return D.body.contains(el); });
    LISTE.forEach(function(el){
      if(el.getAttribute('data-tip')!=='cetvel') return;
      var im=el.__sngImza||''; if(im.split('|').pop()!==String(el.clientWidth)) ciz(el);
    });
  },120);
});

W.SorbiNadirlikGorsel={kur:kur, tip:tip, yaz:yaz, yuvarla:yuvarla, bin:bin, ek:ek, etiket:etiket, cumle:cumle, insan:insan, ESIK:ESIK};
if(D.readyState==='loading') D.addEventListener('DOMContentLoaded',function(){kur();}); else kur();
})();
