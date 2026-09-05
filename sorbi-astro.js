/*! sorbi-astro.js — Sorbi ortak astroloji motoru
 *  Gerekli: /astronomy.browser.min.js
 *  İsteğe bağlı: /sorbi-eph.js (Chiron, Lilith, ortalama düğüm)
 *
 *  SorbiAstro.chart({y,mo,d,h,mi,tz,lat,lon,house,nodeType}) -> harita
 *  SorbiAstro.now({tz,lat,lon,house})                        -> şu anın haritası
 *  SorbiAstro.cross(natal, transit, orbMul, minor)           -> transit-natal açıları
 *  SorbiAstro.within(chart, orbMul, minor)                   -> harita içi açılar
 *  SorbiAstro.fmt(lon) / .dms(lon) / .SIGNS / .SGLYPH
 *
 *  Ev matematiği Swiss Ephemeris'e karşı arcsaniye düzeyinde doğrulandı.
 */
(function(){
"use strict";
var A=window.Astronomy;
var RAD=Math.PI/180, DEG=180/Math.PI;
function norm(x){return ((x%360)+360)%360;}
function sin(a){return Math.sin(a*RAD);} function cos(a){return Math.cos(a*RAD);} function tan(a){return Math.tan(a*RAD);}
function asin(x){return Math.asin(Math.max(-1,Math.min(1,x)))*DEG;} function atan(x){return Math.atan(x)*DEG;}
function atan2(y,x){return Math.atan2(y,x)*DEG;}
function sep(a,b){var d=Math.abs(norm(a-b)); return d>180?360-d:d;}
function pad2(n){ return String(n).padStart(2,'0'); }

var SIGNS=['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
var SGLYPH=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'];
var ELEM=['Ateş','Toprak','Hava','Su'], ELCOL=['#C75B39','#9E8B4E','#B58A5E','#5E8C86'];
var MODAL=['Öncü','Sabit','Değişken'];

var BODIES=[
 {k:'sun', n:'Güneş',  g:'☉︎', b:'Sun',     maj:1},
 {k:'moon',n:'Ay',     g:'☽︎', b:'Moon',    maj:1},
 {k:'mer', n:'Merkür', g:'☿︎', b:'Mercury', maj:1},
 {k:'ven', n:'Venüs',  g:'♀︎', b:'Venus',   maj:1},
 {k:'mar', n:'Mars',   g:'♂︎', b:'Mars',    maj:1},
 {k:'jup', n:'Jüpiter',g:'♃︎', b:'Jupiter', maj:1},
 {k:'sat', n:'Satürn', g:'♄︎', b:'Saturn',  maj:1},
 {k:'ura', n:'Uranüs', g:'♅︎', b:'Uranus',  maj:1},
 {k:'nep', n:'Neptün', g:'♆︎', b:'Neptune', maj:1},
 {k:'plu', n:'Plüton', g:'♇︎', b:'Pluto',   maj:1},
 {k:'chi', n:'Chiron', g:'⚷︎', eph:'ch',    maj:0},
 {k:'nod', n:'K. Ay Düğümü', g:'☊︎', node:1, maj:0},
 {k:'sno', n:'G. Ay Düğümü', g:'☋︎', south:1,maj:0},
 {k:'lil', n:'Lilith', g:'⚸︎', eph:'li',    maj:0}
];
var BK={}; BODIES.forEach(function(b){BK[b.k]=b;});


var ASPECTS=[
 {a:0,   n:'Kavuşum',    orb:8,  cls:'a-maj', major:1},
 {a:180, n:'Karşıt',     orb:8,  cls:'a-hard',major:1},
 {a:120, n:'Üçgen',      orb:7,  cls:'a-soft',major:1},
 {a:90,  n:'Kare',       orb:7,  cls:'a-hard',major:1},
 {a:60,  n:'Altmışlık',  orb:5,  cls:'a-soft',major:1},
 {a:150, n:'Yüzelli',    orb:3,  cls:'a-min', major:0},
 {a:30,  n:'Otuzluk',    orb:2,  cls:'a-min', major:0},
 {a:45,  n:'Yarım kare', orb:2,  cls:'a-min', major:0},
 {a:135, n:'Buçuk kare', orb:2,  cls:'a-min', major:0},
 {a:72,  n:'Beşlik',     orb:1.5,cls:'a-min', major:0}
];


var RULER=['mar','ven','mer','moon','sun','mer','ven','mar','jup','sat','sat','jup'];
var MODERN={7:'plu',10:'ura',11:'nep'};
var EXALT={sun:[0,19],moon:[1,3],mer:[5,15],ven:[11,27],mar:[9,28],jup:[3,15],sat:[6,21]};
var FALLS={sun:6,moon:7,mer:11,ven:5,mar:3,jup:9,sat:0};
var TRIP=[['sun','jup','sat'],['ven','moon','mar'],['sat','mer','jup'],['ven','mar','moon']];
var TERMS=[
 [['jup',6],['ven',12],['mer',20],['mar',25],['sat',30]],
 [['ven',8],['mer',14],['jup',22],['sat',27],['mar',30]],
 [['mer',6],['jup',12],['ven',17],['mar',24],['sat',30]],
 [['mar',7],['ven',13],['mer',19],['jup',26],['sat',30]],
 [['jup',6],['ven',11],['sat',18],['mer',24],['mar',30]],
 [['mer',7],['ven',17],['jup',21],['mar',28],['sat',30]],
 [['sat',6],['mer',14],['jup',21],['ven',28],['mar',30]],
 [['mar',7],['ven',11],['mer',19],['jup',24],['sat',30]],
 [['jup',12],['ven',17],['mer',21],['sat',26],['mar',30]],
 [['mer',7],['jup',14],['ven',22],['sat',26],['mar',30]],
 [['mer',7],['ven',13],['jup',20],['mar',25],['sat',30]],
 [['ven',12],['jup',16],['mer',19],['mar',28],['sat',30]]
];
var FACES=[
 ['mar','sun','ven'],['mer','moon','sat'],['jup','mar','sun'],['ven','mer','moon'],
 ['sat','jup','mar'],['sun','ven','mer'],['moon','sat','jup'],['mar','sun','ven'],
 ['mer','moon','sat'],['jup','mar','sun'],['ven','mer','moon'],['sat','jup','mar']
];


/* ═════════ EFEMERİS ═════════ */
var D36='0123456789abcdefghijklmnopqrstuvwxyz', EPH=null, STARS=null;
function decodeEph(E){
  var out={jd0:E.jd0,step:E.step,b:{}};
  for(var k in E.b){
    var parts=E.b[k].split(','), arr=new Float64Array(parts.length), acc=0;
    for(var i=0;i<parts.length;i++){
      var s=parts[i], neg=s.charCodeAt(0)===45, n=0;
      for(var j=neg?1:0;j<s.length;j++) n=n*36+D36.indexOf(s.charAt(j));
      acc+= neg?-n:n; arr[i]=acc/10000;
    }
    out.b[k]=arr;
  }
  return out;
}
function ephRaw(key,jd){
  if(!EPH) return null;
  var a=EPH.b[key]; if(!a) return null;
  var t=(jd-EPH.jd0)/EPH.step, i=Math.floor(t), f=t-i;
  if(i<1||i>a.length-3) return null;
  var p0=a[i-1],p1=a[i],p2=a[i+1],p3=a[i+2];
  return ((2*p1)+(-p0+p2)*f+(2*p0-5*p1+4*p2-p3)*f*f+(-p0+3*p1-3*p2+p3)*f*f*f)/2;
}
function ephLon(key,jd){ var v=ephRaw(key,jd); return v===null?null:norm(v); }
function ephLat(key,jd){ return ephRaw(key+'_lat',jd); }
function toJD(date){ return date.getTime()/86400000 + 2440587.5; }
function fromJD(jd){ return new Date((jd-2440587.5)*86400000); }


/* ═════════ ASTRONOMİ ═════════ */
function eclOf(body,t){
  var v=(body===A.Body.Moon)?A.GeoMoon(t):A.GeoVector(body,t,true);
  var s=A.SphereFromVector(A.RotateVector(A.Rotation_EQJ_ECT(t),v));
  return {lon:norm(s.lon), lat:s.lat};
}
function eclVecMoon(t){ return A.RotateVector(A.Rotation_EQJ_ECT(t),A.GeoMoon(t)); }
function trueNode(date){
  var h=0.005*86400000;
  var a=eclVecMoon(A.MakeTime(new Date(date.getTime()-h)));
  var b=eclVecMoon(A.MakeTime(date));
  var c=eclVecMoon(A.MakeTime(new Date(date.getTime()+h)));
  var vx=(c.x-a.x), vy=(c.y-a.y), vz=(c.z-a.z);
  var hx=b.y*vz-b.z*vy, hy=b.z*vx-b.x*vz;
  return norm(atan2(hx,-hy));
}
function obliquity(t){var T=t.tt/36525;return (84381.448-46.8150*T-0.00059*T*T+0.001813*T*T*T)/3600;}
function declination(lon,lat,eps){ return asin(sin(lat)*cos(eps)+cos(lat)*sin(eps)*sin(lon)); }

/* ── ev sistemleri (Swiss Ephemeris'e karşı 0.00″) ── */
function ascLon(oa,eps,pole){ return norm(atan2(cos(oa), -(sin(oa)*cos(eps)+tan(pole)*sin(eps)))); }
function mcLon(armc,eps){ return norm(atan2(sin(armc), cos(armc)*cos(eps))); }
function br(v,mc){ return norm(v-mc)>180 ? norm(v+180) : norm(v); }
function placidus(armc,eps,lat,off,fr){
  var ra=norm(armc+off);
  for(var i=0;i<100;i++){
    var lon=norm(atan2(sin(ra),cos(ra)*cos(eps)));
    var dec=asin(sin(eps)*sin(lon));
    var ad=asin(tan(lat)*tan(dec));
    var nr=norm(armc+off+fr*ad);
    if(Math.abs(((nr-ra+540)%360)-180)<1e-10){ra=nr;break;}
    ra=nr;
  }
  return norm(atan2(sin(ra),cos(ra)*cos(eps)));
}
function kochAd3(eps,lat,mc){
  var sa=sin(mc)*sin(eps)/cos(lat);
  var ca=Math.sqrt(Math.max(0,1-sa*sa));
  return asin(sin(atan(tan(lat)/ca))*sa)/3;
}
function vertexOf(armc,eps,lat,mc){
  var dp=90-lat, rap=norm(armc+180);
  var Px=cos(dp)*cos(rap), Py=cos(dp)*sin(rap), Pz=sin(dp);
  var v=norm(atan2(-Px, cos(eps)*Py+sin(eps)*Pz));
  if(norm(v-mc)<180) v=norm(v+180);
  return v;
}
function buildHouses(sys,armc,eps,lat){
  var mc=mcLon(armc,eps), asc=br(ascLon(armc,eps,lat),mc);
  var c=new Array(13).fill(0);
  function quad(a,b,f){ return norm(a+norm(b-a)*f); }
  if(sys==='W'){ var st=Math.floor(norm(asc)/30)*30; for(var i=1;i<=12;i++) c[i]=norm(st+(i-1)*30); }
  else if(sys==='E'){ for(var i2=1;i2<=12;i2++) c[i2]=norm(asc+(i2-1)*30); }
  else if(sys==='O'){
    c[1]=asc;c[10]=mc;c[4]=norm(mc+180);c[7]=norm(asc+180);
    c[11]=quad(mc,asc,1/3);c[12]=quad(mc,asc,2/3);
    c[2]=quad(asc,norm(mc+180),1/3);c[3]=quad(asc,norm(mc+180),2/3);
    c[5]=norm(c[11]+180);c[6]=norm(c[12]+180);c[8]=norm(c[2]+180);c[9]=norm(c[3]+180);
  } else {
    c[1]=asc;c[10]=mc;c[4]=norm(mc+180);c[7]=norm(asc+180);
    if(sys==='P'){
      c[11]=br(placidus(armc,eps,lat,30,1/3),mc); c[12]=br(placidus(armc,eps,lat,60,2/3),mc);
      c[2]=br(placidus(armc,eps,lat,120,2/3),mc); c[3]=br(placidus(armc,eps,lat,150,1/3),mc);
    } else if(sys==='K'){
      var a3=kochAd3(eps,lat,mc);
      c[11]=br(ascLon(norm(armc+30-2*a3-90),eps,lat),mc);
      c[12]=br(ascLon(norm(armc+60-a3-90),eps,lat),mc);
      c[2]=br(ascLon(norm(armc+120+a3-90),eps,lat),mc);
      c[3]=br(ascLon(norm(armc+150+2*a3-90),eps,lat),mc);
    } else if(sys==='R'){
      var P=function(h){return atan(tan(lat)*sin(h));};
      c[11]=br(ascLon(norm(armc-60),eps,P(30)),mc);
      c[12]=br(ascLon(norm(armc-30),eps,P(60)),mc);
      c[2]=br(ascLon(norm(armc+30),eps,P(120)),mc);
      c[3]=br(ascLon(norm(armc+60),eps,P(150)),mc);
    } else if(sys==='C'){
      var camp=function(h){
        var psi=90-atan2(tan(h),cos(lat));
        return br(ascLon(norm(armc+psi-90),eps,atan(tan(lat)*sin(psi))),mc);
      };
      c[11]=camp(60);c[12]=camp(30);c[2]=camp(-30);c[3]=camp(-60);
    }
    c[5]=norm(c[11]+180);c[6]=norm(c[12]+180);c[8]=norm(c[2]+180);c[9]=norm(c[3]+180);
  }
  return {asc:asc,mc:mc,c:c,vertex:vertexOf(armc,eps,lat,mc)};
}
function houseOf(l,c){
  l=norm(l);
  for(var i=1;i<=12;i++){
    var a=c[i], b=c[i===12?1:i+1], sp=norm(b-a);
    if(sp===0) sp=30;
    if(norm(l-a)<sp) return i;
  }
  return 1;
}


/* ═════════ ZAMAN ═════════ */
function tzOffMin(date,tz){
  if(tz!==undefined&&tz!==null&&tz!==''&&isFinite(tz))return (+tz)*60;
  try{
    var p=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'})
      .formatToParts(date).reduce(function(a,x){a[x.type]=x.value;return a;},{});
    var h=p.hour==='24'?0:+p.hour;
    return (Date.UTC(+p.year,+p.month-1,+p.day,h,+p.minute,+p.second)-date.getTime())/60000;
  }catch(e){ return 0; }
}
function localToUTC(y,mo,d,h,mi,tz){
  var g=Date.UTC(y,mo-1,d,h,mi,0);
  for(var i=0;i<4;i++){
    var o=tzOffMin(new Date(g),tz);
    var c=Date.UTC(y,mo-1,d,h,mi,0)-o*60000;
    if(c===g) break; g=c;
  }
  return new Date(g);
}


/* ═════════ HESAP ═════════ */
function bodyAt(B,utc,jd,nodeType){
  var t=A.MakeTime(utc), lon=null, lat=0;
  if(B.b){ var e=eclOf(A.Body[B.b],t); lon=e.lon; lat=e.lat; }
  else if(B.eph){ lon=ephLon(B.eph,jd); lat=ephLat(B.eph,jd)||0; }
  else if(B.node||B.south){
    lon = (nodeType==='mean') ? ephLon('nm',jd) : trueNode(utc);
    if(B.south && lon!==null) lon=norm(lon+180);
    lat=0;
  }
  return lon===null?null:{lon:lon,lat:lat};
}

function computeChart(o){
  var utc=localToUTC(o.y,o.mo,o.d,o.h,o.mi,o.tz);
  return chartFromUTC(utc,o);
}
function chartFromUTC(utc,o){
  var t=A.MakeTime(utc), jd=toJD(utc);
  var eps=obliquity(t);
  var armc=norm(A.SiderealTime(t)*15+o.lon);
  var H=buildHouses(o.house,armc,eps,o.lat);
  var dt=0.25;

  var pls=[];
  BODIES.forEach(function(B){
    var cur=bodyAt(B,utc,jd,o.nodeType);
    if(!cur) return;
    var a=bodyAt(B,new Date(utc.getTime()-dt*86400000),jd-dt,o.nodeType);
    var b=bodyAt(B,new Date(utc.getTime()+dt*86400000),jd+dt,o.nodeType);
    var dl=b.lon-a.lon; if(dl>180)dl-=360; if(dl<-180)dl+=360;
    var sp=dl/(2*dt);
    pls.push({k:B.k,n:B.n,g:B.g,maj:B.maj,lon:cur.lon,blat:cur.lat,
      dec:declination(cur.lon,cur.lat,eps),speed:sp,rx:sp<0,house:houseOf(cur.lon,H.c)});
  });

  var sun=pls.filter(function(p){return p.k==='sun';})[0];
  var moon=pls.filter(function(p){return p.k==='moon';})[0];
  /* sect: ev numarasi degil ufuk. Whole Sign / Equal secildiginde
     1. ev ASC'den once basladigi icin ev bazli hesap yaniliyordu. */
  var day=(norm(sun.lon-H.asc)>=180);
  var pof=norm(day ? H.asc+moon.lon-sun.lon : H.asc+sun.lon-moon.lon);
  pls.push({k:'pof',n:'Şans Noktası',g:'⊗︎',maj:0,lon:pof,blat:0,dec:declination(pof,0,eps),speed:0,rx:false,house:houseOf(pof,H.c)});

  var pts=pls.concat([
    {k:'asc',n:'Yükselen',g:'AC',maj:1,lon:H.asc,blat:0,dec:declination(H.asc,0,eps),speed:0,rx:false,house:1,angle:1},
    {k:'mc', n:'MC',      g:'MC',maj:1,lon:H.mc, blat:0,dec:declination(H.mc,0,eps), speed:0,rx:false,house:10,angle:1}
  ]);

  return {asc:H.asc,mc:H.mc,vertex:H.vertex,c:H.c,pls:pls,pts:pts,day:day,utc:utc,jd:jd,armc:armc,eps:eps,o:o};
}


/* ═════════ AÇILAR ═════════ */
function aspectsWithin(pts,mul,minor){
  var out=[];
  for(var i=0;i<pts.length;i++) for(var j=i+1;j<pts.length;j++){
    var r=testAspect(pts[i],pts[j],mul,minor);
    if(r) out.push(r);
  }
  out.sort(function(x,y){return x.abs-y.abs;});
  return out;
}
function aspectsCross(inner,outer,mul,minor){
  var out=[];
  for(var i=0;i<outer.length;i++) for(var j=0;j<inner.length;j++){
    if(outer[i].k==='pof') continue; /* hareket eden Şans Noktası açı üretmez */
    var r=testAspect(outer[i],inner[j],mul,minor);
    if(r) out.push(r);
  }
  out.sort(function(x,y){return x.abs-y.abs;});
  return out;
}
function testAspect(a,b,mul,minor){
  if((a.k==='nod'&&b.k==='sno')||(a.k==='sno'&&b.k==='nod')) return null;
  if((a.k==='asc'&&b.k==='mc')||(a.k==='mc'&&b.k==='asc')) return null;
  var d=sep(a.lon,b.lon);
  for(var q=0;q<ASPECTS.length;q++){
    var AS=ASPECTS[q];
    if(!AS.major && !minor) continue;
    var lum=(a.k==='sun'||a.k==='moon'||b.k==='sun'||b.k==='moon');
    var slow=(!a.maj||!b.maj);
    var orb=AS.orb*mul*(lum?1.25:1)*(slow?0.7:1);
    var diff=d-AS.a;
    if(Math.abs(diff)<=orb){
      var rel=(a.speed||0)-(b.speed||0);
      var s=norm(a.lon-b.lon); if(s>180) s-=360;
      var app=null;
      if(a.speed!==0||b.speed!==0){
        var cur=Math.abs(s);
        app = (cur>AS.a) ? (s>0 ? rel<0 : rel>0) : (s>0 ? rel>0 : rel<0);
      }
      return {a:a,b:b,as:AS,orb:diff,abs:Math.abs(diff),app:app};
    }
  }
  return null;
}


function dms(l){
  l=norm(l); var s=Math.floor(l/30), g=l-s*30;
  var d=Math.floor(g), m=Math.floor((g-d)*60), sec=Math.round((((g-d)*60)-m)*60);
  if(sec===60){sec=0;m++;} if(m===60){m=0;d++;}
  return {s:s,d:d,m:m,sec:sec};
}

/* ── dışa açılan yüzey ── */
function chart(o){
  if(!A) A=window.Astronomy;
  if(!A) throw new Error('astronomy.browser.min.js yüklenmedi');
  if(!EPH && window.SORBI_EPH){ try{ EPH=decodeEph(window.SORBI_EPH); }catch(e){} }
  o=Object.assign({house:'P',nodeType:'true',tz:'Europe/Istanbul'},o);
  return computeChart(o);
}
function nowChart(o){
  var d=new Date();
  o=Object.assign({},o);
  var tz=o.tz||'Europe/Istanbul';
  var p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
    .formatToParts(d).reduce(function(a,x){a[x.type]=x.value;return a;},{});
  o.y=+p.year; o.mo=+p.month; o.d=+p.day; o.h=(p.hour==='24'?0:+p.hour); o.mi=+p.minute;
  return chart(o);
}
window.SorbiAstro={
  chart:chart, now:nowChart,
  cross:function(natal,transit,mul,minor){ return aspectsCross(natal.pts, transit.pls, mul||1, !!minor); },
  within:function(ch,mul,minor){ return aspectsWithin(ch.pts, mul||1, !!minor); },
  houseOf:houseOf, dms:dms, norm:norm, sep:sep,
  SIGNS:SIGNS, SGLYPH:SGLYPH, BODIES:BODIES, ASPECTS:ASPECTS,
  fmt:function(l){ var x=dms(l); return x.d+'° '+SIGNS[x.s]+' '+pad2(x.m)+"′"; },
  fmtShort:function(l){ var x=dms(l); return x.d+'°'+pad2(x.m)+"′ "+SIGNS[x.s]; }
};
})();
