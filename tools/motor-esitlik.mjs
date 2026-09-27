/* Motor eşitlik denetimi (T1) — sayfalara gömülü hesap kopyalarını ana motora karşı sınar.
   Çalıştırma (repo kökünde):  node tools/motor-esitlik.mjs
   Neden: yükselen/MC/eğiklik/ev fonksiyonları birkaç sayfada kopya duruyor. Kopyaları
   söküp tek motora bağlamak akışları riske atar; onun yerine her kopya burada
   sorbi-astro.js ile aynı ızgarada çalıştırılır. Bir kopya ayrışırsa exit 1 → deploy durur.
   Kapsam: normal doğum enlemleri (−60°…+60°). Kutup bölgesi bilinçli olarak dışarıda:
   orada ev sistemlerinin kendisi tanımsızlaşır ve sayfalar zaten bu enlemleri hedeflemiyor. */
import fs from 'fs'; import vm from 'vm';

const SAYFALAR = ['bugun.html','dogum-haritasi-hesaplama.html','haritam.html','seni-taniyorum.html','detayli-dogum-haritasi.html'];
const FONK = ['ascendant','obliquity','mcLon','houseOf'];

function cek(src, fn){
  const m = src.match(new RegExp('function\\s+'+fn+'\\s*\\([^)]*\\)\\s*\\{'));
  if(!m) return null;
  let d=0; for(let k=m.index+m[0].length-1;k<src.length;k++){
    if(src[k]==='{') d++; else if(src[k]==='}'){ d--; if(d===0) return src.slice(m.index,k+1); } }
  return null;
}
const YARDIM = 'var RAD=Math.PI/180,DEG=180/Math.PI;function norm(x){return ((x%360)+360)%360;}'+
  'function sin(a){return Math.sin(a*RAD);}function cos(a){return Math.cos(a*RAD);}function tan(a){return Math.tan(a*RAD);}'+
  'function atan2(y,x){return Math.atan2(y,x)*DEG;}';
function derle(kodlar){
  const ctx = { Math }; vm.createContext(ctx);
  vm.runInContext(YARDIM + kodlar.join('\n'), ctx); return ctx;
}

/* referans: ana motor */
const ana = fs.readFileSync('sorbi-astro.js','utf8');
const R = derle(['ascLon','mcLon','br','obliquity','houseOf'].map(f=>cek(ana,f)));
const refAsc = (r,e,lat) => R.br(R.ascLon(r,e,lat), R.mcLon(r,e));

const fark = (a,b) => Math.abs(((a-b+540)%360)-180);
const hatalar = []; let olcum = 0; const bulunan = {};

for(const f of SAYFALAR){
  const src = fs.readFileSync(f,'utf8');
  const var_ = FONK.filter(fn=>cek(src,fn));
  if(!var_.length) continue;
  bulunan[f] = var_;
  const C = derle(var_.map(fn=>cek(src,fn)));
  for(let r=0;r<360;r+=7) for(const e of [23.0,23.44,23.9]) for(let lat=-60;lat<=60;lat+=5){
    olcum++;
    if(C.ascendant){ const d=fark(C.ascendant(r,e,lat), refAsc(r,e,lat)); if(d>1e-7) hatalar.push(`${f} ascendant r=${r} e=${e} lat=${lat}: ${d.toFixed(6)}°`); }
    if(C.mcLon){ const d=fark(C.mcLon(r,e), R.mcLon(r,e)); if(d>1e-7) hatalar.push(`${f} mcLon r=${r}: ${d.toFixed(6)}°`); }
  }
  if(C.obliquity) for(const tt of [-36525,-10000,0,5000,9500]){ olcum++; const d=Math.abs(C.obliquity({tt})-R.obliquity({tt})); if(d>1e-9) hatalar.push(`${f} obliquity tt=${tt}: ${d}`); }
  if(C.houseOf) for(let asc=0;asc<360;asc+=13){
    const c=[0]; const eq=[0]; for(let i=1;i<=12;i++){ c[i]=(Math.floor(asc/30)*30+(i-1)*30)%360; eq[i]=(asc+(i-1)*30)%360; }
    for(let l=0;l<360;l+=3){ olcum+=2;
      if(C.houseOf(l,c)!==R.houseOf(l,c)) hatalar.push(`${f} houseOf (burç evi) asc=${asc} l=${l}`);
      if(C.houseOf(l,eq)!==R.houseOf(l,eq)) hatalar.push(`${f} houseOf (eşit ev) asc=${asc} l=${l}`); }
  }
}
if(hatalar.length){
  console.log('MOTOR AYRIŞTI — '+hatalar.length+' fark:'); hatalar.slice(0,15).forEach(h=>console.log('  · '+h));
  process.exit(1);
}
console.log('motor eşit · '+Object.keys(bulunan).length+' sayfadaki kopya ana motorla '+olcum+' ölçümde aynı ('+
  Object.entries(bulunan).map(([f,v])=>f.replace('.html','')+':'+v.length).join(', ')+')');
