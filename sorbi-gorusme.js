/*! sorbi-gorusme.js — Defne ile birebir görüşme: WhatsApp'a hazır mesajla yönlendirme.
 * Yerleşim: <div data-gorusme="harita|soru|takvim|sinastri|bugun|gunluk|nadirlik"></div>
 * Sayfa özeti: window.__sorbiOzet = {gunes, ay, yukselen, tarih, saat, yer, ek} + 'sorbi:ozet' olayı.
 * Numara boşsa (henüz yok) canlıda hiçbir şey görünmez; önizlemede sahte numarayla görünür. */
(function(){
'use strict';
var NUMARA=''; /* ülke koduyla, boşluksuz: 905xxxxxxxxx */
var W=window,D=document;
var onizleme=/(^|\.)onizleme\.sorbi\.pages\.dev$|^localhost(:\d+)?$/.test(location.host);
var NO=NUMARA||(onizleme?'900000000000':'');
if(!NO){ W.SorbiGorusme={hazir:false,kur:function(){}}; return; }

var METIN={
 harita:{tip:'kart',baslik:'Haritanı birlikte okuyalım mı?',destek:'Bu özet sitenin görebildiği kadar. Gerisini sana sorarak, birebir bakarım.',buton:'Görüşme başlat'},
 soru:{tip:'kart',baslik:'Tek bir sorun mu var?',destek:'Sorunun anına bakar, ne gördüğümü düz söylerim. Tek soru, tek cevap.',buton:'Sorunu yaz'},
 takvim:{tip:'kart',baslik:'Bu 13 ayı birlikte planlayalım mı?',destek:'Takvim tarihleri verir; hangisinin senin için önemli olduğunu konuşarak buluruz.',buton:'Görüşme başlat'},
 sinastri:{tip:'kart',baslik:'Bu iki haritayı birlikte okuyalım mı?',destek:'Açılar listesi başlangıç; ilişkinin nerede zorlandığını konuşarak görürüz.',buton:'Görüşme başlat'},
 nadirlik:{tip:'kart',baslik:'Nadir yerleşimlerin ne anlatıyor?',destek:'Sayı merak uyandırır; senin hayatında nasıl çalıştığını birlikte bakarak görürüz.',buton:'Görüşme başlat'},
 bugun:{tip:'satir',once:'Bugün aklına takılan bir şey mi var?',buton:'Yaz, bakalım →'},
 gunluk:{tip:'satir',once:'Burç yorumu herkese; kendi haritanla konuşmak istersen',buton:'bilgi al →'}
};

function ozet(){
  var o=W.__sorbiOzet;
  if(o) return o;
  try{ var b=JSON.parse(localStorage.getItem('sorbi_birth')||'null'); if(b&&b.date) return {tarih:b.date,saat:b.time||null,yer:b.place||''}; }catch(e){}
  return null;
}
function trTarih(t){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t||''); return m?(+m[3])+'.'+(+m[2])+'.'+m[1]:(t||''); }
function haritaSatiri(o){
  if(!o) return '';
  var p=[];
  if(o.gunes) p.push('Güneş '+o.gunes); if(o.ay) p.push('Ay '+o.ay);
  if(o.yukselen) p.push('Yükselen '+o.yukselen);
  var d=[]; if(o.tarih) d.push(trTarih(o.tarih)); d.push(o.saat?o.saat:'saat bilinmiyor'); if(o.yer) d.push(String(o.yer).split(',')[0]);
  return (p.length?p.join(' · ')+' ':'')+(o.tarih?'('+d.join(' ')+')':'');
}
function mesaj(baglam){
  var o=ozet(), h=haritaSatiri(o), bas='Merhaba Defne, Sorbi\'den yazıyorum. ';
  if(baglam==='harita') return bas+(h?'Haritam: '+h+'. ':'')+'Haritamı birlikte okumak için bilgi almak istiyorum.';
  var qq=D.getElementById('q'); if(baglam==='soru'&&qq&&qq.value.trim()) o=Object.assign({},o||{},{ek:qq.value.trim()});
  if(baglam==='soru') return bas+'Tek bir sorum var: '+(o&&o.ek?o.ek:'______')+(o&&(o.gunes||o.ay)?' ('+[o.gunes?'Güneş '+o.gunes:'',o.ay?'Ay '+o.ay:''].filter(Boolean).join(' · ')+')':'');
  if(baglam==='takvim') return bas+'13 aylık takvimime birlikte bakmak istiyorum.'+(h?' Haritam: '+h+'.':'');
  if(baglam==='sinastri') return bas+'İki haritayı birlikte okumak istiyorum'+(o&&o.ek?': '+o.ek:'')+'.';
  var gk=(o&&(o.gunes||o.ay))?'Haritam: '+[o.gunes?'Güneş '+o.gunes:'',o.ay?'Ay '+o.ay:'',o.yukselen?'Yükselen '+o.yukselen:''].filter(Boolean).join(' · ')+'. ':'';
  if(baglam==='nadirlik') return bas+gk+'Nadir yerleşimlerim hakkında bilgi almak istiyorum.';
  return bas+gk+'Görüşme hakkında bilgi almak istiyorum.';
}
function link(baglam){ return 'https://wa.me/'+NO+'?text='+encodeURIComponent(mesaj(baglam)); }
function olay(tur,meta){
  try{ var g=JSON.stringify({type:tur,meta:meta}); if(navigator.sendBeacon) navigator.sendBeacon('/api/olay',new Blob([g],{type:'application/json'})); }catch(e){}
}

var CSS='.sgr{border:1px solid rgba(var(--ink-rgb),.18);border-radius:16px;padding:1.15rem 1.2rem;margin:2rem 0 1.4rem;background:linear-gradient(180deg,rgba(var(--acc-rgb),.08),rgba(var(--acc-rgb),.02));font-family:Inter,system-ui,sans-serif}'
+'.sgr h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.12rem;margin:0 0 .3rem;color:var(--ink)}'
+'.sgr p{font-size:.88rem;line-height:1.6;color:var(--mut);margin:0 0 .8rem}'
+'.sgr .sgr-s{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}'
+'.sgr a.sgr-b{display:inline-flex;align-items:center;gap:.45rem;font:600 .92rem Inter,system-ui,sans-serif;min-height:46px;padding:0 1.25rem;border-radius:99px;background:var(--ink);color:var(--bg);text-decoration:none}'
+'.sgr button.sgr-n{font:500 .82rem Inter,system-ui,sans-serif;background:none;border:0;color:var(--mut);text-decoration:underline;cursor:pointer;min-height:44px;padding:0 .3rem}'
+'.sgr ol{margin:.6rem 0 0;padding-left:1.2rem;font-size:.84rem;color:var(--mut);line-height:1.7}'
+'.sgr .sgr-k{font-size:.74rem;color:var(--dim,var(--mut));margin-top:.6rem}'
+'.sgr-satir{font-family:Inter,system-ui,sans-serif;font-size:.9rem;color:var(--mut);margin:1rem 0}.sgr-satir a{color:var(--ink);font-weight:600}'
+'.sgr-yap{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:900;display:none;align-items:center;gap:.4rem;font:600 .86rem Inter,system-ui,sans-serif;min-height:44px;padding:0 1rem;border-radius:99px;background:var(--ink);color:var(--bg);text-decoration:none;box-shadow:0 6px 24px rgba(0,0,0,.28)}'
+'@media(max-width:760px){.sgr-yap.acik{display:inline-flex}}'
+'@media print{.sgr,.sgr-satir,.sgr-yap{display:none!important}}';
function css(){ if(D.getElementById('sgrCss')) return; var s=D.createElement('style'); s.id='sgrCss'; s.textContent=CSS; D.head.appendChild(s); }
var WA='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3 1 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z"/></svg>';

var gorulen={};
var IO=W.IntersectionObserver?new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ var b=e.target.getAttribute('data-gorusme-b'); if(!gorulen[b]){ gorulen[b]=1; olay('wa_goruldu',b+':'+location.pathname); } } }); },{threshold:.5}):null;

function ciz(el){
  var b=el.getAttribute('data-gorusme'), M=METIN[b]; if(!M) return;
  if(el.hasAttribute('data-gorusme-kapali')){ el.hidden=true; return; }
  if(M.tip==='kart' && b!=='soru' && !ozet()){ el.hidden=true; return; }
  if(b==='harita' && !W.__sorbiOzet){ el.hidden=true; return; } /* tarih girilmeden görünmez */
  css(); el.hidden=false; el.setAttribute('data-gorusme-b',b);
  if(M.tip==='satir'){
    el.className='sgr-satir';
    el.innerHTML=M.once+' <a href="'+link(b)+'" target="_blank" rel="noopener" data-wa="'+b+'">'+M.buton+'</a>';
  } else {
    el.className='sgr';
    el.innerHTML='<h3>'+M.baslik+'</h3><p>'+M.destek+'</p><div class="sgr-s"><a class="sgr-b" href="'+link(b)+'" target="_blank" rel="noopener" data-wa="'+b+'">'+WA+M.buton+'</a>'+
      '<button type="button" class="sgr-n" aria-expanded="false">Nasıl işliyor?</button></div>'+
      '<ol hidden><li>WhatsApp\'ta yaz; neye bakmak istediğini konuşalım.</li><li>Sana uygun bir zaman belirleyelim.</li><li>Görüntülü ya da sesli, birebir görüşelim.</li></ol>'+
      '<div class="sgr-k">Mesaja doğum bilgilerin eklenir; göndermeden silebilirsin.</div>';
    var n=el.querySelector('.sgr-n'), ol=el.querySelector('ol');
    n.onclick=function(){ ol.hidden=!ol.hidden; n.setAttribute('aria-expanded',String(!ol.hidden)); if(!ol.hidden) olay('wa_nasil_isliyor',b); };
  }
  if(IO) IO.observe(el);
  if(b==='harita') yapiskan(el);
}
var YAP=null;
function yapiskan(el){
  if(YAP){ YAP.href=link('harita'); return; }
  YAP=D.createElement('a'); YAP.className='sgr-yap'; YAP.target='_blank'; YAP.rel='noopener'; YAP.setAttribute('data-wa','harita-yapiskan');
  YAP.innerHTML=WA+'Görüşme başlat'; YAP.href=link('harita'); D.body.appendChild(YAP);
  var ft=D.querySelector('footer,.foot,.sb-footer');
  var kontrol=function(){ var r=el.getBoundingClientRect(); var gecti=r.bottom<0 && scrollY>innerHeight*2; var dip=ft?ft.getBoundingClientRect().top<innerHeight:(innerHeight+scrollY>=D.documentElement.scrollHeight-200); YAP.classList.toggle('acik',gecti && !el.hidden && !dip); };
  W.addEventListener('scroll',kontrol,{passive:true}); kontrol();
}
D.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('[data-wa]'):null; if(!a) return;
  a.href=link(a.getAttribute('data-wa').replace('-yapiskan',''));
  olay('wa_tiklandi',a.getAttribute('data-wa')+':'+location.pathname+':'+(innerWidth<760?'mobil':'masa'));
},true);

function kur(kok){ var L=(kok||D).querySelectorAll('[data-gorusme]'); for(var i=0;i<L.length;i++) ciz(L[i]); }
D.addEventListener('sorbi:ozet',function(){ kur(); });
if(D.readyState==='loading') D.addEventListener('DOMContentLoaded',function(){ kur(); }); else kur();
W.SorbiGorusme={hazir:true,kur:kur,link:link,mesaj:mesaj,ciz:ciz};
})();
