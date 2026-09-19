/* Sayım üretici — retro payları, yığın, 29. derece. Çalıştırma: node tools/sayim-uret.mjs
   Çıktı: sayim-veri.json. 1960–2012, günde bir örnek (öğle, İstanbul), gerçek efemeris. */
import fs from 'fs'; import vm from 'vm';
const ctx={console,Math,Date,Intl,JSON,Object,Array,String,Number,isNaN,parseInt,parseFloat,TextEncoder,setTimeout};
ctx.window=ctx;ctx.globalThis=ctx;ctx.self=ctx;vm.createContext(ctx);
for(const f of ['astronomy.browser.min.js','sorbi-astro.js','sorbi-yildiz-say.js']) vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const A=ctx.window.SorbiAstro, Y=ctx.window.SORBI_YILDIZ_SAY;
const P=['mer','ven','mar','jup','sat','ura','nep','plu'];
const rx={},es={}; P.forEach(k=>{rx[k]=0;});
for(let i=0;i<=5;i++)es[i]=0;
let n=0;
const K7=['sun','moon','mer','ven','mar','jup','sat'], K10=K7.concat(['ura','nep','plu']);
const yig7={},yig10={},anar={hic:0,bir:0,ikiArti:0}, anarGez={}; K7.forEach(k=>anarGez[k]=0);
const b=l=>Math.floor((((l%360)+360)%360)/30), der=l=>Math.floor((((l%360)+360)%360)%30);
let merOnce=false, merBas=null, donem=[];
for(let y=1960;y<=2012;y++)for(let m=1;m<=12;m++)for(let d=1;d<=31;d++){
  const dt=new Date(Date.UTC(y,m-1,d,9,0)); if(dt.getUTCMonth()!==m-1)continue;
  const ch=A.chart({y,mo:m,d,h:12,mi:0,tz:'Europe/Istanbul',lat:41.0082,lon:28.9784,house:'W'});
  const R={},L={}; ch.pls.forEach(p=>{L[p.k]=p.lon;if(P.includes(p.k))R[p.k]=p.rx;});
  P.forEach(k=>{if(R[k])rx[k]++;});
  const k5=['mer','ven','mar','jup','sat'].filter(k=>R[k]).length; es[k5]++;
  const enb=(ks)=>{const c=new Array(12).fill(0);ks.forEach(k=>c[b(L[k])]++);return Math.max(...c);};
  const m7=enb(K7),m10=enb(K10); yig7[m7]=(yig7[m7]||0)+1; yig10[m10]=(yig10[m10]||0)+1;
  let a=0; K7.forEach(k=>{if(der(L[k])===29){a++;anarGez[k]++;}}); anar[a===0?'hic':a===1?'bir':'ikiArti']++;
  if(R.mer&&!merOnce){merBas=dt;} if(!R.mer&&merOnce){donem.push((dt-merBas)/864e5);} merOnce=R.mer;
  n++;
}
const out={n, yil:'1960–2012', rx:Object.fromEntries(P.map(k=>[k,rx[k]])), esZamanli5:es,
  yigin7:yig7, yigin10:yig10, anaretik:anar, anaretikGez:anarGez,
  merDonem:{adet:donem.length, ortGun:+(donem.reduce((a,b)=>a+b,0)/donem.length).toFixed(1), yilBasina:+(donem.length/53).toFixed(2)},
  yildiz:{n:Y.n, oob:Y.oobGez, bagsiz:Y.bagsizGez}};
fs.writeFileSync('sayim-veri.json',JSON.stringify(out));
console.log(JSON.stringify(out));
