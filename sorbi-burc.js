/*! sorbi-burc.js — Burçlar bölümünün etkileşim katmanı. Sunucusuz, dış bağımlılık yok.
 * 1) SorbiGosteri'ye "burc-dagilimi" tipini ekler (Güneş/Ay/yükselen burç dağılımı).
 * 2) Hub'da burç kartlarını ve okundu işaretlerini yönetir.
 * 3) Burç sayfalarında "okudum" işaretlemesini SorbiOyun'a yazar; hub ilerlemesine sayılır.
 * 4) Sayfadaki [data-sayim] yuvalarını doldurur; örneklem rakamı sayfaya elle yazılmaz.
 * Veri: SorbiSayim servisi (sorbi-sayim.js). Sayfa hangi dosyada hangi alan var bilmez;
 * örneklem büyüdüğünde ne bu dosya ne de sayfalar değişir — yalnız künye başka basar.
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
/* ── nadirlik yazımı: tek kural (sorbi-nadirlik-gorsel.js) — "12'de 1", "1.300'de 1".
   Yüzde ana metinden kalkar; sayı servisten gelir, burada yalnız biçimlenir. ── */
function G(){return W.SorbiNadirlikGorsel||null;}
function kacta(v,t){var n=v>0?M.round(t/v):t,g=G();if(g)return g.yaz(n);
 var y=n<1000?n:M.round(n/100)*100;return bin(y)+"'de 1";}
function sapma(v,t){var g=G(),n=v>0?M.round(t/v):t;if(g)return g.etiket(n,12);
 var sp=(12/n)-1;return {kod:M.abs(sp)<.1?'siradan':(sp<0?'seyrek':'sik'),ad:M.abs(sp)<.1?'':(sp<0?'biraz daha seyrek':'biraz daha sık'),sap:sp};}
/* et.ad boşsa (sapma %10 altı) yargı sözü yazılmaz — bkz nadirlik-gorsel.js dürüstlük kuralı */
function etYaz(e,onek,sonek){ onek=onek||'';sonek=sonek||''; return e&&e.ad?onek+'<b>'+e.ad+'</b>'+sonek:''; }
/* taban-merkezli sapma: log2(pay/taban) → -1..1 (yarısı..iki katı) */
function sap2(v,t){var r=v>0?M.log(v/(t/12))/M.LN2:-1;return M.max(-1,M.min(1,r));}

/* ── Türkçe belirtme eki (-ı/-i/-u/-ü, sesliden sonra kaynaştırma -y-) ──
   Özel ad olduğu için kesme işaretiyle yazılır ve ünsüz yumuşaması UYGULANMAZ:
   "Koç’u" (Koc’u değil), "Oğlak’ı". Son SESLİ harf kalınlık/yuvarlaklık
   uyumunu belirler; kelime sesliyle bitiyorsa araya y girer. */
var SESLI='aeıioöuüAEIİOÖUÜ';
var UYUM={a:'ı','ı':'ı',o:'u',u:'u',e:'i','i':'i','ö':'ü','ü':'ü'};
function kucult(h){
 if(h==='I')return 'ı'; if(h==='İ')return 'i';
 return h.toLocaleLowerCase('tr');
}
/* Bulunma hali (-da/-de/-ta/-te), özel ad: "Koç’ta", "Boğa’da", "İkizler’de".
   Sert ünsüzden sonra t, sonra kalın/ince uyumu. */
var SERT='fstkçşhp';
function ekBulunma(ad){
 if(!ad)return '';
 var son=null,i,h;
 for(i=ad.length-1;i>=0;i--){h=ad.charAt(i);if(SESLI.indexOf(h)>=0){son=kucult(h);break;}}
 var ince=('eiöü'.indexOf(son)>=0);
 var d=(SERT.indexOf(kucult(ad.charAt(ad.length-1)))>=0)?'t':'d';
 return ad+'’'+d+(ince?'e':'a');
}
function ekBelirtme(ad){
 if(!ad)return '';
 var son=null,i,h;
 for(i=ad.length-1;i>=0;i--){h=ad.charAt(i);if(SESLI.indexOf(h)>=0){son=kucult(h);break;}}
 var e=UYUM[son]||'ı';
 var sonHarf=ad.charAt(ad.length-1);
 return ad+'’'+(SESLI.indexOf(sonHarf)>=0?'y':'')+e;
}

/* ── sayım servisi: üç dağılım tek seferde ────────────────────────────
   Servis çağrıları tembeldir; ikinci çağrıda ağ isteği yoktur. */
var NOKID={sun:'burc.sun',moon:'burc.moon',asc:'asc'};
var dagUcus=null;
function dagilimlar(){
 if(dagUcus)return dagUcus;
 if(!W.SorbiSayim)return (dagUcus=Promise.reject(new Error('SorbiSayim yok')));
 dagUcus=Promise.all([W.SorbiSayim.dagilim(NOKID.sun),
                      W.SorbiSayim.dagilim(NOKID.moon),
                      W.SorbiSayim.dagilim(NOKID.asc)]).then(function(r){
  function diz(D){var a=new Array(12);for(var i=0;i<12;i++)a[i]=0;
   D.satirlar.forEach(function(s){var i=+s.anahtar;if(i>=0&&i<12)a[i]=s.sayi;});return a;}
  return {k:r[0].kunye,t:r[0].kunye.n,
          b:{sun:diz(r[0]),moon:diz(r[1]),asc:diz(r[2])}};
 });
 return dagUcus;
}

/* ── örneklemde burç dağılımı (veri: SorbiSayim) ── */
function tipDagilim(d){
 var b0=S.indexOf(d.burc);
 return{
 etiket:'Örneklemde burç dağılımı: Güneş, Ay ve yükselen için on iki burç.',
 veriGetir:function(){return dagilimlar();},
 en:1000,boy:function(G){return G<520?1.02:.52;},adet:3,hiz:2200,kare:0,durak:0,
 kay:[{ad:'k',min:0,max:2,etiket:'Nokta seç: Güneş burcu, Ay burcu, yükselen burç'}],
 ciz:function(c){
  var o=c.o,G_=c.G,Y=c.Y,k=c.k%3,V=c.veri||{},B=V.b||{},T=+V.t||0,A=B[NOK[k][0]];
  o.fillStyle=C.bg;o.fillRect(0,0,G_,Y);
  function yz(m,x,y,f,r,h){o.fillStyle=r;o.font=f+' ui-monospace,Menlo,monospace';
   o.textAlign=h||'left';o.textBaseline='middle';o.fillText(m,x,y);}
  if(!A||!A.length||!T){yz('Veri yüklenemedi',G_/2,Y/2,'12px',C.dim,'center');return;}
  /* Taban-merkezli sapma şeridi: ortadaki çizgi "12'de 1" (on iki burca eşit dağılım),
     çubuk ondan sola (seyrek) ya da sağa (sık) sapar. Ölçek logaritmik: sol uç yarısı,
     sağ uç iki katı — nadirlik.html'deki satır şeridiyle aynı dil. Sıfır tabanlı çubuk kaldırıldı. */
  var az=G_<430,LW=az?26:100,RW=az?60:150,ust=az?30:34,alt=Y-(az?30:36);
  var x0=LW,x1=G_-RW,gen=M.max(30,x1-x0),xm=x0+gen/2,yar=gen/2,h=(alt-ust)/12,i,v;
  yz(az?NOK[k][1]:NOK[k][1]+' · '+bin(T)+' '+((V.k&&V.k.birim)||'kayıt')+' içinde',0,ust/2,az?'11px':'13px',C.ink);
  if(!az)yz('← seyrek · sık →',G_-RW,ust/2,'11px',C.dim,'right');
  /* taban çizgisi + etiketi */
  o.fillStyle=tkr('--ink',.08);o.fillRect(x0,ust,gen,alt-ust);
  o.strokeStyle=tkr('--ink',.6);o.lineWidth=2;
  o.beginPath();o.moveTo(xm,ust-4);o.lineTo(xm,alt+4);o.stroke();
  for(i=0;i<12;i++){
   v=A[i];var y=ust+h*i,ym=y+h/2,se=i===b0,d=sap2(v,T),e=sapma(v,T),bw=M.max(2,M.abs(d)*yar),bx=d<0?xm-bw:xm;
   if(se){o.fillStyle=tkr('--ink',.07);o.fillRect(0,y+h*.06,G_,h*.88);}
   o.globalAlpha=se?.95:(e.kod==='siradan'?.35:.6);o.fillStyle=se?C.gbr:(e.kod==='siradan'?C.ink:C.gld);
   o.beginPath();o.rect(bx,y+h*.2,bw,h*.6);o.fill();o.globalAlpha=1;
   yz(SG[i],az?0:2,ym,az?'11px':'12px',se?C.gbr:C.dim);
   if(!az)yz(S[i],22,ym,'11px',se?C.ink:C.mut);
   yz(az?kacta(v,T):bin(v)+'  '+kacta(v,T),G_,ym,az?'10px':'11px',se?C.gbr:C.mut,'right');
  }
  /* taban etiketi çizginin hemen altında, açıklama bir satır aşağıda */
  yz('herkeste '+kacta(T/12,T),xm,alt+(az?12:11),az?'9px':'11px',C.ink,'center');
  if(az)yz('← seyrek · sık →  ·  %10 altı sapma sıradan',x0,alt+24,'9px',C.dim);
  else yz('ortadaki çizgi: on iki burca eşit dağılım · %10 altı sapma sıradan sayılır',x0,alt+27,'10px',C.dim);
 },
 metin:function(c){
  var k=c.k%3,V=c.veri||{},B=V.b||{},T=+V.t||0,A=B[NOK[k][0]];
  var BR=(V.k&&V.k.birim)||'kayıt';
  if(!A||!A.length||!T)return{o:'Veri yüklenemedi',z:''};
  var en=0,az=0,i;
  for(i=1;i<12;i++){if(A[i]>A[en])en=i;if(A[i]<A[az])az=i;}
  var kat=vir(A[en]/A[az],2),me=b0>=0?A[b0]:0,fk=b0>=0?me-T/12:0,e=b0>=0?sapma(me,T):null;
  return{o:NOK[k][1]+' · en sık <b>'+S[en]+'</b> '+kacta(A[en],T)+' · en seyrek <b>'+S[az]+'</b> '+kacta(A[az],T),
  z:'<b>'+bin(T)+' '+BR+'</b> içinde '+NOK[k][2]+' dağılımı: herkeste '+kacta(T/12,T)+' beklenir; en sık <i>'+S[en]+'</i> ('
   +bin(A[en])+' '+BR+', '+kacta(A[en],T)+'), en seyrek <i>'+S[az]+'</i> ('+bin(A[az])+' '+BR+', '+kacta(A[az],T)
   +'). En sık ile en seyrek arasında <b>'+kat+' kat</b> fark var.'
   +(b0>=0?' '+S[b0]+' burcunda '+bin(me)+' '+BR+' — herkeste '+kacta(T/12,T)+' · burada '+kacta(me,T)+etYaz(e,', ')+' (eşit dağılımın '
     +(fk>=0?bin(M.abs(fk))+' '+BR+' üstünde':bin(M.abs(fk))+' '+BR+' altında')+').':'')
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

/* ── hub: yalnız 12 kartlık dizin ── */
function hub(){
 var kok=D.getElementById('bkKesif');if(!kok)return;
 var izg=D.getElementById('bkIzgara');
 isaretleriBoya(izg?[].slice.call(izg.children):[]);
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
   b.textContent=ekBelirtme(ad)+' okudum olarak işaretle';}
 }
 b.addEventListener('click',function(){
  W.SorbiOyun.tamamla(id,12);W.SorbiOyun.isaretle('okundu:'+slug);boya();
 });
 boya();
}

/* ── [data-sayim] yuvaları: örneklem rakamı sayfaya elle yazılmaz ──
   Her yuva servisin künyesinden ya da dağılım satırlarından doldurulur. */
function yaz(ad,html,kok){
 var L=(kok||D).querySelectorAll('[data-sayim="'+ad+'"]');
 for(var i=0;i<L.length;i++)L[i].innerHTML=html;
 return L.length;
}
function sira(A,i){var n=1,j;for(j=0;j<12;j++)if(A[j]>A[i])n++;return n;}
function uclar(A){var en=0,az=0,i;for(i=1;i<12;i++){if(A[i]>A[en])en=i;if(A[i]<A[az])az=i;}
 return{en:en,az:az,kat:A[az]?A[en]/A[az]:0};}
function metinDoldur(){
 if(!D.querySelector('[data-sayim]'))return;
 dagilimlar().then(function(V){
  var K=V.k,T=V.t,B=V.b,BR=K.birim,N=K.nMetin;
  yaz('orneklem',N+' '+BR);
  yaz('kunye',K.yil+' aralığından örneklenmiş <b>'+N+' '+BR+'</b>, '+K.yer.split('—')[0].trim()+' için hesaplandı');
  yaz('yontem',K.yontem);
  var g=uclar(B.sun);
  var kA=kacta(B.sun[g.az],T),kE=kacta(B.sun[g.en],T);
  yaz('burc-aralik','on iki burcun payı birbirine çok yakın — '+(kA===kE?'en seyreği de en sığı da '+kA:kA+' ile '+kE+' arasında')
   +', yani herkes için beklenenin ('+kacta(T/12,T)+') hemen yanında.');
  [].forEach.call(D.querySelectorAll('[data-sayim="burc-ozet"],[data-sayim="burc-karsilastir"]'),function(el){
   var i=S.indexOf(el.getAttribute('data-burc'));if(i<0)return;
   var esit=T/12,fk=B.sun[i]-esit;
   if(el.getAttribute('data-sayim')==='burc-ozet'){
    var e=sapma(B.sun[i],T);
    el.innerHTML='Güneş’i '+S[i]+' burcunda olan <b>'+bin(B.sun[i])+' '+BR+'</b> var: '
     +'herkeste <b>'+kacta(esit,T)+'</b> · '+ekBulunma(S[i])+' <b>'+kacta(B.sun[i],T)+'</b>'+etYaz(e,' — ','.')+' '
     +'Eşit dağılımda her burca '+bin(esit)+' '+BR+' düşerdi; '+S[i]+' bu çizginin <b>'+bin(M.abs(fk))+' '+BR+(fk>=0?' üstünde':' altında')
     +'</b> kalıyor ve on iki burç arasında sıklık bakımından <b>'+sira(B.sun,i)+'. sırada</b>.';
   }else{
    var a=uclar(B.moon),y=uclar(B.asc);
    el.innerHTML='Aynı burç Ay’da '+bin(B.moon[i])+' '+BR+' ('+kacta(B.moon[i],T)+', '+sira(B.moon,i)
     +'. sıra), yükselende '+bin(B.asc[i])+' '+BR+' ('+kacta(B.asc[i],T)+(sapma(B.asc[i],T).ad?', '+sapma(B.asc[i],T).ad:'')+', '+sira(B.asc,i)+'. sıra). '
     +'Güneş ve Ay dağılımları neredeyse düz: Güneş’te en sık <b>'+S[g.en]+'</b> ile en seyrek <b>'+S[g.az]
     +'</b> arasında yalnızca <b>'+vir(g.kat,2)+' kat</b>, Ay’da '+vir(a.kat,2)+' kat fark var. '
     +'Yükselende fark <b>'+vir(y.kat,2)+' kata</b> çıkıyor — çünkü burçlar ufuktan eşit sürede doğmaz, '
     +'yükselenin dağılımı enleme bağlı olarak eğrilir.';
   }
  });
 },function(){yaz('orneklem','sayım yüklenemedi');});
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
 hub();isaretDugmesi();ilerlemeDuzelt();metinDoldur();
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',kur);else kur();
})();
