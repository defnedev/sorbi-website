/*! sorbi-burc.js — Burçlar bölümünün etkileşim katmanı. Sunucusuz, dış bağımlılık yok.
 * 1) SorbiGosteri'ye "burc-dagilimi" tipini ekler (24.000 gök anının burç dağılımı).
 * 2) Hub'da element/nitelik süzgeci, burç seçici ve seçilen burcu canlı gösterimlere bağlar.
 * 3) Burç sayfalarında "okudum" işaretlemesini SorbiOyun'a yazar; hub ilerlemesine sayılır.
 * Veri: /nadirlik-veri.json (sayfa başına tek istek, SorbiGosteri'nin data-kaynak'ı ile).
 */
(function(){
'use strict';
/* canvas fillStyle CSS degiskeni okuyamaz; boyama aninda cozulur.
   Boylece canvas da gunduz/gece temasini takip eder. */
var __rc={};
function tk(ad){
  var t=document.documentElement.getAttribute('data-tema')||'gece', k=t+'|'+ad;
  if(__rc[k]) return __rc[k];
  var v=getComputedStyle(document.documentElement).getPropertyValue(ad).trim();
  return (__rc[k]=v||'#F2EFE9');
}
function tkr(ad,a){ return 'rgba('+tk(ad+'-rgb')+','+a+')'; }

var W=window,D=document,M=Math;
var S='Koç Boğa İkizler Yengeç Aslan Başak Terazi Akrep Yay Oğlak Kova Balık'.split(' ');
var SG='♈︎ ♉︎ ♊︎ ♋︎ ♌︎ ♍︎ ♎︎ ♏︎ ♐︎ ♑︎ ♒︎ ♓︎'.split(' ');
var ELC=[tk('--acc'),tk('--ink'),tk('--acc'),tk('--mut')];
var C={bg:tk('--bg'),ln:tkr('--ink',.10),ink:tk('--ink'),mut:tk('--mut'),dim:tk('--dim'),
 gld:tk('--acc'),gbr:tk('--ink')};
var NOK=[['sun','Güneş burcu','Güneş'],['moon','Ay burcu','Ay'],['asc','Yükselen burç','yükselen']];

/* ── sayı biçimi (tr) ── */
function bin(n){var s=String(M.round(n)),o='',i=s.length;
 while(i>3){o='.'+s.slice(i-3,i)+o;i-=3;}return s.slice(0,i)+o;}
function vir(x,b){var s=(+x).toFixed(b==null?1:b);return s.replace('.',',');}
function yuz(v,t){return vir(v/t*100)+'%';}

/* ── 24.000 gök anında burç dağılımı ── */
function tipDagilim(d){
 var b0=S.indexOf(d.burc);
 return{
 etiket:'24.000 gök anında burç dağılımı: Güneş, Ay ve yükselen için on iki burç.',
 en:1000,boy:function(G){return G<520?1.02:.52;},adet:3,hiz:2200,kare:0,durak:0,
 kay:[{ad:'k',min:0,max:2,etiket:'Nokta seç: Güneş burcu, Ay burcu, yükselen burç'}],
 ciz:function(c){
  var o=c.o,G=c.G,Y=c.Y,k=c.k%3,V=c.veri||{},B=V.b||{},T=+V.t||0,A=B[NOK[k][0]];
  o.fillStyle=C.bg;o.fillRect(0,0,G,Y);
  function yz(m,x,y,f,r,h){o.fillStyle=r;o.font=f+' ui-monospace,Menlo,monospace';
   o.textAlign=h||'left';o.textBaseline='middle';o.fillText(m,x,y);}
  if(!A||!A.length||!T){yz('Veri yüklenemedi',G/2,Y/2,'12px',C.dim,'center');return;}
  var az=G<430,LW=az?26:100,RW=az?54:112,ust=az?30:34,alt=Y-(az?18:22);
  var x0=LW,x1=G-RW,gen=M.max(30,x1-x0),h=(alt-ust)/12,mx=0,i,v;
  for(i=0;i<12;i++)mx=M.max(mx,A[i]);
  var esit=T/12,ex=x0+esit/mx*gen;
  yz(az?NOK[k][1]:NOK[k][1]+' · '+bin(T)+' gök anında',0,ust/2,az?'11px':'13px',C.ink);
  if(!az)yz('eşit dağılım '+bin(esit),G,ust/2,'11px',C.dim,'right');
  for(i=0;i<12;i++){
   v=A[i];var y=ust+h*i,ym=y+h/2,bw=M.max(1,v/mx*gen),se=i===b0;
   o.globalAlpha=se?.95:.44;o.fillStyle=se?C.gbr:ELC[i%4];
   o.beginPath();o.rect(x0,y+h*.18,bw,h*.64);o.fill();o.globalAlpha=1;
   if(se){o.strokeStyle=C.gbr;o.lineWidth=1;o.stroke();}
   yz(SG[i],az?0:2,ym,az?'11px':'12px',se?C.gbr:C.dim);
   if(!az)yz(S[i],22,ym,'11px',se?C.ink:C.mut);
   yz(az?yuz(v,T):bin(v)+'  '+yuz(v,T),G,ym,az?'9px':'11px',se?C.gbr:C.mut,'right');
  }
  o.setLineDash([4,4]);o.strokeStyle=tkr('--ink',.6);o.lineWidth=1;
  o.beginPath();o.moveTo(ex,ust);o.lineTo(ex,alt);o.stroke();o.setLineDash([]);
  yz(az?'kesikli çizgi: eşit dağılım '+bin(esit)
     :'kesikli çizgi: on iki burca eşit dağılım',x0,(alt+Y)/2,az?'9px':'10px',C.dim);
 },
 metin:function(c){
  var k=c.k%3,V=c.veri||{},B=V.b||{},T=+V.t||0,A=B[NOK[k][0]];
  if(!A||!A.length||!T)return{o:'Veri yüklenemedi',z:''};
  var en=0,az=0,i;
  for(i=1;i<12;i++){if(A[i]>A[en])en=i;if(A[i]<A[az])az=i;}
  var kat=vir(A[en]/A[az],2),me=b0>=0?A[b0]:0,fk=b0>=0?me-T/12:0;
  return{o:NOK[k][1]+' · en sık <b>'+S[en]+'</b> '+yuz(A[en],T)+' · en seyrek <b>'+S[az]+'</b> '+yuz(A[az],T),
  z:'<b>'+bin(T)+' gök anı</b> içinde '+NOK[k][2]+' dağılımı: en sık <i>'+S[en]+'</i> ('
   +bin(A[en])+' an, '+yuz(A[en],T)+'), en seyrek <i>'+S[az]+'</i> ('+bin(A[az])+' an, '+yuz(A[az],T)
   +'). En sık ile en seyrek arasında <b>'+kat+' kat</b> fark var.'
   +(b0>=0?' '+S[b0]+' burcunda '+bin(me)+' an ('+yuz(me,T)+') — eşit dağılımın '
     +(fk>=0?bin(M.abs(fk))+' an üstünde':bin(M.abs(fk))+' an altında')+'.':'')
   +' Sayılar bu örneklemin kendisidir; genel bir nüfus oranı olarak değil, ölçülmüş bir dağılım olarak okunabilir.'};
 }};
}

/* ── gösterimlerin kaydırıcısını sürerek burç değiştir ── */
function surukle(el,i){
 if(!el)return false;
 var r=el.querySelector('input[type=range]');
 if(!r)return false;
 r.value=i;
 try{r.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){return false;}
 return true;
}

/* ── hub ── */
function hub(){
 var kok=D.getElementById('bkKesif');if(!kok)return;
 var izg=D.getElementById('bkIzgara'),say=D.getElementById('bkSayac');
 var panel=D.getElementById('bkSecili'),tuner=D.getElementById('bkTuner');
 var carki=D.getElementById('bkCark'),izgara=D.getElementById('bkEln');
 var kartlar=izg?[].slice.call(izg.children):[];
 var suz={el:'',nit:''},secili=-1;

 function veri(li){var s=li.dataset;return s;}
 function secil(i,odak){
  if(i<0||i>11||i===secili)return;
  secili=i;
  var li=kartlar.filter(function(x){return +x.dataset.i===i;})[0];
  if(tuner)[].forEach.call(tuner.querySelectorAll('button'),function(b){
   b.setAttribute('aria-pressed',+b.dataset.i===i?'true':'false');});
  surukle(carki,i);surukle(izgara,i);
  if(panel&&li){var s=li.dataset;
   panel.innerHTML='<p class="bk-etiket">Çarkta seçili burç</p>'
    +'<p class="bk-ozet"><b>'+s.glif+' '+s.ad+'</b> — '+s.tarih+' · '+s.el+' elementi, '+s.nit
    +' niteliği · yöneticisi '+s.yon+'. '+s.ozet+'</p>'
    +'<p class="bk-g">24.000 gök anında Güneş’i '+s.ad+' burcunda olan '+s.say
    +' an var ('+s.oran+').</p>'
    +'<p><a class="bk-bag" href="/'+s.slug+'-burcu-ozellikleri">'+s.ad
    +' burcu özellikleri <span aria-hidden="true">→</span></a></p>';
  }
  if(odak&&li){var g=li.querySelector('a');if(g)g.focus();}
 }
 function suzgecUygula(){
  var n=0;
  kartlar.forEach(function(li){
   var ok=(!suz.el||li.dataset.el===suz.el)&&(!suz.nit||li.dataset.nit===suz.nit);
   li.hidden=!ok;if(ok)n++;
  });
  if(say)say.textContent=n===12?'On iki burcun tamamı gösteriliyor.'
   :(n+' burç gösteriliyor'+(suz.el?' · '+suz.el:'')+(suz.nit?' · '+suz.nit:'')+'.');
 }
 [].forEach.call(kok.querySelectorAll('.bk-f'),function(b){
  b.addEventListener('click',function(){
   var t=b.dataset.tur;suz[t]=b.dataset.deger||'';
   [].forEach.call(kok.querySelectorAll('.bk-f[data-tur="'+t+'"]'),function(o){
    o.setAttribute('aria-pressed',o===b?'true':'false');});
   suzgecUygula();
  });
 });
 if(tuner)[].forEach.call(tuner.querySelectorAll('button'),function(b){
  b.addEventListener('click',function(){secil(+b.dataset.i);});
 });
 kartlar.forEach(function(li){
  var i=+li.dataset.i;
  li.addEventListener('pointerenter',function(){secil(i);});
  li.addEventListener('focusin',function(){secil(i);});
 });
 suzgecUygula();
 isaretleriBoya(kartlar);
}

/* ── okunan burçları ızgarada göster ── */
function isaretleriBoya(kartlar){
 if(!W.SorbiOyun)return;
 var t=(W.SorbiOyun.durum()||{}).tamam||{};
 kartlar.forEach(function(li){
  var a=li.querySelector('.bk-kart');if(!a)return;
  if(t['burc-'+li.dataset.slug])a.classList.add('okundu');else a.classList.remove('okundu');
 });
}

/* ── ilerleme kartındaki sayıyı yalnız burçlara göre düzelt ── */
function ilerlemeDuzelt(){
 var el=D.querySelector('[data-sorbi-ilerleme="burclar"]');
 if(!el||!W.SorbiOyun)return;
 var gz=null;
 function uygula(){
  var t=(W.SorbiOyun.durum()||{}).tamam||{},n=0,top=+el.getAttribute('data-toplam')||12;
  for(var k in t)if(k.indexOf('burc-')===0)n++;
  var sp=el.querySelector('.sbo-halka span'),cr=el.querySelectorAll('.sbo-halka circle'),
      p=el.querySelector('.sbo-bilgi p'),deg=0;
  if(!sp)return;
  var yaz=n+'/'+top;
  if(sp.textContent!==yaz){sp.textContent=yaz;deg=1;}
  if(cr&&cr[1]){var ce=2*M.PI*26,o=(ce*(1-M.min(1,n/top))).toFixed(1);
   if(cr[1].getAttribute('stroke-dashoffset')!==o){cr[1].setAttribute('stroke-dashoffset',o);deg=1;}}
  if(p){var h=p.innerHTML,h2=h.replace(/^\d+ \/ \d+ bölüm bitti/,n+' / '+top+' burç okundu');
   if(h2!==h){p.innerHTML=h2;deg=1;}}
  return deg;
 }
 function sar(){
  if(gz)gz.disconnect();
  uygula();
  if(gz)try{gz.observe(el,{childList:true,subtree:true});}catch(e){}
 }
 try{gz=new MutationObserver(sar);}catch(e){gz=null;}
 sar();
}

/* ── burç sayfası: okudum işaretlemesi ── */
function isaretDugmesi(){
 var kap=D.getElementById('bkIsaret');if(!kap||!W.SorbiOyun)return;
 var b=kap.querySelector('button');if(!b)return;
 var slug=b.dataset.slug,ad=b.dataset.ad,id='burc-'+slug;
 kap.hidden=false;
 function boya(){
  var t=(W.SorbiOyun.durum()||{}).tamam||{};
  if(t[id]){b.setAttribute('aria-pressed','true');b.disabled=true;
   b.textContent='✦ '+ad+' okundu olarak işaretli';}
  else{b.setAttribute('aria-pressed','false');
   b.textContent=ad+'’u okudum olarak işaretle';}
 }
 b.addEventListener('click',function(){
  W.SorbiOyun.tamamla(id,12);W.SorbiOyun.isaretle('okundu:'+slug);boya();
 });
 boya();
}

/* ── kurulum ── */
function kur(){
 if(W.SorbiGosteri){
  W.SorbiGosteri.ekle('burc-dagilimi',tipDagilim);
  [].forEach.call(D.querySelectorAll('[data-sorbi-gosteri="burc-dagilimi"]'),function(el){
   el.hidden=false;try{delete el.dataset.sbgKuruldu;}catch(e){el.removeAttribute('data-sbg-kuruldu');}
  });
  W.SorbiGosteri.kur();
 }
 hub();isaretDugmesi();ilerlemeDuzelt();
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',kur);else kur();
})();
