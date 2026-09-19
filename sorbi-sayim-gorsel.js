/*! sorbi-sayim-gorsel.js — sayım yazılarının başındaki hareketli gökyüzü.
 *  Ana sayfadaki halkayla aynı dil. Sahte hareket yok: son 12 ay, gün gün, gerçek efemeris.
 *  SorbiSayimGorsel.kur(el, {tip:'retro'|'yigin'|'anaretik'})
 *  retro    → Merkür'ün bir yıllık yolu; geri günler vurgu renginde.
 *  yigin    → yedi klasik gezegen; en kalabalık burç o gün aydınlanır.
 *  anaretik → 29. derecede duran gezegen o gün işaretlenir.
 */
(function(){
'use strict';
var W=window,D=document,M=Math,PI=M.PI,TAU=PI*2,rd=PI/180,cs=M.cos,sn=M.sin;
var AZ=!!(W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches);
var SG='♈︎ ♉︎ ♊︎ ♋︎ ♌︎ ♍︎ ♎︎ ♏︎ ♐︎ ♑︎ ♒︎ ♓︎'.split(' ');
var BURC='Koç Boğa İkizler Yengeç Aslan Başak Terazi Akrep Yay Oğlak Kova Balık'.split(' ');
var AY='Oca Şub Mar Nis May Haz Tem Ağu Eyl Eki Kas Ara'.split(' ');
var K7=['sun','moon','mer','ven','mar','jup','sat'];
var __rc={};
function tk(ad){var t=D.documentElement.getAttribute('data-tema')||'gece',k=t+'|'+ad;
 if(__rc[k])return __rc[k];var v=getComputedStyle(D.documentElement).getPropertyValue(ad).trim();
 return (__rc[k]=v||'#F2EFE9');}
function tkr(ad,a){return 'rgba('+tk(ad+'-rgb')+','+a+')';}
function nrm(x){return ((x%360)+360)%360;}
function ang(lon){return (180-lon)*rd;}      /* 0° Koç solda, saat yönünün tersi */
function burc(l){return M.floor(nrm(l)/30);}
function der(l){return M.floor(nrm(l)%30);}
function ease(t){return 1-M.pow(1-t,3);}

/* ── günlük gökyüzü: son 365 gün, parça parça hesaplanır ── */
function gun(d){
 var ch=W.SorbiAstro.chart({y:d.getFullYear(),mo:d.getMonth()+1,d:d.getDate(),h:12,mi:0,tz:'Europe/Istanbul',lat:41.0082,lon:28.9784,house:'W'});
 var P={};ch.pls.forEach(function(x){if(K7.indexOf(x.k)>=0)P[x.k]={lon:x.lon,rx:x.rx,g:x.g,n:x.n};});
 return {t:d,P:P};
}

/* ── halka ── */
function halka(c,G,vurguBurc){
 var cx=G/2,cy=G/2,R=G/2-14,ic=R-M.max(26,G*.05),mono='ui-monospace,Menlo,monospace';
 for(var b=0;b<12;b++){
  var a0=ang(b*30),a1=ang(b*30+30);
  c.beginPath();c.arc(cx,cy,R,a0,a1,true);c.arc(cx,cy,ic,a1,a0,false);c.closePath();
  c.fillStyle=(b===vurguBurc)?tkr('--acc',.16):(b%2?tkr('--ink',.028):tkr('--ink',.055));c.fill();
  c.strokeStyle=tkr('--ink',.10);c.lineWidth=1;c.stroke();
  var am=ang(b*30+15);
  c.fillStyle=(b===vurguBurc)?tk('--ink'):tk('--mut');c.font='13px '+mono;c.textAlign='center';c.textBaseline='middle';
  c.fillText(SG[b],cx+cs(am)*(R+ic)/2,cy+sn(am)*(R+ic)/2);
 }
 return {cx:cx,cy:cy,R:R,ic:ic,rp:ic-M.max(20,G*.045),mono:mono};
}
function nokta(c,h,lon,r,buyuk,renk){var a=ang(lon),x=h.cx+cs(a)*r,y=h.cy+sn(a)*r;
 c.beginPath();c.arc(x,y,buyuk?4.2:3,0,TAU);c.fillStyle=renk;c.fill();return [x,y,a];}
function glif(c,h,p,r,renk){var a=ang(p.lon),g=r-M.max(15,h.R*.06);
 c.fillStyle=renk||tk('--ink');c.font='13px '+h.mono;c.textAlign='center';c.textBaseline='middle';
 c.fillText(p.g,h.cx+cs(a)*g,h.cy+sn(a)*g);}
function tarih(d){return d.getDate()+' '+AY[d.getMonth()]+' '+d.getFullYear();}

/* ── üç tip ── */
var TIP={
 retro:{
  etiket:'Merkür bir yıl boyunca',
  ciz:function(c,G,S,i){
   var h=halka(c,G,-1),iz=h.rp-4;
   for(var j=0;j<=i;j++){var p=S[j].P.mer,a=ang(p.lon),x=h.cx+cs(a)*iz,y=h.cy+sn(a)*iz;
    c.beginPath();c.arc(x,y,p.rx?1.9:1.2,0,TAU);c.fillStyle=p.rx?tkr('--acc',.85):tkr('--ink',.22);c.fill();}
   var p=S[i].P.mer;nokta(c,h,p.lon,iz,true,p.rx?tk('--acc'):tk('--ink'));glif(c,h,p,iz-4);
   var gs=S[i].P.sun;nokta(c,h,gs.lon,h.rp-M.max(18,G*.05),false,tkr('--ink',.5));
  },
  oku:function(S,i){var p=S[i].P.mer,geri=0;for(var j=0;j<=i;j++)if(S[j].P.mer.rx)geri++;
   return [tarih(S[i].t)+' · Merkür '+der(p.lon)+'° '+BURC[burc(p.lon)]+(p.rx?' · geri':''), geri+' gün geri / '+(i+1)];}
 },
 yigin:{
  etiket:'Yedi gezegen bir yıl boyunca',
  ciz:function(c,G,S,i){
   var say=[0,0,0,0,0,0,0,0,0,0,0,0],P=S[i].P;for(var k in P)say[burc(P[k].lon)]++;
   var enb=0;for(var b=1;b<12;b++)if(say[b]>say[enb])enb=b;
   var h=halka(c,G,say[enb]>=3?enb:-1);
   var sirali=K7.map(function(k){return {k:k,lon:P[k].lon};}).sort(function(a,b){return a.lon-b.lon;}),kat={};
   for(var j=0;j<sirali.length;j++){var s=sirali[j],q=sirali[j-1];kat[s.k]=(q&&nrm(s.lon-q.lon)<7)?(kat[q.k]||0)+1:0;}
   K7.forEach(function(k){var p=P[k],r=h.rp-kat[k]*(G*.03),ic=(burc(p.lon)===enb&&say[enb]>=3);
    nokta(c,h,p.lon,r,k==='sun'||k==='moon',ic?tk('--acc'):tk('--ink'));glif(c,h,p,r);});
  },
  oku:function(S,i){var say=[0,0,0,0,0,0,0,0,0,0,0,0],P=S[i].P;for(var k in P)say[burc(P[k].lon)]++;
   var enb=0;for(var b=1;b<12;b++)if(say[b]>say[enb])enb=b;
   var gun3=0;for(var j=0;j<=i;j++){var s2=[0,0,0,0,0,0,0,0,0,0,0,0];for(var k2 in S[j].P)s2[burc(S[j].P[k2].lon)]++;if(M.max.apply(null,s2)>=3)gun3++;}
   return [tarih(S[i].t)+' · en kalabalık: '+say[enb]+' gezegen '+BURC[enb]+'’ta', gun3+' gün üçlü / '+(i+1)];}
 },
 anaretik:{
  etiket:'29. derecede kim var',
  ciz:function(c,G,S,i){
   var h=halka(c,G,-1),P=S[i].P;
   for(var b=0;b<12;b++){var a=ang(b*30+29.5),r0=h.ic-2,r1=h.rp+8;c.strokeStyle=tkr('--acc',.35);c.lineWidth=1;
    c.beginPath();c.moveTo(h.cx+cs(a)*r0,h.cy+sn(a)*r0);c.lineTo(h.cx+cs(a)*r1,h.cy+sn(a)*r1);c.stroke();}
   K7.forEach(function(k){var p=P[k],on=der(p.lon)===29;
    var n=nokta(c,h,p.lon,h.rp,k==='sun'||k==='moon',on?tk('--acc'):tkr('--ink',on?1:.55));
    if(on){c.beginPath();c.arc(n[0],n[1],9,0,TAU);c.strokeStyle=tkr('--acc',.6);c.lineWidth=1;c.stroke();}
    glif(c,h,p,h.rp,on?tk('--ink'):tkr('--ink',.6));});
  },
  oku:function(S,i){var P=S[i].P,l=[];K7.forEach(function(k){if(der(P[k].lon)===29)l.push(P[k].n+' ('+BURC[burc(P[k].lon)]+')');});
   var g=0;for(var j=0;j<=i;j++){var v=false;for(var k2 in S[j].P)if(der(S[j].P[k2].lon)===29)v=true;if(v)g++;}
   return [tarih(S[i].t)+' · 29. derece: '+(l.length?l.join(', '):'kimse yok'), g+' gün / '+(i+1)];}
 }
};

function kur(el,o){
 if(!el||!W.SorbiAstro)return null;
 var T=TIP[(o||{}).tip]||TIP.retro;
 el.innerHTML='<canvas class="sg-c" aria-label="'+T.etiket+'"></canvas><div class="sg-oku"><span class="sg-t"></span><span class="sg-f"></span></div>'
  +'<div class="sg-cizgi" role="slider" aria-label="Gün" tabindex="0"><i></i><b></b></div>';
 var cv=el.querySelector('.sg-c'),tEl=el.querySelector('.sg-t'),fEl=el.querySelector('.sg-f'),ciz_=el.querySelector('.sg-cizgi'),tut=ciz_.querySelector('b');
 var S=[],N=365,bas=new Date();bas.setHours(12,0,0,0);bas=new Date(bas.getTime()-(N-1)*864e5);
 var ST={i:0,rid:0,oyn:!AZ,t0:0,sure:9000,son:-1};
 function ciz(){
  var dpr=M.min(W.devicePixelRatio||1,2),G=cv.clientWidth||520;
  if(cv.width!==M.round(G*dpr)){cv.width=M.round(G*dpr);cv.height=cv.width;}
  var c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,G,G);
  if(!S.length)return;var i=M.min(ST.i,S.length-1);
  T.ciz(c,G,S,i);var m=T.oku(S,i);tEl.textContent=m[0];fEl.textContent=m[1];tut.style.left=(i/(N-1)*100)+'%';
 }
 /* hesap: kare başına birkaç gün, halka dolarken görünür */
 (function hesapla(){var t=performance.now();while(S.length<N&&performance.now()-t<12)S.push(gun(new Date(bas.getTime()+S.length*864e5)));
  ST.i=S.length-1;ciz();if(S.length<N)requestAnimationFrame(hesapla);else if(ST.oyn)oynat();})();
 function oynat(){ST.i=0;ST.t0=0;(function adim(ts){if(!ST.oyn)return;if(!ST.t0)ST.t0=ts;
  var i=M.min(N-1,M.floor(ease(M.max(0,M.min(1,(ts-ST.t0)/ST.sure)))*(N-1)));
  if(i!==ST.i){ST.i=i;ciz();}if(i<N-1)ST.rid=requestAnimationFrame(adim);else ST.rid=0;})(performance.now());}
 function dur(){ST.oyn=false;if(ST.rid)cancelAnimationFrame(ST.rid);ST.rid=0;}
 function konum(ev){var r=ciz_.getBoundingClientRect();ST.i=M.round(M.max(0,M.min(1,(ev.clientX-r.left)/r.width))*(N-1));ciz();}
 var sur=false;
 ciz_.addEventListener('pointerdown',function(e){dur();sur=true;ciz_.setPointerCapture(e.pointerId);konum(e);});
 ciz_.addEventListener('pointermove',function(e){if(sur)konum(e);});
 ciz_.addEventListener('pointerup',function(){sur=false;});
 ciz_.addEventListener('keydown',function(e){var k=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!k)return;e.preventDefault();dur();
  ST.i=M.max(0,M.min(N-1,ST.i+k*(e.shiftKey?30:1)));ciz();});
 cv.addEventListener('click',function(){if(ST.oyn){dur();}else{ST.oyn=true;oynat();}});
 W.addEventListener('resize',ciz);
 try{new MutationObserver(ciz).observe(D.documentElement,{attributes:true,attributeFilter:['data-tema']});}catch(e){}
 return {yeniden:ciz,dur:dur};
}
W.SorbiSayimGorsel={kur:kur};
})();
