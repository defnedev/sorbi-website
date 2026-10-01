/*! sorbi-kilit.js — Eğitim üyeliğine ayrılmış etkileşimli bölümler.
 * Yazılı içerik herkese açık kalır (arama motoru ve okur için); yalnız etkileşimli gösterim,
 * sınav ve soru haritası aracı kilitlenir. Hak "egitim" planında. sorbi-gosteri/oyun'dan ÖNCE yüklenir. */
(function(){
'use strict';
var D=document,W=window;
var SEC='[data-sorbi-gosteri],[data-sorbi-sinav]';
var CSS='.skl{position:relative;border:1px dashed rgba(var(--ink-rgb),.28);border-radius:16px;padding:1.3rem 1.2rem;margin:1.2rem 0;background:linear-gradient(180deg,rgba(var(--ink-rgb),.05),rgba(var(--ink-rgb),.01));font-family:Inter,system-ui,sans-serif}'
+'.skl .skl-e{font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:var(--acc)}'
+'.skl h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.08rem;margin:.35rem 0 .35rem;color:var(--ink)}'
+'.skl p{font-size:.86rem;line-height:1.6;color:var(--mut);margin:0 0 .8rem}'
+'.skl button{font:600 .86rem Inter,system-ui,sans-serif;min-height:44px;padding:0 1.1rem;border-radius:99px;border:1px solid rgba(var(--ink-rgb),.3);background:var(--ink);color:var(--bg);cursor:pointer}'
+'.skl .skl-d{font-size:.8rem;color:var(--mut);margin-top:.5rem;min-height:1.1em}';
var ADLAR={'zodyak-carki':'Canlı zodyak çarkı','element-nitelik':'Element × nitelik ızgarası','burc-dagilimi':'Sayım dağılımı grafiği'};
var METIN={'zodyak-carki':'Çarkı canlı çevirir; burcun on iki burç içindeki yerini, karşısındaki ve aynı elementteki burçlarla birlikte gösterir.','element-nitelik':'Dört element ile üç niteliğin kesişimini canlı kurar; her burcun neden o kutuda durduğunu adım adım gösterir.','burc-dagilimi':'210.384 haritalık sayımda burcun Güneş, Ay ve yükselen olarak dağılımını çizer.'};

function css(){ if(D.getElementById('sklCss')) return; var s=D.createElement('style'); s.id='sklCss'; s.textContent=CSS; D.head.appendChild(s); }
function kart(baslik,metin,kaynak){
  var k=D.createElement('div'); k.className='skl';
  k.innerHTML='<div class="skl-e">Eğitim üyeliği · yakında</div><h3>'+baslik+'</h3><p>'+metin+'</p><button type="button">Açıldığında haber ver</button><div class="skl-d" aria-live="polite"></div>';
  k.querySelector('button').addEventListener('click',function(){
    var d=k.querySelector('.skl-d'), b=this;
    if(!W.SorbiHesap){ d.textContent='Bir saniye…'; return; }
    W.SorbiHesap.olay('kilit_tik',kaynak);
    W.SorbiHesap.bekleme('egitim',kaynak).then(function(j){
      if(j&&j.ok){ d.textContent='Tamam — Eğitim açıldığında ilk sana haber vereceğiz.'; b.disabled=true; b.textContent='Listedesin ✓'; }
    });
  });
  return k;
}

var sayfa=location.pathname.replace(/\.html$/,'').replace(/\/$/,'');
var soruMu=sayfa==='/soru-sor';
var kilitliler=[];

function kilitle(){
  css();
  var L=D.querySelectorAll(SEC);
  for(var i=0;i<L.length;i++){
    var el=L[i], g=el.getAttribute('data-sorbi-gosteri'), s=el.getAttribute('data-sorbi-sinav');
    if(g){ el.setAttribute('data-kilitli-gosteri',g); el.removeAttribute('data-sorbi-gosteri'); }
    if(s){ el.setAttribute('data-kilitli-sinav',s); el.removeAttribute('data-sorbi-sinav'); }
    el.hidden=true;
    var k=g?kart(ADLAR[g]||'Etkileşimli gösterim',(METIN[g]||'Gökyüzünü canlı oynatan etkileşimli bir gösterim.')+' Yazılı anlatım herkese açık; etkileşimli ders Eğitim üyeliğinde.','gosteri:'+g)
            :kart('Burcu ne kadar tanıdın?','Sorular ve gerekçeli cevaplarla kendini sına; ilerlemen on iki burç boyunca birikir. Bu sınav Eğitim üyeliğinde.','sinav:'+s);
    el.parentNode.insertBefore(k,el);
    kilitliler.push({el:el,kart:k});
  }
}
function ac(){
  kilitliler.forEach(function(x){
    var el=x.el, g=el.getAttribute('data-kilitli-gosteri'), s=el.getAttribute('data-kilitli-sinav');
    if(g){ el.setAttribute('data-sorbi-gosteri',g); el.removeAttribute('data-kilitli-gosteri'); }
    if(s){ el.setAttribute('data-sorbi-sinav',s); el.removeAttribute('data-kilitli-sinav'); }
    el.hidden=false; if(x.kart.parentNode) x.kart.parentNode.removeChild(x.kart);
    try{ if(g&&W.SorbiGosteri) W.SorbiGosteri.kur(el.parentNode); if(s&&W.SorbiOyun) W.SorbiOyun.kur(el.parentNode); }catch(e){}
  });
  kilitliler=[];
}

/* Soru haritası: sayfa ve anlatım açık; "Anın haritasını çiz" Eğitim üyeliğinde. */
var soruAcik=false;
function soruKilidi(){
  D.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target.closest('#go'):null;
    if(!t||soruAcik) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var yer=D.getElementById('chartbox'); if(!yer) return;
    if(yer.querySelector('.skl')) return;
    css(); yer.innerHTML='';
    var gz=D.createElement('div'); gz.setAttribute('data-gorusme','soru');
    yer.appendChild(kart('Soru haritası Eğitim üyeliğinde','Sorunun anına göre çizilen harita, hükümdarlar ve Lilly kurallarıyla adım adım okuma Eğitim üyeliğiyle açılıyor. Nasıl çalıştığı ve örnek okuma aşağıda herkese açık.','soru-sor'));
    yer.appendChild(gz); if(W.SorbiGorusme&&W.SorbiGorusme.hazir) W.SorbiGorusme.ciz(gz); else gz.remove();
    if(W.SorbiHesap) W.SorbiHesap.olay('kilit_gor','soru-sor');
  },true);
}

if(soruMu) soruKilidi();
else if(D.readyState==='loading') D.addEventListener('DOMContentLoaded',kilitle,{once:true}); else kilitle();
/* kilitle(), sorbi-gosteri/oyun'un DOMContentLoaded dinleyicisinden önce kaydolur (bu dosya önce yüklenir). */

function kontrol(){
  if(!W.SorbiHesap) return;
  W.SorbiHesap.ben().then(function(u){ if(u&&W.SorbiHesap.hak('egitim')){ soruAcik=true; ac(); } });
}
if(D.readyState==='loading') D.addEventListener('DOMContentLoaded',function(){ setTimeout(kontrol,0); }); else setTimeout(kontrol,0);
D.addEventListener('sorbi:hesap',function(e){ if(e.detail&&e.detail.kullanici&&W.SorbiHesap.hak('egitim')){ soruAcik=true; ac(); } });
})();
