/* Öğren bölümü verisi — animasyonlar gerçek efemerisle çalışsın diye önceden hesaplanır.
   Çıktı: ogren-veri.json */
import fs from 'fs'; import vm from 'vm';
const ctx={console,Math,Date,Intl,JSON,Object,Array,String,Number,isNaN,parseInt,parseFloat};
ctx.window=ctx;ctx.globalThis=ctx;ctx.self=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('astronomy.browser.min.js','utf8'),ctx);
const A=ctx.window.Astronomy;
const B=A.Body;
const r3=(x)=>Math.round(x*1000)/1000;
const r2=(x)=>Math.round(x*100)/100;

/* ── 1. Merkür retrosu: 24 Ekim – 13 Kasım 2026 çevresinde 120 gün ── */
const bas=new Date('2026-09-05T12:00:00Z');
const gun=120;
const retro={ etiket:'Merkür retrosu · Sonbahar 2026', bas:bas.toISOString().slice(0,10), kareler:[] };
let oncekiLon=null;
for(let i=0;i<gun;i++){
  const d=new Date(bas.getTime()+i*86400000);
  const t=A.MakeTime(d);
  const hm=A.HelioVector(B.Mercury,t), he=A.HelioVector(B.Earth,t);
  const lon=A.Ecliptic(A.GeoVector(B.Mercury,t,true)).elon;
  let geri=false;
  if(oncekiLon!==null){ let d2=lon-oncekiLon; if(d2>180)d2-=360; if(d2<-180)d2+=360; geri=d2<0; }
  oncekiLon=lon;
  retro.kareler.push({ t:d.toISOString().slice(0,10),
    mx:r3(hm.x), my:r3(hm.y), ex:r3(he.x), ey:r3(he.y), lon:r2(lon), geri });
}

/* ── 2. Merkür Güneş'ten ne kadar uzaklaşabiliyor: 2 yıl, günlük açı farkı ── */
const uzaklik={ etiket:'Merkür ile Güneş arasındaki açı · 2026–2027', bas:'2026-01-01', kareler:[] };
{
  const b=new Date('2026-01-01T12:00:00Z');
  for(let i=0;i<730;i+=2){
    const t=A.MakeTime(new Date(b.getTime()+i*86400000));
    const gm=A.Ecliptic(A.GeoVector(B.Mercury,t,true)).elon;
    const gs=A.Ecliptic(A.GeoVector(B.Sun,t,true)).elon;
    let f=gm-gs; if(f>180)f-=360; if(f<-180)f+=360;
    uzaklik.kareler.push(r2(f));
  }
}

/* ── 3. Yükselen bir günde nasıl dönüyor: İstanbul, 24 saat, 10 dakikada bir ── */
const yukselen={ etiket:'Bir günde yükselen · İstanbul', tarih:'2026-03-20', kareler:[] };
{
  const RAD=Math.PI/180, DEG=180/Math.PI;
  const norm=(x)=>((x%360)+360)%360;
  const lat=41.0082, lon=28.9784;
  for(let dk=0; dk<1440; dk+=10){
    const d=new Date(Date.UTC(2026,2,20,0,0,0)+dk*60000);
    const t=A.MakeTime(d);
    const T=t.tt/36525;
    const eps=(84381.448-46.8150*T-0.00059*T*T+0.001813*T*T*T)/3600;
    const armc=norm(A.SiderealTime(t)*15+lon);
    const oa=armc+90;
    const asc=norm(Math.atan2(Math.cos(oa*RAD),
      -(Math.sin(oa*RAD)*Math.cos(eps*RAD)+Math.tan(lat*RAD)*Math.sin(eps*RAD)))*DEG);
    yukselen.kareler.push({ dk, asc:r2(asc) });
  }
}

const cikti={ uretim:new Date().toISOString().slice(0,10), retro, uzaklik, yukselen };
fs.writeFileSync('ogren-veri.json', JSON.stringify(cikti));
const geriGun=retro.kareler.filter(k=>k.geri).length;
console.error('retro: '+retro.kareler.length+' gün, '+geriGun+' günü geri hareketli');
console.error('  geri başlangıç: '+(retro.kareler.find(k=>k.geri)||{}).t);
const son=[...retro.kareler].reverse().find(k=>k.geri);
console.error('  geri bitiş: '+(son||{}).t);
const enBuyuk=Math.max(...uzaklik.kareler.map(Math.abs));
console.error('uzaklik: en büyük açı '+enBuyuk.toFixed(1)+'° (gerçekte ~28° olmalı)');
const burclar=new Set(yukselen.kareler.map(k=>Math.floor(k.asc/30)));
console.error('yükselen: bir günde '+burclar.size+' farklı burç yükseliyor');
console.error('dosya: '+(fs.statSync('ogren-veri.json').size/1024).toFixed(0)+' KB');
