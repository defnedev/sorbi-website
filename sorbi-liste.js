/* SorbiListe — uygulama duyuru listesi bloğu (iOS + Android).
   Kullanım: <div data-sorbi-liste="kaynak" data-bekle="#sonuc"></div>
   data-bekle verilirse blok, o eleman görünür olunca açılır. Kayıt /api/liste'ye gider (ayrı onay kutusu şart). */
(function(){
'use strict';
var CSS='.sbl{max-width:640px;margin:2.2rem auto;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:1.8rem 1.3rem;text-align:center;font-family:Inter,system-ui,sans-serif;color:#F2EFE9}'+
'.sbl h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.35rem;margin:0 0 .4rem;letter-spacing:-.01em}'+
'.sbl p{color:#9BA0AB;font-size:.92rem;margin:0 auto 1rem;max-width:46ch;line-height:1.55}'+
'.sbl .sbl-form{max-width:430px;margin:0 auto}'+
'.sbl .sbl-f{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin:.8rem auto 0}'+
'.sbl input[type=email]{width:auto!important;margin:0!important;flex:1 1 220px;min-width:0;padding:.75rem .9rem;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:#F2EFE9;font:inherit;font-size:.95rem}'+
'.sbl button{padding:.75rem 1.2rem;border-radius:99px;border:0;background:#F2D3B8;color:#2B140C;font:inherit;font-weight:600;font-size:.92rem;cursor:pointer}'+
'.sbl button:disabled{opacity:.6;cursor:default}'+
'.sbl label.sbl-ok{display:flex!important;margin-top:.8rem;gap:.5rem;align-items:flex-start;justify-content:center;text-align:left!important;font-size:.78rem!important;color:#9BA0AB!important;line-height:1.5!important;max-width:430px;margin:.7rem auto 0!important;text-transform:none!important;letter-spacing:0!important;font-weight:400!important}'+
'.sbl label.sbl-ok input{width:16px!important;height:16px!important;min-width:0!important;padding:0!important;margin:.15rem 0 0!important;flex:none!important;accent-color:#E3A692}.sbl label.sbl-ok a{color:#E3A692}'+
'.sbl .sbl-st{min-height:1.2em;font-size:.82rem;margin-top:.6rem;color:#9BA0AB}';
function kur(el){
  if(el.dataset.sblKuruldu) return; el.dataset.sblKuruldu='1';
  var kaynak=(el.getAttribute('data-sorbi-liste')||'web').slice(0,40);
  el.classList.add('sbl');
  el.innerHTML='<h3>Sorbi telefonuna geliyor</h3>'+
   '<p>iOS ve Android. Çıktığı gün ilk sana yazalım — spam yok, sadece o haber.</p>'+
   '<form class="sbl-form" novalidate>'+
   '<input type="email" placeholder="e-posta adresin" autocomplete="email" enterkeyhint="go" aria-label="E-posta adresin">'+
   '<label class="sbl-ok"><input type="checkbox"><span>Sorbi\'nin uygulama duyurusu ve haber e-postaları göndermesine izin veriyorum; istediğim zaman çıkabilirim. · <a href="/privacy">KVKK</a></span></label>'+
   '<div class="sbl-f"><button type="submit">Beni listeye yaz ✦</button>'+
   '<input type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"></div>'+
   '</form>'+
   '<div class="sbl-st" role="status"></div>';
  var frm=el.querySelector('form'), em=el.querySelector('input[type=email]'), btn=el.querySelector('button'), hp=el.querySelector('input[type=text]'),
      ok=el.querySelector('label input'), st=el.querySelector('.sbl-st');
  try{ if(localStorage.getItem('sorbi_wl')==='1'){ frm.style.display='none'; st.style.color='#E4CF9A'; st.textContent='Listedesin — çıkınca ilk sana yazacağız.'; } }catch(e){}
  function gonder(){
    var v=(em.value||'').trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){ st.style.color='#F2A08A'; st.textContent='Geçerli bir e-posta gir.'; return; }
    if(!ok.checked){ st.style.color='#F2A08A'; st.textContent='Devam için onay kutusunu işaretle.'; return; }
    st.style.color='#9BA0AB'; st.textContent='Kaydediliyor…'; btn.disabled=true;
    fetch('/api/liste',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eposta:v,kvkk:1,kaynak:kaynak,hp:hp.value||''})})
     .then(function(r){ return r.json().catch(function(){return {};}).then(function(j){ return {r:r,j:j}; }); })
     .then(function(x){
       if(x.r.ok){ st.style.color='#E4CF9A'; st.textContent='Listedesin — Sorbi iOS ve Android’de çıkınca ilk sana yazacağız.'; try{localStorage.setItem('sorbi_wl','1');}catch(e){} }
       else { btn.disabled=false; st.style.color='#F2A08A'; st.textContent=x.j.error||'Kaydedilemedi, tekrar dener misin?'; }
     }).catch(function(){ btn.disabled=false; st.style.color='#F2A08A'; st.textContent='Bağlantı kurulamadı.'; });
  }
  frm.addEventListener('submit',function(ev){ ev.preventDefault(); gonder(); });
}
function gorunur(t){ if(!t) return false; if(t.hidden) return false; var cs=getComputedStyle(t); return cs.display!=='none' && cs.visibility!=='hidden'; }
function baslat(){
  var s=document.createElement('style'); s.textContent=CSS; document.head.appendChild(s);
  document.querySelectorAll('[data-sorbi-liste]').forEach(function(el){
    var sel=el.getAttribute('data-bekle'); var t=sel?document.querySelector(sel):null;
    if(!sel){ kur(el); return; }
    el.hidden=true;
    var dene=function(){ if(gorunur(t)){ kur(el); el.hidden=false; return true; } return false; };
    if(dene()) return;
    var mo=new MutationObserver(function(){ if(dene()) mo.disconnect(); });
    mo.observe(t,{attributes:true,attributeFilter:['hidden','style','class']});
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',baslat); else baslat();
})();
