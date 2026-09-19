/*! sorbi-uyum.js — Burç uyumu sayfasının etkileşim katmanı. Sunucusuz, dış bağımlılık yok.
 * 1) SorbiGosteri'ye "uyum-carki" tipini ekler: seçilen iki burç çarkta birlikte vurgulanır.
 * 2) Erişilebilir iki burç seçici (role=radiogroup, ok tuşları, Home/End, Enter/Boşluk).
 * 3) Puanı DEĞİŞTİRMEDEN açıklar: taban puan, element düzeltmesi, açı düzeltmesi, sınırlama.
 * 4) Oyunlaştırma: denenen çift sayısı, görülen açı ilişkileri, nişanlar — hepsi SorbiOyun üzerinden.
 * 5) /nadirlik-veri.json'dan iki Güneş burcunun ölçülmüş payını okur; çift sayımı veride yoktur,
 *    bu yüzden yalnız iki paydan türetilen hesap, türetildiği söylenerek gösterilir.
 * Puanlama kodu burc-uyumu.html'in eski sürümünden birebir taşınmıştır; aynı çift aynı sonucu verir.
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
var PI=M.PI,TAU=PI*2,rd=PI/180,mn=M.min,mx=M.max,cs=M.cos,sn=M.sin;

/* ── burç tablosu (sayfa başına tek kaynak) ── */
var S='Koç Boğa İkizler Yengeç Aslan Başak Terazi Akrep Yay Oğlak Kova Balık'.split(' ');
var SG='♈︎ ♉︎ ♊︎ ♋︎ ♌︎ ♍︎ ♎︎ ♏︎ ♐︎ ♑︎ ♒︎ ♓︎'.split(' ');
var SL='koc boga ikizler yengec aslan basak terazi akrep yay oglak kova balik'.split(' ');
var EL='Ateş Toprak Hava Su'.split(' ');
var NT='Öncü Sabit Değişken'.split(' ');
var YON='Mars Venüs Merkür Ay Güneş Merkür Venüs Mars Jüpiter Satürn Satürn Jüpiter'.split(' ');
var YMO={7:'Plüton',10:'Uranüs',11:'Neptün'};
var TAR=['21 Mart – 19 Nisan','20 Nisan – 20 Mayıs','21 Mayıs – 20 Haziran',
 '21 Haziran – 22 Temmuz','23 Temmuz – 22 Ağustos','23 Ağustos – 22 Eylül',
 '23 Eylül – 22 Ekim','23 Ekim – 21 Kasım','22 Kasım – 21 Aralık',
 '22 Aralık – 19 Ocak','20 Ocak – 18 Şubat','19 Şubat – 20 Mart'];
var ELC=[tk('--acc'),tk('--ink'),tk('--acc'),tk('--mut')];
var C={bg:tk('--bg'),ln:tkr('--ink',.10),l2:tkr('--ink',.20),
 ink:tk('--ink'),mut:tk('--mut'),gld:tk('--acc'),gbr:tk('--ink'),dun:tk('--mut')};

/* burç uzaklığına karşılık gelen açı; adlar sitenin ortak açı tablosundaki adlar */
var ACI=[
 {ad:'Kavuşum', de:0,   buyuk:1, ar:'aynı burç'},
 {ad:'Otuzluk', de:30,  buyuk:0, ar:'yan yana burçlar'},
 {ad:'Altmışlık',de:60, buyuk:1, ar:'iki burç arayla'},
 {ad:'Kare',    de:90,  buyuk:1, ar:'üç burç arayla'},
 {ad:'Üçgen',   de:120, buyuk:1, ar:'dört burç arayla'},
 {ad:'Yüzelli', de:150, buyuk:0, ar:'beş burç arayla'},
 {ad:'Karşıt',  de:180, buyuk:1, ar:'zodyağın karşı ucu'}
];

/* ══ 1 · PUANLAMA — eski sayfadan birebir ══════════════════════════════════
 * meta / clamp / elCompat / ask / ile / uzu / ov: tek karakteri değişmedi.      */
function meta(a,b){var d=((b-a)%12+12)%12;var dd=M.min(d,12-d);
 if(dd===0)return{base:82,t:'same'};if(dd===4)return{base:92,t:'trine'};if(dd===2)return{base:86,t:'sextile'};
 if(dd===6)return{base:78,t:'opp'};if(dd===3)return{base:62,t:'square'};if(dd===1)return{base:55,t:'semi'};return{base:52,t:'quin'};}
function clamp(n){return M.max(38,M.min(97,M.round(n)));}
function elCompat(a,b){var ea=a%4,eb=b%4;if(ea===eb)return true;var s=[ea,eb].sort().join('');return s==='02'||s==='13';}
var TAGS={same:'İkiz Ruhlar',trine:'Doğal Akış',sextile:'Tatlı Uyum',opp:'Zıt Çekim',
 square:'Tutkulu Gerilim',semi:'Emek İster',quin:'Ayar Gerektiren'};
var READS={
 same:function(A,B,i){return 'Aynı burçtan ikiniz — '+A+' ve '+B+'. Birbirinizi ayna gibi okuyabilir, aynı dili konuşuyor gibi hissedebilirsiniz. Güçlü yanlar kadar zorlandığınız yanlar da ortak olabilir; ikiniz aynı anda hızlanınca frene basacak kimse kalmayabilir.';},
 trine:function(A,B,i){return A+' ve '+B+' aynı elementten ('+EL[i%4]+') — aranızdaki ritim doğal ve akışkan gelebilir. Konuşmadan anlaşıldığı hissi sık çıkabilir. Rahatlık bu bağın gücü olabilir; aynı rahatlık zamanla hareketsizliğe de dönüşebilir.';},
 sextile:function(A,B,i){return A+' ile '+B+' birbirini besleyen elementlerden — biri kıvılcımı verirken diğeri onu büyütebilir. Yakınlık kolay kurulabilir, enerji dengeli seyredebilir. Keyifli ve sürdürülebilir bir zemin olabilir.';},
 opp:function(A,B,i){return A+' ve '+B+' zodyağın tam karşı uçları — zıt kutuplar arasında güçlü bir çekim oluşabilir. Biri diğerinin eksik bıraktığı yeri tamamlayabilir. Aynı zıtlık, denge kurulmadığında gerginliğin de kaynağı olabilir.';},
 square:function(A,B,i){return A+' ve '+B+' arasında elektrik yüksek, sürtüşme de olabilir. Sizi farklı yönlere çeken güçlü bir enerji var gibi görünebilir. Hareketli ve tutkulu bir bağ kurulabilir; çekişmeye dönüşmemesi için ikinizin de esnemesi gerekebilir.';},
 semi:function(A,B,i){return A+' ve '+B+' yan yana burçlar — başta birbirinize farklı diller konuşuyor gibi gelebilir. “Bu nereden çıktı” dediğiniz anlar olabilir; anlamak için emek verilirse beklenmedik bir öğreticilik çıkabilir.';},
 quin:function(A,B,i){return A+' ve '+B+' arası sürekli ayar isteyen bir bağ olabilir. Ortak nokta bulmak çaba isteyebilir; farklılığa saygı duyulduğunda ikinizi de olgunlaştıran bir ilişki haline gelebilir.';}
};

/* hesabı ve hesabın gerekçesini birlikte üretir */
function hesapla(a,b){
 var m=meta(a,b),comp=elCompat(a,b);
 var acAsk=(m.t==='opp'?10:m.t==='square'?7:m.t==='trine'?3:0);
 var elAsk=(comp?2:-2);
 var elIle=(comp?5:-4);
 var acIle=(m.t==='sextile'?4:0)-(m.t==='square'?3:0);
 var acUzu=((m.t==='trine'||m.t==='same')?6:0)-((m.t==='square'||m.t==='quin'||m.t==='semi')?6:0);
 var elUzu=(comp?2:0);
 var hamAsk=m.base+acAsk+elAsk,hamIle=m.base+elIle+acIle,hamUzu=m.base+acUzu+elUzu;
 var ask=clamp(hamAsk),ile=clamp(hamIle),uzu=clamp(hamUzu);
 var d=((b-a)%12+12)%12,dd=M.min(d,12-d);
 return {a:a,b:b,m:m,dd:dd,comp:comp,
  acAsk:acAsk,elAsk:elAsk,elIle:elIle,acIle:acIle,acUzu:acUzu,elUzu:elUzu,
  hamAsk:hamAsk,hamIle:hamIle,hamUzu:hamUzu,
  ask:ask,ile:ile,uzu:uzu,ov:M.round((ask+ile+uzu)/3)};
}

/* ── biçim yardımcıları ── */
function bin(n){var s=String(M.round(n)),o='',i=s.length;
 while(i>3){o='.'+s.slice(i-3,i)+o;i-=3;}return s.slice(0,i)+o;}
function vir(x,b){return (+x).toFixed(b==null?1:b).replace('.',',');}
function im(n){return (n<0?'−':'+')+M.abs(n);}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function yonAd(i){return YON[i]+(YMO[i]?' (modern '+YMO[i]+')':'');}
function elIliski(a,b){if(a%4===b%4)return 'aynı element';
 return elCompat(a,b)?'birbirini besleyen element':'gerilimli element ilişkisi';}

/* ══ 2 · GÖSTERİM TİPİ: uyum-carki ════════════════════════════════════════ */
var ST={a:null,b:null};
function zm(o,G,Y){o.fillStyle=C.bg;o.fillRect(0,0,G,Y);}
function yz(o,m,x,y,b,r,h){o.fillStyle=r||C.mut;o.font=(b||'11px')+' ui-monospace,Menlo,monospace';
 o.textAlign=h||'left';o.textBaseline='middle';o.fillText(m,x,y);}
function cz(o,x0,y0,x1,y1,c,w){o.strokeStyle=c;o.lineWidth=w||1;o.beginPath();
 o.moveTo(x0,y0);o.lineTo(x1,y1);o.stroke();}
function dt(o,x,y,r,c){o.fillStyle=c;o.beginPath();o.arc(x,y,r,0,TAU);o.fill();}
function dlm(o,cx,cy,R,ic,a0,a1){o.beginPath();o.arc(cx,cy,R,a0,a1);o.arc(cx,cy,ic,a1,a0,true);o.closePath();}
/* iki burcu birlikte vurgulayan halka */
function halka2(o,cx,cy,R,ic,va,vb){
 for(var b=0,t,g;b<12;b++){
  var a0=(b*30-90)*rd,a1=a0+PI/6,am=a0+PI/12,se=(b===va||b===vb);
  dlm(o,cx,cy,R,ic,a0,a1);
  o.globalAlpha=se?.46:.15;o.fillStyle=ELC[b%4];o.fill();o.globalAlpha=1;
  o.strokeStyle=se?C.gbr:C.ln;o.lineWidth=se?1.8:1;o.stroke();
  yz(o,SG[b],cx+cs(am)*(R+ic)/2,cy+sn(am)*(R+ic)/2,se?'15px':'12px',se?C.gbr:C.mut,'center');
  for(t=0;t<=b%3;t++){g=am+(t-(b%3)/2)*.12;
   cz(o,cx+cs(g)*(R-3),cy+sn(g)*(R-3),cx+cs(g)*(R+3),cy+sn(g)*(R+3),se?C.gbr:C.l2,1.4);}
 }
}
function tipCark(){
 return {etiket:'Zodyak çarkı: seçilen iki burç birlikte vurgulanır, aralarındaki kiriş ve açı çizilir.',
 en:1000,boy:function(G){return G<520?1:.62;},adet:0,
 ciz:function(c){
  var o=c.o,G=c.G,Y=c.Y,a=ST.a,b=ST.b;
  zm(o,G,Y);
  var cx=G/2,cy=Y/2,R=mn(G,Y)/2-14,ic=R-mx(24,R*.16),g=ic>132;
  halka2(o,cx,cy,R,ic,a==null?-1:a,b==null?-1:b);
  if(a==null||b==null){
   yz(o,'İki burç seç',cx,cy-8,g?'15px':'13px',C.ink,'center');
   yz(o,'dilim rengi element · çentik nitelik',cx,cy+14,'10px',C.mut,'center');
   return;
  }
  var A=ACI[M.min(((b-a)%12+12)%12,12-(((b-a)%12+12)%12))];
  var pa=(a*30+15-90)*rd,pb=(b*30+15-90)*rd,rr=ic*.93;
  if(a!==b){
   o.strokeStyle=tkr('--ink',.85);o.lineWidth=2;
   o.beginPath();o.moveTo(cx+cs(pa)*rr,cy+sn(pa)*rr);o.lineTo(cx+cs(pb)*rr,cy+sn(pb)*rr);o.stroke();
   o.strokeStyle=tkr('--ink',.45);o.lineWidth=1.5;
   o.beginPath();o.arc(cx,cy,ic*.74,mn(pa,pb),mx(pa,pb),(mx(pa,pb)-mn(pa,pb))>PI);o.stroke();
  }
  dt(o,cx+cs(pa)*rr,cy+sn(pa)*rr,5,C.gld);
  dt(o,cx+cs(pb)*rr,cy+sn(pb)*rr,5,C.dun);
  /* orta madalyon: kirişin üstünü temizler, metni okunur tutar */
  var mr=mn(ic*.62,g?96:74);
  o.fillStyle=C.bg;o.beginPath();o.arc(cx,cy,mr,0,TAU);o.fill();
  o.strokeStyle=tkr('--ink',.12);o.lineWidth=1;o.stroke();
  yz(o,SG[a]+'  ✦  '+SG[b],cx,cy-(g?40:30),g?'19px':'15px',C.gbr,'center');
  yz(o,A.de+'°',cx,cy-(g?12:8),g?'26px':'21px',C.ink,'center');
  yz(o,A.ad+(A.buyuk?'':' · küçük açı'),cx,cy+(g?14:14),g?'13px':'11px',C.gbr,'center');
  if(g){
   yz(o,EL[a%4]+' & '+EL[b%4],cx,cy+38,'11px',C.mut,'center');
   yz(o,NT[a%3]+' & '+NT[b%3],cx,cy+56,'11px',C.mut,'center');
  }
 },
 metin:function(){
  var a=ST.a,b=ST.b;
  if(a==null||b==null)return{o:'Henüz burç seçilmedi',
   z:'Çarkta dilim rengi elementi, kenardaki çentik sayısı niteliği gösteriyor: bir çentik öncü, iki sabit, üç değişken. İki burç seçtiğinde ikisi birlikte vurgulanır ve aralarındaki kiriş çizilir.'};
  var dd=M.min(((b-a)%12+12)%12,12-(((b-a)%12+12)%12)),A=ACI[dd],h=hesapla(a,b);
  return{o:SG[a]+' <b>'+S[a]+'</b> ✦ '+SG[b]+' <b>'+S[b]+'</b> · <b>'+A.de+'°</b> · '+A.ad,
  z:'<b>'+S[a]+'</b> '+(a*30)+'°–'+(a*30+30)+'° ('+EL[a%4]+' / '+NT[a%3]+'), <b>'+S[b]+'</b> '
   +(b*30)+'°–'+(b*30+30)+'° ('+EL[b%4]+' / '+NT[b%3]+'). Zodyakta aradaki en kısa mesafe <b>'+dd
   +' burç = '+A.de+'°</b> — '+A.ar+'. Bu açının adı <i>'+A.ad+'</i>'
   +(A.buyuk?' ve beş büyük açıdan biri.':' ; beş büyük açının dışında kalan küçük bir açı.')
   +' Sayfadaki üç ölçünün tabanı bu mesafeden geliyor: <b>'+h.m.base+'</b>.'
   +' Burç ortası dereceler kullanıldığı için açı tam sayıdır; bir kişinin haritasında gezegenin derecesi bu değeri kaydırır.'};
 }};
}

/* ══ 3 · SEÇİCİ (role=radiogroup, tam klavye) ═════════════════════════════ */
function grupKur(el,hangi,degisti){
 var btns=[];
 el.setAttribute('role','radiogroup');
 el.innerHTML=S.map(function(s,i){
  return '<button type="button" role="radio" aria-checked="false" tabindex="'+(i?'-1':'0')+'"'
   +' class="uy-sg" data-i="'+i+'" aria-label="'+esc(s+' — '+TAR[i]+', '+EL[i%4]+' elementi, '+NT[i%3]+' niteliği')+'">'
   +'<span class="uy-gl" aria-hidden="true">'+SG[i]+'</span><span class="uy-ad">'+esc(s)+'</span></button>';
 }).join('');
 btns=[].slice.call(el.querySelectorAll('button'));
 var sec=-1;
 function boya(){
  btns.forEach(function(b,i){
   b.setAttribute('aria-checked',i===sec?'true':'false');
   b.tabIndex=(sec<0?(i===0?0:-1):(i===sec?0:-1));
  });
 }
 function ata(i,odak){
  if(i<0||i>11)return;
  sec=i;boya();
  if(odak)btns[i].focus();
  degisti(hangi,i);
 }
 btns.forEach(function(b,i){
  b.addEventListener('click',function(){ata(i,false);});
  b.addEventListener('keydown',function(e){
   var k=e.key,n=-1;
   if(k==='ArrowRight'||k==='ArrowDown')n=(i+1)%12;
   else if(k==='ArrowLeft'||k==='ArrowUp')n=(i+11)%12;
   else if(k==='Home')n=0;
   else if(k==='End')n=11;
   else if(k===' '||k==='Enter'||k==='Spacebar'){e.preventDefault();ata(i,true);return;}
   else return;
   e.preventDefault();ata(n,true);
  });
 });
 boya();
 return {ata:ata,dugmeler:btns};
}

/* ══ 4 · OYUNLAŞTIRMA ═════════════════════════════════════════════════════ */
var NISAN=[
 {ad:'ilk-cift',b:'İlk çift',a:'İki burç seçip ilk sonucu görünce açılır.',
  ko:function(n,t,s){return n>=1;}},
 {ad:'bes-cift',b:'Beş çift',a:'Beş farklı burç çifti denenince açılır.',
  ko:function(n){return n>=5;}},
 {ad:'on-iki-cift',b:'On iki çift',a:'On iki farklı burç çifti denenince açılır.',
  ko:function(n){return n>=12;}},
 {ad:'bes-aci',b:'Beş açı ilişkisi',a:'Kavuşum, altmışlık, kare, üçgen, karşıt, otuzluk ve yüzelliden beş ayrı ilişkiyi görünce açılır.',
  ko:function(n,t){return t>=5;}},
 {ad:'aci-sinavi',b:'Açı sınavı',a:'Aşağıdaki sınavın bütün sorularını doğru yanıtlayınca açılır.',
  ko:function(n,t,s){return !!(s&&s.n&&s.d===s.n);}}
];
function durum(){try{return (W.SorbiOyun&&W.SorbiOyun.durum())||{};}catch(e){return {};}}
function sayOn(o,ek){var n=0;for(var k in o||{})if(k.indexOf(ek)===0)n++;return n;}
function ciftSay(){return sayOn(durum().olay,'uyum:');}
function aciSay(){return sayOn(durum().olay,'uyumaci:');}
function sinavD(){try{return W.SorbiOyun?W.SorbiOyun.sinavSonuc('uyum-acilar'):null;}catch(e){return null;}}
function nisanBoya(){
 var kap=D.getElementById('uyNisan');if(!kap)return;
 var n=ciftSay(),t=aciSay(),s=sinavD();
 kap.innerHTML=NISAN.map(function(N){
  var ac=false;try{ac=!!N.ko(n,t,s);}catch(e){}
  return '<span class="sbo-r'+(ac?' ac':'')+'" title="'+esc(N.a)+'" aria-label="'
   +esc(N.b+' — '+(ac?'açıldı':'henüz açılmadı')+'. '+N.a)+'">'
   +'<i aria-hidden="true">'+(ac?'✦':'·')+'</i>'+esc(N.b)+'</span>';
 }).join('');
}
/* ilerleme kartındaki sayıyı denenen çift sayısına göre düzeltir */
function ilerlemeDuzelt(){
 var el=D.querySelector('[data-sorbi-ilerleme="uyum"]');
 if(!el||!W.SorbiOyun)return function(){};
 var gz=null;
 function uygula(){
  var n=ciftSay(),top=mx(1,+el.getAttribute('data-toplam')||12);
  var sp=el.querySelector('.sbo-halka span'),cr=el.querySelectorAll('.sbo-halka circle'),
      p=el.querySelector('.sbo-bilgi p');
  if(!sp)return;
  var yaz=n+'/'+top;
  if(sp.textContent!==yaz)sp.textContent=yaz;
  if(cr&&cr[1]){var ce=2*PI*26,of=(ce*(1-mn(1,n/top))).toFixed(1);
   if(cr[1].getAttribute('stroke-dashoffset')!==of)cr[1].setAttribute('stroke-dashoffset',of);}
  if(p){var h=p.innerHTML,h2=h.replace(/^\d+ \/ \d+ bölüm bitti/,n+' / '+top+' çift denendi');
   if(h2!==h)p.innerHTML=h2;}
 }
 function sar(){if(gz)gz.disconnect();uygula();
  if(gz)try{gz.observe(el,{childList:true,subtree:true});}catch(e){}}
 try{gz=new MutationObserver(sar);}catch(e){gz=null;}
 sar();
 return sar;
}
var ILE=function(){};
var KILIT=0;
function ciftIsle(a,b){
 if(!W.SorbiOyun||KILIT)return;
 KILIT=1;
 try{
  var i=mn(a,b),j=mx(a,b),m=meta(a,b);
  W.SorbiOyun.isaretle('uyum:'+i+'-'+j);
  W.SorbiOyun.isaretle('uyumaci:'+m.t);
  var n=ciftSay(),t=aciSay();
  if(n>=1)W.SorbiOyun.tamamla('uyum-cift-1',10);
  if(n>=5)W.SorbiOyun.tamamla('uyum-cift-5',15);
  if(n>=12)W.SorbiOyun.tamamla('uyum-cift-12',20);
  if(t>=5)W.SorbiOyun.tamamla('uyum-aci-5',20);
 }catch(e){}
 KILIT=0;
 ILE();nisanBoya();
}

/* ══ 5 · ÖLÇÜLMÜŞ VERİ (nadirlik-veri.json) ═══════════════════════════════ */
var VERI=null,VERI_DURUM=0; /* 0 bekliyor · 1 hazır · 2 yok */
function veriCek(sonra){
 if(!W.fetch){VERI_DURUM=2;sonra();return;}
 W.fetch('/nadirlik-veri.json').then(function(r){return r.json();}).then(function(j){
  if(j&&j.b&&j.b.sun&&j.b.sun.length===12&&+j.t>0){VERI=j;VERI_DURUM=1;}else VERI_DURUM=2;
  sonra();
 },function(){VERI_DURUM=2;sonra();});
}
function veriYaz(a,b){
 var el=D.getElementById('uyVeri');if(!el)return;
 if(VERI_DURUM!==1||a==null||b==null){el.hidden=true;return;}
 var T=+VERI.t,A=VERI.b.sun[a],B=VERI.b.sun[b],pa=A/T,pb=B/T;
 var ayni=(a===b),ort=ayni?pa*pa:2*pa*pb;
 el.hidden=false;
 el.innerHTML='<h2>Ölçülmüş Veri</h2>'
 +'<p class="uy-g">Örneklenen 24.000 gök anında Güneş’i <b>'+esc(S[a])+'</b> burcunda olan <b>'+bin(A)
 +'</b> an var (%'+vir(pa*100)+'). '+(ayni?'Aynı burç seçildiği için tek pay kullanılıyor.'
 :'Güneş’i <b>'+esc(S[b])+'</b> burcunda olan <b>'+bin(B)+'</b> an var (%'+vir(pb*100)+').')+'</p>'
 +'<p class="uy-g">Bu örneklemden birbirinden bağımsız iki kişi seçilseydi ikisinin Güneş burcu bu ikili olurdu: '
 +(ayni?'%'+vir(pa*100)+' × %'+vir(pa*100):'2 × %'+vir(pa*100)+' × %'+vir(pb*100))
 +' = <b>%'+vir(ort*100,2)+'</b>.</p>'
 +'<p class="uy-k">Örneklemde çiftler ölçülmedi: veri dosyası tek tek anların burç dağılımını tutuyor. '
 +'Yukarıdaki iki sayı doğrudan ölçüm, üçüncü satır ise bu iki paydan türetilmiş bir hesap — '
 +'gözlenmiş bir çift sıklığı değil.</p>';
}

/* ══ 6 · SONUÇ PANELİ ═════════════════════════════════════════════════════ */
function satir(k,v,h){
 return '<div class="uy-sat"><dt>'+k+'</dt><dd>'+v+'<small>'+h+'</small></dd></div>';
}
function nedenYaz(h){
 var el=D.getElementById('uyNeden');if(!el)return;
 var a=h.a,b=h.b,A=ACI[h.dd];
 var elAd=elIliski(a,b),ntAyni=(a%3===b%3);
 var ortakYon=(YON[a]===YON[b]);
 var rows=
  satir('Burçlar arası uzaklık',
   esc(h.dd+' burç · '+A.de+'° · '+A.ad),
   'Taban puan <b>'+h.m.base+'</b> — üç ölçü de bu tabandan başlıyor. '
   +(A.buyuk?'Beş büyük açıdan biri.':'Beş büyük açının dışında kalan küçük bir açı.'))
 +satir('Element ilişkisi',
   esc(EL[a%4]+' & '+EL[b%4]+' · '+elAd),
   'Aşk '+im(h.elAsk)+' · İletişim '+im(h.elIle)+' · Uzun vade '+im(h.elUzu)
   +'. Hesap “aynı element” ile “Ateş–Hava, Toprak–Su” eşleşmesini aynı kefeye koyuyor; ikisi de uyumlu sayılıyor.')
 +satir('Nitelik ilişkisi',
   esc(NT[a%3]+' & '+NT[b%3]+' · '+(ntAyni?'aynı nitelik':'farklı nitelik')),
   'Puana <b>doğrudan girmiyor</b>. Aynı nitelik zodyakta yalnız kare (90°) ve karşıt (180°) uzaklığında oluşur; '
   +'nitelik çakışması puana bu açı üzerinden yansıyor.')
 +satir('Yönetici gezegenler',
   esc(yonAd(a)+' & '+yonAd(b)),
   (ortakYon?'Ortak geleneksel yönetici: <b>'+esc(YON[a])+'</b>. ':'')
   +'Yönetici gezegen puana girmiyor; okumanın bağlamı olarak veriliyor.');
 var kl=function(ham,son){return ham===son?'':' <i>('+ham+' → 38–97 aralığına sıkıştırıldı: '+son+')</i>';};
 var ap=
  '<tr><th scope="row">Aşk &amp; çekim</th><td>'+h.m.base+' taban '+im(h.acAsk)+' açı '+im(h.elAsk)
  +' element</td><td><b>'+h.ask+'</b>'+kl(h.hamAsk,h.ask)+'</td></tr>'
 +'<tr><th scope="row">İletişim</th><td>'+h.m.base+' taban '+im(h.elIle)+' element '+im(h.acIle)
  +' açı</td><td><b>'+h.ile+'</b>'+kl(h.hamIle,h.ile)+'</td></tr>'
 +'<tr><th scope="row">Uzun vade</th><td>'+h.m.base+' taban '+im(h.acUzu)+' açı '+im(h.elUzu)
  +' element</td><td><b>'+h.uzu+'</b>'+kl(h.hamUzu,h.uzu)+'</td></tr>'
 +'<tr class="uy-ov"><th scope="row">Genel</th><td>('+h.ask+' + '+h.ile+' + '+h.uzu+') ÷ 3</td>'
  +'<td><b>'+h.ov+'</b></td></tr>';
 el.innerHTML='<h3 class="uy-h3">Bu yüzde neden bu?</h3>'
 +'<p class="uy-g">Aşağıdaki dört satır hesabın bütün girdisi. Hiçbir gizli katsayı yok: '
 +'taban puan burçlar arası uzaklıktan, düzeltmeler element ilişkisinden geliyor.</p>'
 +'<dl class="uy-dl">'+rows+'</dl>'
 +'<div class="uy-tw"><table class="uy-tb"><caption>Üç ölçünün açık hesabı</caption><thead>'
 +'<tr><th scope="col">Ölçü</th><th scope="col">Hesap</th><th scope="col">Sonuç</th></tr></thead>'
 +'<tbody>'+ap+'</tbody></table></div>'
 +'<p class="uy-k">Bu hesap yalnız iki burç arasındaki uzaklığı ve element ilişkisini kullanıyor. '
 +'Aynı uzaklıktaki her çift aynı yüzdeyi verir: 144 burç kombinasyonu yedi farklı sonuca düşer. '
 +'Bu yüzden çıkan sayı bir ilişki hükmü değil, zodyak geometrisinin özeti olarak okunabilir.</p>';
}

var GEC=null;
function sonucYaz(a,b){
 if(a==null||b==null)return;
 var h=hesapla(a,b),m=h.m;
 var res=D.getElementById('res');if(res)res.style.display='block';
 var q=function(id){return D.getElementById(id);};
 if(q('pair'))q('pair').textContent=S[a]+' ✦ '+S[b];
 if(q('score'))q('score').innerHTML=h.ov+'<small>%</small>';
 if(q('tag'))q('tag').textContent=TAGS[m.t];
 var set=function(vid,fid,val){var v=q(vid),f=q(fid);if(v)v.textContent='%'+val;
  if(f)W.setTimeout(function(){f.style.width=val+'%';},50);};
 set('v-ask','f-ask',h.ask);set('v-ile','f-ile',h.ile);set('v-uzu','f-uzu',h.uzu);
 if(q('read'))q('read').textContent=READS[m.t](S[a],S[b],a);
 nedenYaz(h);veriYaz(a,b);
 /* canlı gösterimler */
 ST.a=a;ST.b=b;
 var kap=D.getElementById('uyAciKap');
 if(kap&&kap.hidden){kap.hidden=false;}
 try{W.dispatchEvent(new Event('resize'));}catch(e){}
 aciSur(a,b);
 /* oyunlaştırma: hızlı ok tuşu gezintisi her adımı çift saymasın */
 if(GEC)W.clearTimeout(GEC);
 GEC=W.setTimeout(function(){ciftIsle(a,b);},700);
 try{W.fetch&&W.fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({type:'uyum_hesaplandi',meta:S[a]+'-'+S[b]}),keepalive:true})
  ['catch'](function(){});}catch(e){}
}
/* aci-gosterimi bileşenini kendi kaydırıcıları üzerinden sürer */
function aciSur(a,b){
 var el=D.getElementById('uyAci');if(!el)return;
 var r=el.querySelectorAll('input[type=range]');
 if(r.length<2)return;
 var la=a*30+15,lb=b*30+15;
 [[r[0],la],[r[1],lb]].forEach(function(p){
  p[0].value=p[1];
  try{p[0].dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
 });
}

/* ══ 7 · KURULUM ══════════════════════════════════════════════════════════ */
var SEC={a:null,b:null},GA=null,GB=null;
function degisti(hangi,i){
 SEC[hangi]=i;
 var ozet=D.getElementById('uySecOzet');
 if(ozet){
  var t=[];
  if(SEC.a!=null)t.push('Senin burcun '+S[SEC.a]);
  if(SEC.b!=null)t.push('onun burcu '+S[SEC.b]);
  ozet.textContent=t.length?(t.join(', ')+'.'+(SEC.a!=null&&SEC.b!=null?'':' İkinci burcu da seç.'))
   :'İki burç seçildiğinde sonuç açılır.';
 }
 if(SEC.a!=null&&SEC.b!=null)sonucYaz(SEC.a,SEC.b);
 else{ST.a=SEC.a;ST.b=SEC.b;try{W.dispatchEvent(new Event('resize'));}catch(e){}}
}
function paylas(){
 var s=D.getElementById('score'),t;
 if(SEC.a!=null&&SEC.b!=null)
  t=S[SEC.a]+' ve '+S[SEC.b]+' için burç uyumu taraması %'+(s?s.textContent.replace('%',''):'')
   +' çıktı. Sen de dene:';
 else t='Burç uyumu taraması:';
 var url='https://sorbiapp.com/burc-uyumu';
 if(W.navigator&&navigator.share){navigator.share({title:'Burç Uyumu — Sorbi',text:t,url})['catch'](function(){});}
 else if(W.navigator&&navigator.clipboard){navigator.clipboard.writeText(t+' '+url)['catch'](function(){});
  var n=D.getElementById('uyPayNot');if(n)n.textContent='Bağlantı kopyalandı ✦';}
 else{var n2=D.getElementById('uyPayNot');if(n2)n2.textContent=url;}
}
function kur(){
 /* gösterim tipini ekle; modül sayfayı bizden önce taradıysa o düğümü yeniden aç */
 if(W.SorbiGosteri){
  W.SorbiGosteri.ekle('uyum-carki',tipCark);
  [].forEach.call(D.querySelectorAll('[data-sorbi-gosteri="uyum-carki"]'),function(el){
   el.hidden=false;
   try{delete el.dataset.sbgKuruldu;}catch(e){el.removeAttribute('data-sbg-kuruldu');}
  });
  W.SorbiGosteri.kur();
 }
 var ga=D.getElementById('uySecA'),gb=D.getElementById('uySecB');
 if(ga)GA=grupKur(ga,'a',degisti);
 if(gb)GB=grupKur(gb,'b',degisti);
 var pb=D.getElementById('uyPaylas');
 if(pb)pb.addEventListener('click',paylas);
 ILE=ilerlemeDuzelt();nisanBoya();
 D.addEventListener('sorbi:gosteri',function(){nisanBoya();});
 [].forEach.call(D.querySelectorAll('[data-sorbi-sinav="uyum-acilar"] button'),function(b){
  b.addEventListener('click',function(){W.setTimeout(nisanBoya,0);});
 });
 veriCek(function(){if(SEC.a!=null&&SEC.b!=null)veriYaz(SEC.a,SEC.b);});
 W.addEventListener('load',function(){try{W.dispatchEvent(new Event('resize'));}catch(e){}});
}
W.SorbiUyum={burclar:function(){return S.map(function(s,i){
  return {i:i,ad:s,glif:SG[i],slug:SL[i],el:EL[i%4],nit:NT[i%3],yon:YON[i],modern:YMO[i]||'',tarih:TAR[i]};});},
 aci:function(a,b){var d=((b-a)%12+12)%12;return ACI[mn(d,12-d)];},
 hesap:hesapla};
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',kur);else kur();
})();
