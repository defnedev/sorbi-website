/*! sorbi-gokyuzu.js — ana sayfa: şu anın gökyüzü, hareket halinde.
 *  Öğren'deki gösterilerle aynı dil: ince halka, monospace sayı, gerçek efemeris.
 *  Sahte hareket yok. Açılışta son 24 saat 3 saniyede oynar ve şimdide durur.
 *  Zaman çizgisi sürüklenince gökyüzü gerçekten döner (±1 yıl).
 *  SorbiGokyuzu.kur(el, {lat,lon,tz,yer}) · .git(Date) · .simdi()
 */
(function(){
'use strict';
var W=window,D=document,M=Math,PI=M.PI,TAU=PI*2,rd=PI/180,cs=M.cos,sn=M.sin;
var AZ=!!(W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches);
var SG='♈︎ ♉︎ ♊︎ ♋︎ ♌︎ ♍︎ ♎︎ ♏︎ ♐︎ ♑︎ ♒︎ ♓︎'.split(' ');
var AY='Oca Şub Mar Nis May Haz Tem Ağu Eyl Eki Kas Ara'.split(' ');
var KLASIK={sun:1,moon:1,mer:1,ven:1,mar:1,jup:1,sat:1,ura:1,nep:1,plu:1};

/* canvas CSS değişkeni okuyamaz; boyama anında çözülür → tema takip edilir */
var __rc={};
function tk(ad){var t=D.documentElement.getAttribute('data-tema')||'gece',k=t+'|'+ad;
 if(__rc[k])return __rc[k];var v=getComputedStyle(D.documentElement).getPropertyValue(ad).trim();
 return (__rc[k]=v||'#F2EFE9');}
function tkr(ad,a){return 'rgba('+tk(ad+'-rgb')+','+a+')';}

function nrm(x){return ((x%360)+360)%360;}
function kisa(a,b){var d=nrm(b-a);return d>180?d-360:d;}      /* en kısa yay */
function lerpA(a,b,t){return nrm(a+kisa(a,b)*t);}
function ease(t){return 1-M.pow(1-t,3);}
function pad(n){return (n<10?'0':'')+n;}

function yerelParca(d,tz){
 try{var p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
  .formatToParts(d).reduce(function(a,x){a[x.type]=x.value;return a;},{});
  return {y:+p.year,mo:+p.month,d:+p.day,h:(p.hour==='24'?0:+p.hour),mi:+p.minute};}
 catch(e){return {y:d.getFullYear(),mo:d.getMonth()+1,d:d.getDate(),h:d.getHours(),mi:d.getMinutes()};}
}
function harita(d,o){
 var p=yerelParca(d,o.tz);
 var ch=W.SorbiAstro.chart({y:p.y,mo:p.mo,d:p.d,h:p.h,mi:p.mi,tz:o.tz,lat:o.lat,lon:o.lon,house:'W'});
 var P={};ch.pls.forEach(function(x){if(KLASIK[x.k])P[x.k]={lon:x.lon,rx:x.rx,g:x.g,n:x.n};});
 return {t:d,asc:ch.asc,mc:ch.mc,P:P};
}
function ara(A,B,t){ /* iki harita arası */
 var P={};for(var k in A.P)if(B.P[k])P[k]={lon:lerpA(A.P[k].lon,B.P[k].lon,t),rx:t<.5?A.P[k].rx:B.P[k].rx,g:A.P[k].g,n:A.P[k].n};
 return {t:new Date(A.t.getTime()+(B.t.getTime()-A.t.getTime())*t),asc:lerpA(A.asc,B.asc,t),mc:lerpA(A.mc,B.mc,t),P:P};
}

/* ── açılar: yalnız ana, dar orb ──
   Harita çarkıyla AYNI açı dili: tür başına renk + desen + kalınlık.
   Burası küçük bir halka; glif basılmaz, yalnız renk ve desen tutarlılığı. */
var ACI=[[180,6,'kar'],[90,6,'kare'],[120,6,'ucg'],[60,4,'alt']];
/* renkler tek kaynaktan: SorbiChart.THEMES[...].aci — yoksa aynı sistem paleti */
var ACI_YEDEK={kav:'#C9A962',kar:'#CE4F4F',kare:'#DC7676',ucg:'#4E9C7B',alt:'#7FBFA0',min:'#A5A3AE'};
function aciPal(){
 try{
  var t=(D.documentElement.getAttribute('data-tema')==='gunduz')?'paper':'night';
  return W.SorbiChart.THEMES[t].aci.s;
 }catch(e){ return ACI_YEDEK; }
}
/* karşıt kalın · üçgen orta · kare ince · altmışlık kesik (çarktaki hiyerarşinin aynısı) */
var ACI_KAL={kar:1.6,ucg:1.3,kare:1.1,alt:1.1}, ACI_DES={alt:[5,4]};
var ACI_ALF={kar:.66,kare:.66,ucg:.5,alt:.5};
function acilar(P){
 var k=Object.keys(P),out=[];
 for(var i=0;i<k.length;i++)for(var j=i+1;j<k.length;j++){
  var d=M.abs(kisa(P[k[i]].lon,P[k[j]].lon));
  for(var a=0;a<ACI.length;a++){var f=M.abs(d-ACI[a][0]);if(f<=ACI[a][1]){out.push([k[i],k[j],ACI[a][2],1-f/ACI[a][1]]);break;}}
 }
 return out;
}
/* '#RRGGBB' + alfa → rgba() */
function alf(hex,a){
 var h=String(hex).replace('#','');
 if(h.length!==6) return hex;
 return 'rgba('+parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)+','+a.toFixed(2)+')';
}

/* ── üç cümle: sembol değil, an. Yorum yok, gökyüzünde ne vardı ── */
var BURC_TA='Koç\u2019ta Boğa\u2019da İkizler\u2019de Yengeç\u2019te Aslan\u2019da Başak\u2019ta Terazi\u2019de Akrep\u2019te Yay\u2019da Oğlak\u2019ta Kova\u2019da Balık\u2019ta'.split(' ');
function konum(d){ /* d: ASC'den ekliptik uzaklık; 0–180 ufkun altı */
 if(d<20||d>=340)return 'tam ufuktaydı, doğuda';
 if(d<70)return 'ufkun az altındaydı, doğuda';
 if(d<110)return 'ayaklarının altındaydı, gece yarısı noktasında';
 if(d<160)return 'ufkun altındaydı, batıda';
 if(d<200)return 'tam ufuktaydı, batıda';
 if(d<250)return 'batıya doğru alçalıyordu';
 if(d<290)return 'tam tependeydi';
 return 'doğudan yükseliyordu';
}
function anlat(H,saatYok){
 var P=H.P,su=P.sun,ay=P.moon,c=[],ad={mer:'Merkür',ven:'Venüs',mar:'Mars',jup:'Jüpiter',sat:'Satürn',sun:'Güneş',moon:'Ay'};
 var faz=M.abs(kisa(su.lon,ay.lon))<15?'yeni aydı':M.abs(kisa(su.lon,ay.lon))>165?'dolunaydı':nrm(ay.lon-su.lon)<180?'büyüyordu':'küçülüyordu';
 if(saatYok){
  var bs=BURC_TA[M.floor(nrm(su.lon)/30)];
  c.push('Saatini bilmediğimiz için ufuk yok; ama Güneş '+bs+(/a$/.test(bs)?'ydı':'ydi')+'.');
  c.push('Ay '+BURC_TA[M.floor(nrm(ay.lon)/30)]+'; '+faz+'.');
 }else{
  var ds=nrm(su.lon-H.asc),da=nrm(ay.lon-H.asc);
  c.push('Güneş '+konum(ds)+'. '+(ds>=180?'Gündüz doğmuşsun.':'Gece doğmuşsun.'));
  c.push('Ay '+konum(da)+'; '+faz+'.');
 }
 var rx=['mer','ven','mar'].filter(function(k){return P[k]&&P[k].rx;}).map(function(k){return ad[k];});
 if(rx.length)c.push(rx.join(' ve ')+' o gün geri gidiyordu.');
 else{
  var ks=Object.keys(P),en=null;
  for(var i=0;i<ks.length;i++)for(var j=i+1;j<ks.length;j++){var d=M.abs(kisa(P[ks[i]].lon,P[ks[j]].lon));
   if(d<3&&(!en||d<en.d))en={a:ks[i],b:ks[j],d:d,t:'yan yana duruyordu'};
   if(M.abs(d-180)<3&&(!en||M.abs(d-180)<en.d))en={a:ks[i],b:ks[j],d:M.abs(d-180),t:'tam karşı karşıyaydı'};}
  c.push(en?(P[en.a].n+' ile '+P[en.b].n+' '+en.t+'.'):'Gezegenler o gün gökyüzüne dağılmıştı, hiçbiri yan yana değildi.');
 }
 return c;
}

/* ── çizim ── */
function ciz(cv,H,o){
 var dpr=M.min(W.devicePixelRatio||1,2),G=cv.clientWidth||600;
 if(cv.width!==M.round(G*dpr)){cv.width=M.round(G*dpr);cv.height=cv.width;}
 var c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
 c.clearRect(0,0,G,G);
 var cx=G/2,cy=G/2,R=G/2-14,ic=R-M.max(30,G*.055),kal=R-ic;
 var mono='ui-monospace,Menlo,monospace';
 /* burç halkası: ASC solda (9 yönünde), saat yönünün tersi */
 function ang(lon){return (180-(lon-H.asc))*rd;}   /* ekliptik → ekran */
 for(var b=0;b<12;b++){
  var a0=ang(b*30),a1=ang(b*30+30);
  c.beginPath();c.arc(cx,cy,R,a0,a1,true);c.arc(cx,cy,ic,a1,a0,false);c.closePath();
  c.fillStyle=b%2?tkr('--ink',.028):tkr('--ink',.055);c.fill();
  c.strokeStyle=tkr('--ink',.10);c.lineWidth=1;c.stroke();
  var am=ang(b*30+15);
  c.fillStyle=tk('--mut');c.font='13px '+mono;c.textAlign='center';c.textBaseline='middle';
  c.fillText(SG[b],cx+cs(am)*(R+ic)/2,cy+sn(am)*(R+ic)/2);
 }
 /* ufuk + meridyen */
 var aA=ang(H.asc),aM=ang(H.mc);
 c.strokeStyle=tkr('--ink',.22);c.lineWidth=1;
 c.beginPath();c.moveTo(cx+cs(aA)*(ic-2),cy+sn(aA)*(ic-2));c.lineTo(cx-cs(aA)*(ic-2),cy-sn(aA)*(ic-2));c.stroke();
 c.strokeStyle=tkr('--ink',.12);
 c.beginPath();c.moveTo(cx+cs(aM)*(ic-2),cy+sn(aM)*(ic-2));c.lineTo(cx-cs(aM)*(ic-2),cy-sn(aM)*(ic-2));c.stroke();
 c.fillStyle=tk('--mut');c.font='10px '+mono;c.textAlign='center';
 c.fillText('AC',cx+cs(aA)*(R+12),cy+sn(aA)*(R+12));c.fillText('MC',cx+cs(aM)*(R+12),cy+sn(aM)*(R+12));
 /* açılar */
 var rp=ic-M.max(22,G*.045);
 var PAL=aciPal();
 acilar(H.P).forEach(function(x){
  var p=H.P[x[0]],q=H.P[x[1]],a=ang(p.lon),b2=ang(q.lon),t=x[2];
  /* opaklık sabit tabanın altına inmez; orb yalnız kalınlığa yazılır */
  c.strokeStyle=alf(PAL[t]||ACI_YEDEK[t], M.min(1,ACI_ALF[t]+x[3]*(1-ACI_ALF[t])*.45));
  c.lineWidth=ACI_KAL[t]*(.8+x[3]*.35);
  c.setLineDash(ACI_DES[t]||[]);
  c.beginPath();c.moveTo(cx+cs(a)*rp,cy+sn(a)*rp);c.lineTo(cx+cs(b2)*rp,cy+sn(b2)*rp);c.stroke();
 });
 c.setLineDash([]);
 /* gezegenler */
 var sirali=Object.keys(H.P).map(function(k){return {k:k,lon:H.P[k].lon};}).sort(function(a,b){return a.lon-b.lon;});
 var kat={};for(var i=0;i<sirali.length;i++){var s=sirali[i],p=sirali[i-1];
  kat[s.k]=(p&&M.abs(kisa(p.lon,s.lon))<7)?(kat[p.k]||0)+1:0;}
 for(var k in H.P){
  var p=H.P[k],a=ang(p.lon),r=rp-kat[k]*(G*.03),x=cx+cs(a)*r,y=cy+sn(a)*r,buyuk=(k==='sun'||k==='moon');
  c.beginPath();c.arc(x,y,buyuk?4.2:3,0,TAU);c.fillStyle=buyuk?tk('--acc'):tk('--ink');c.fill();
  c.fillStyle=tk('--ink');c.font=(buyuk?'15px ':'13px ')+mono;c.textAlign='center';c.textBaseline='middle';
  var gx=cx+cs(a)*(r-M.max(16,G*.032)),gy=cy+sn(a)*(r-M.max(16,G*.032));
  c.fillText(p.g,gx,gy);
  if(p.rx){c.fillStyle=tk('--acc');c.font='8px '+mono;c.fillText('R',gx+9,gy-7);}
 }
 /* merkez */
 c.beginPath();c.arc(cx,cy,2,0,TAU);c.fillStyle=tkr('--ink',.5);c.fill();
}

function metin(H,o){
 var p=yerelParca(H.t,o.tz);
 return p.d+' '+AY[p.mo-1]+' '+p.y+' · '+pad(p.h)+':'+pad(p.mi)+(o.yer?' · '+o.yer:'');
}
function fark(ms){
 var g=M.round(ms/864e5);if(M.abs(g)<1)return 'şimdi';
 var s=g>0?'+':'−',n=M.abs(g);
 if(n<31)return s+n+' gün';if(n<365)return s+M.round(n/30.4)+' ay';return s+(n/365).toFixed(1)+' yıl';
}

function kur(el,o){
 if(!el||!W.SorbiAstro)return null;
 o=o||{};o.lat=+o.lat||41.0082;o.lon=+o.lon||28.9784;o.tz=o.tz||'Europe/Istanbul';
 el.innerHTML='<canvas class="gk-c" aria-label="Şu anın gökyüzü"></canvas>'
  +'<div class="gk-oku"><span class="gk-t"></span><span class="gk-f">şimdi</span></div>'
  +'<div class="gk-cizgi" role="slider" aria-label="Zaman" tabindex="0"><i></i><b></b></div>'
  +'<button type="button" class="gk-simdi" hidden>şimdiye dön</button>';
 var cv=el.querySelector('.gk-c'),tEl=el.querySelector('.gk-t'),fEl=el.querySelector('.gk-f'),
     ciz_=el.querySelector('.gk-cizgi'),tut=ciz_.querySelector('b'),geri=el.querySelector('.gk-simdi');
 var ST={H:null,now:null,rid:0,ofs:0,dogum:false};
 if(o.cizgi===false){ciz_.hidden=true;}
 function goster(H){ST.H=H;ciz(cv,H,o);tEl.textContent=metin(H,o);var f=ST.dogum?'doğduğun an':fark(H.t-Date.now());fEl.textContent=f;
  geri.hidden=(f==='şimdi')||o.cizgi===false;tut.style.left=(50+ST.ofs*50)+'%';}
 function suzul(A,B,sure,cb){ /* iki harita arası yumuşak geçiş */
  if(ST.rid)cancelAnimationFrame(ST.rid);
  if(AZ){goster(B);cb&&cb();return;}
  var t0=0;(function adim(ts){if(!t0)t0=ts;var t=M.max(0,M.min(1,(ts-t0)/sure));goster(ara(A,B,ease(t)));
   if(t<1)ST.rid=requestAnimationFrame(adim);else{ST.rid=0;cb&&cb();}})(performance.now());
 }
 /* açılış: son 24 saat → şimdi. 9 örnek, arası doğrusal (Ay 13°/gün, 3 saatte 1.6°: yeter) */
 function acilis(){
  var n=new Date(),ors=[];for(var i=8;i>=0;i--)ors.push(harita(new Date(n-i*3*36e5),o));
  ST.now=ors[8];
  if(AZ){goster(ST.now);return;}
  var t0=0,sure=3200;(function adim(ts){if(!t0)t0=ts;var t=ease(M.max(0,M.min(1,(ts-t0)/sure)))*8,i=M.max(0,M.min(7,M.floor(t)));
   goster(ara(ors[i],ors[i+1],t-i));if(t<8)ST.rid=requestAnimationFrame(adim);else{ST.rid=0;goster(ST.now);}})(performance.now());
 }
 /* zaman çizgisi: ±365 gün */
 var sur=false,bek=0;
 function konum(ev){var r=ciz_.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width;ST.ofs=M.max(-1,M.min(1,x*2-1));
  if(bek)return;bek=requestAnimationFrame(function(){bek=0;
   var d=new Date(Date.now()+ST.ofs*365*864e5);goster(harita(d,o));});}
 ciz_.addEventListener('pointerdown',function(e){sur=true;ciz_.setPointerCapture(e.pointerId);if(ST.rid){cancelAnimationFrame(ST.rid);ST.rid=0;}konum(e);});
 ciz_.addEventListener('pointermove',function(e){if(sur)konum(e);});
 ciz_.addEventListener('pointerup',function(){sur=false;});
 ciz_.addEventListener('keydown',function(e){var k=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!k)return;
  e.preventDefault();ST.ofs=M.max(-1,M.min(1,ST.ofs+k*(e.shiftKey?30:1)/365));goster(harita(new Date(Date.now()+ST.ofs*365*864e5),o));});
 geri.addEventListener('click',function(){var A=ST.H;ST.ofs=0;ST.dogum=false;ciz_.hidden=false;ST.now=harita(new Date(),o);suzul(A,ST.now,900);});
 W.addEventListener('resize',function(){if(ST.H)ciz(cv,ST.H,o);});
 try{new MutationObserver(function(){if(ST.H)ciz(cv,ST.H,o);}).observe(D.documentElement,{attributes:true,attributeFilter:['data-tema']});}catch(e){}
 acilis();
 return {
  git:function(d,yer,cb){ /* doğum anına uç */
   var hedef=harita(d,yer?{lat:yer.lat,lon:yer.lon,tz:yer.tz||o.tz,yer:yer.yer}:o);
   var A=ST.H||ST.now;ST.ofs=0;ciz_.hidden=true;ST.dogum=true;
   suzul(A,hedef,1800,function(){tEl.textContent=metin(hedef,yer||o);cb&&cb(hedef);});},
  anlat:function(H,saatYok){return anlat(H,saatYok);},
  simdi:function(){ciz_.hidden=false;geri.click();},
  yeniden:function(){if(ST.H)ciz(cv,ST.H,o);}
 };
}
W.SorbiGokyuzu={kur:kur};
})();
