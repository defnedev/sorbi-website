/* Nadirlik tablosu üretici — gerçek efemerisle örnekleme, tahmin değil sayım.
   1950–2009 arasından 24.000 harita hesaplar, yerleşim sıklıklarını sayar.
   Çalıştırma (repo kökünde, ~5 dakika):  node tools/nadirlik-uret.mjs
   Çıktı: nadirlik-veri.json  (nadirlik.html bunu okur)
   Örneklem büyütülürse nadir üçlülerin çözünürlüğü artar; dosya da büyür. */
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
      let ch; try{
        ch=A.chart({y:d.getUTCFullYear(),mo:d.getUTCMonth()+1,d:d.getUTCDate(),
                    h:Math.floor(h*24/SAAT_SAYISI),mi:(h*7)%60,tz:TZ,lat:LAT,lon:LON,house:'P'});
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
        uretim:new Date().toISOString().slice(0,10) };
fs.writeFileSync('nadirlik-veri.json', JSON.stringify(say));
console.error('BITTI: '+say.t+' harita, '+((Date.now()-t0)/1000).toFixed(0)+'sn, hata '+hata);
