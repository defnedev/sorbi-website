/*! sorbi-cark.js — çark etkileşim katmanı (sorbi-chart.js üstüne)
 *  SorbiCark.bagla(carkEl, panelEl, {slug:fn})
 *  Çark SVG'si opt.interactive:true ile üretilmiş olmalı.
 *  Bağımlılık yok. Olay delegasyonu: çark yeniden çizilince yeniden bağlamak gerekmez.
 */
(function(){
"use strict";

var SN=['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
var SG=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'];
var EL=[0,1,2,3,0,1,2,3,0,1,2,3]; /* ateş,toprak,hava,su */
var ELC=['#D36363','#3FB89A','#C9A962','#8A9DB5'];

var P={
 sun :['Güneş','kimlik, yönelim ve neyle görünür olduğun'],
 moon:['Ay','duygusal ihtiyaç, alışkanlık ve güvenli hissettiğin zemin'],
 mer :['Merkür','düşünme, öğrenme ve anlatma biçimin'],
 ven :['Venüs','değer verdiğin şeyler, beğeni ve ilişki kurma üslubun'],
 mar :['Mars','harekete geçiş, istek ve kendini savunma biçimin'],
 jup :['Jüpiter','genişleme, anlam arayışı ve fırsat okuman'],
 sat :['Satürn','sınır, sorumluluk ve olgunlaşma alanın'],
 ura :['Uranüs','değişim isteği ve alışılmışın dışına çıkma eğilimin'],
 nep :['Neptün','hayal gücü, sezgi ve sınırların bulanıklaştığı alan'],
 plu :['Plüton','derin dönüşüm ve güçle kurduğun ilişki'],
 chi :['Chiron','hassas nokta ve onarım kapasitesi'],
 lil :['Lilith','bastırılmış olanın ve pazarlıksız yanın'],
 nod :['Kuzey Ay Düğümü','gelişmeye açık, tanıdık olmayan yön'],
 sno :['Güney Ay Düğümü','tanıdık, kolay gelen ve geride bırakılabilen yön'],
 pof :['Şans Noktası','akışın kolaylaştığı nokta']
};
var S=[
 'doğrudan, hızlı başlayan bir üslupla',
 'sabırlı, somut ve kalıcılık arayan bir üslupla',
 'meraklı, çok yönlü ve iletişim odaklı bir üslupla',
 'korumacı, hatırlayan ve duyguyla süzen bir üslupla',
 'görünür olmayı seven, cömert ve ifade edici bir üslupla',
 'ayrıştıran, düzelten ve işe yarar olanı arayan bir üslupla',
 'dengeleyen, karşısındakini hesaba katan bir üslupla',
 'derinleşen, kolay teslim olmayan bir üslupla',
 'anlam arayan, ufku geniş tutan bir üslupla',
 'yapı kuran, uzun vadeyi gözeten bir üslupla',
 'kendi yolunu çizen, topluluğu düşünen bir üslupla',
 'geçirgen, sezgisel ve sınırları yumuşak bir üslupla'
];
var H=['','kendini ortaya koyuş ve görünüş','kaynaklar, değerler ve güvence','yakın çevre, öğrenme ve gündelik iletişim',
 'kök, aile ve içeriye ait olan','yaratım, oyun ve kendini gösterme','gündelik düzen, iş akışı ve bakım',
 'birebir ilişkiler ve ortaklık','paylaşılan kaynaklar ve dönüşüm','uzak, yabancı ve anlam arayışı',
 'görünür hedefler ve dışarıdaki rol','çevre, gelecek tasarısı ve topluluk','geri çekilme, görünmeyen ve bırakılan'];

function norm(x){return ((x%360)+360)%360;}
function dms(l){l=norm(l);var s=Math.floor(l/30),g=l-s*30,d=Math.floor(g),m=Math.round((g-d)*60);
 if(m===60){m=0;d++;} return {s:s,d:d,m:m};}
function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){
 return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

function okuma(k,lon,house,rx,aciSayisi){
  var p=P[k]||[k,'bu yerleşim'], x=dms(lon);
  var t='<strong>'+esc(p[0])+'</strong>, '+esc(SN[x.s])+' burcunda: '+esc(p[1])+' '+esc(S[x.s])+' okunabilir.';
  if(house) t+=' '+house+'. evde olması, bu niteliğin en çok '+esc(H[house])+' alanında belirginleşme eğiliminde olduğunu gösterir.';
  if(rx) t+=' Geri hareketli oluşu, konunun dışa dönük ifadesinden çok içeride gözden geçirilmesine işaret edebilir.';
  if(aciSayisi) t+=' Haritanda '+aciSayisi+' majör açı kuruyor — çarkta vurgulanan çizgiler bunlar.';
  return t;
}

function bagla(carkSec, panelSec, opt){
  opt=opt||{};
  var cark=typeof carkSec==='string'?document.querySelector(carkSec):carkSec;
  var panel=typeof panelSec==='string'?document.querySelector(panelSec):panelSec;
  if(!cark||!panel) return;
  if(cark.__sbBagli) return; cark.__sbBagli=1;

  var azHareket=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sec=null;

  function grup(t){ return t&&t.closest?t.closest('g.sb-pl'):null; }

  function temizle(){
    var gs=cark.querySelectorAll('g.sb-pl'); for(var i=0;i<gs.length;i++) gs[i].classList.remove('sb-sec');
    var as=cark.querySelectorAll('line.sb-asp');
    for(var j=0;j<as.length;j++){ var a=as[j];
      a.classList.remove('sb-vurgu');
      if(a.dataset.w) a.setAttribute('stroke-width',a.dataset.w);
      if(a.dataset.o) a.setAttribute('opacity',a.dataset.o);
    }
  }

  function sec_et(g){
    if(!g) return;
    var k=g.dataset.k;
    temizle();
    g.classList.add('sb-sec');
    sec=k;
    var n=0, as=cark.querySelectorAll('line.sb-asp');
    for(var i=0;i<as.length;i++){ var a=as[i];
      if(a.dataset.a===k||a.dataset.b===k){
        a.classList.add('sb-vurgu');
        a.setAttribute('stroke-width', Math.max(1.4, parseFloat(a.dataset.w||1)*1.6).toFixed(2));
        a.setAttribute('opacity','0.9');
        n++;
      }
    }
    yaz(g,n);
  }

  function yaz(g,aciSayisi){
    var k=g.dataset.k, lon=parseFloat(g.dataset.lon);
    var house=g.dataset.house?parseInt(g.dataset.house,10):0, rx=g.dataset.rx==='1';
    var x=dms(lon), p=P[k]||[k,''];
    var slug=opt.slug&&house?opt.slug(k,x.s,house):null;
    var h='<div class="sbp-in">'+
      '<h3 class="sbp-bas">'+esc(p[0])+' · <span style="color:'+ELC[EL[x.s]]+'">'+esc(SN[x.s])+'</span> '+
        x.d+'°'+(x.m<10?'0':'')+x.m+'′'+(rx?' <span class="sbp-rx">R</span>':'')+'</h3>'+
      (house?'<div class="sbp-meta">'+house+'. ev · '+esc(SG[x.s])+'</div>':'')+
      '<p class="sbp-govde">'+okuma(k,lon,house,rx,aciSayisi)+'</p>'+
      (slug?'<a class="sbp-link" href="'+esc(slug)+'">Bu yerleşimi ayrıntılı oku →</a>':'')+
      '<p class="sbp-not">Astroloji içerikleri kişisel farkındalık amaçlıdır; kesin sonuç vaadi değildir. Doğum verin cihazında kalır, sunucuya gönderilmez.</p>'+
      '</div>';
    if(azHareket){ panel.innerHTML=h; return; }
    panel.style.opacity='0';
    setTimeout(function(){ panel.innerHTML=h; panel.style.opacity='1'; }, 120);
  }

  cark.addEventListener('click', function(e){ var g=grup(e.target); if(g){ e.preventDefault(); sec_et(g); } });
  cark.addEventListener('keydown', function(e){
    if(e.key!=='Enter'&&e.key!==' '&&e.key!=='Spacebar') return;
    var g=grup(e.target); if(g){ e.preventDefault(); sec_et(g); }
  });
  panel.__sbTemizle=function(){ sec=null; temizle(); };
}

window.SorbiCark={ bagla:bagla, okuma:okuma };
})();
