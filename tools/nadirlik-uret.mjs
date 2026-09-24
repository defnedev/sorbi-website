/* Nadirlik tablosu üretici — gerçek efemerisle örnekleme, tahmin değil sayım.
   1950–2009 arasından 24.000 harita hesaplar, yerleşim sıklıklarını sayar.
   Çalıştırma (repo kökünde, ~5 dakika):  node tools/nadirlik-uret.mjs
   Çıktı: nadirlik-veri.json  (nadirlik.html bunu okur)
   Örneklem büyütülürse nadir üçlülerin çözünürlüğü artar; dosya da büyür.

   SAAT IZGARASI — NEDEN KAYDIRMALI (2026-09-22)
   Eskiden gün içi örnek saati `Math.floor(h*24/SAAT_SAYISI)` ile seçiliyordu.
   SAAT_SAYISI=10, 24 saati tam bölmediği için bu ızgara DÜZENSİZDİ: örnekler
   00:00, 02:07, 04:14, 07:21, 09:28, 12:35, 14:42, 16:49, 19:56, 21:03'e
   düşüyor, aralar 1,12 saat ile 3,12 saat arasında geziniyordu (düzgün olsa
   hepsi 2,40 saat olurdu). Üstelik ızgara her gün aynı yerel saatlere
   oturuyordu; yıldız günü güneş gününden ~3 dk 56 sn kısa olduğu için bu
   sabitlik yıldız zamanına göre örtüşme (aliasing) yapar ve yükselen
   dağılımını eğer. tools/ozellik-say.mjs'te ölçülen etki (n=210.384):
     sabit ızgara      → en sık Terazi %10,67, kat farkı 2,199
     kaydırmalı ızgara → en sık Aslan  %10,65, kat farkı 2,161
     kuramsal (41°K)   → Aslan/Akrep %10,65, kat farkı 2,161
   Çözüm ozellik-say.mjs ile AYNI: her günün örnekleri altın oran kadar
   kaydırılır (düşük tutarsızlıklı dizi) ve gün 24 saate düzgün bölünür.
   Örnek sayısı, dosya biçimi ve süre AYNI kalır; yalnız önyargı gider.

   BU DOSYA KİM OKUYOR (2026-09-22): hiçbir sayfa okumuyor. Tek okuyan
   tools/kitapcik.mjs — Güneş/Ay/Yükselen için "kaç kişide bir" satırlarını
   buradan alıyor. Yükselen satırı doğrudan bu ızgaraya bağlı olduğu için
   dosya emekliye ayrılmadı, doğru yöntemle yeniden üretildi. */
import fs from 'fs'; import vm from 'vm';
const ctx={console,Math,Date,Intl,JSON,Object,Array,String,Number,isNaN,parseInt,parseFloat,TextEncoder,setTimeout};
ctx.window=ctx;ctx.globalThis=ctx;ctx.self=ctx;vm.createContext(ctx);
for(const f of ['astronomy.browser.min.js','sorbi-astro.js']) vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const A=ctx.window.SorbiAstro;

const YIL_BAS=1950, YIL_SON=2009, TARIH_SAYISI=40, SAAT_SAYISI=10;
const LAT=41.0082, LON=28.9784, TZ='Europe/Istanbul';   // yükselen dağılımı enleme bağlı
const KLASIK=['sun','moon','mer','ven','mar','jup','sat'];
const TUM=['sun','moon','mer','ven','mar','jup','sat','ura','nep','plu','chi','nod'];
const burc=(l)=>Math.floor(((l%360)+360)%360/30);
const PHI=0.6180339887498949;   // altın oranın kesri — kaydırmalı saat ızgarası
const say={ t:0, b:{}, r:{}, u:{}, e:[0,0,0,0], s:0, rs:{}, g:0 };
TUM.forEach(k=>{ say.b[k]=new Array(12).fill(0); say.r[k]=0; });
say.b.asc=new Array(12).fill(0); say.b.mc=new Array(12).fill(0);
const art=(o,k)=>{ o[k]=(o[k]||0)+1; };
let hata=0; const t0=Date.now();

for(let y=YIL_BAS;y<=YIL_SON;y++){
  for(let i=0;i<TARIH_SAYISI;i++){
    const d=new Date(Date.UTC(y,0,1));
    d.setUTCDate(d.getUTCDate()+Math.floor(i*365/TARIH_SAYISI)+((y*7)%9)); // yıllar arası kayma: mevsim hizası olmasın
    for(let h=0;h<SAAT_SAYISI;h++){
      /* güne özgü kaydırma: mutlak gün sayısına bağlı, böylece her gün başka faz */
      const kay=((d.getTime()/86400000)*PHI)%1;
      const dk=Math.round((h+kay)*1440/SAAT_SAYISI)%1440;
      let ch; try{
        ch=A.chart({y:d.getUTCFullYear(),mo:d.getUTCMonth()+1,d:d.getUTCDate(),
                    h:Math.floor(dk/60),mi:dk%60,tz:TZ,lat:LAT,lon:LON,house:'P'});
      }catch(e){ hata++; continue; }
      say.t++; if(ch.day) say.g++;
      const pl={}; ch.pls.forEach(p=>pl[p.k]=p);
      const elem=[0,0,0,0], burcSayaci={}; let retro=0;
      TUM.forEach(k=>{ const p=pl[k]; if(!p) return;
        const b=burc(p.lon); say.b[k][b]++;
        if(p.rx){ say.r[k]++; if(k!=='moon'&&k!=='sun'&&k!=='nod'&&k!=='chi') retro++; }
        if(KLASIK.indexOf(k)>=0){ elem[b%4]++; art(burcSayaci,b); } });
      const ab=burc(ch.asc); say.b.asc[ab]++; say.b.mc[burc(ch.mc)]++;
      art(say.u, burc(pl.sun.lon)+'-'+burc(pl.moon.lon)+'-'+ab);
      elem.forEach((v,e)=>{ if(v===0) say.e[e]++; });
      if(Object.values(burcSayaci).some(v=>v>=4)) say.s++;
      art(say.rs, String(retro));
    }
  }
  if(y%10===0) console.error('  '+y+'… '+say.t+' harita, '+((Date.now()-t0)/1000).toFixed(0)+'sn');
}
say.m={ yil_araligi:[YIL_BAS,YIL_SON], ornek_sayisi:say.t, enlem:LAT, hata,
        saatAdet:SAAT_SAYISI, izgara:'kaydirmali',
        uretim:new Date().toISOString().slice(0,10) };
fs.writeFileSync('nadirlik-veri.json', JSON.stringify(say));
console.error('BITTI: '+say.t+' harita, '+((Date.now()-t0)/1000).toFixed(0)+'sn, hata '+hata);
