/*! sorbi-hesap.js — Sorbi üyelik: giriş penceresi (Google + e-posta linki), kullanıcı adı, bekleme listesi.
 * API: SorbiHesap.ben() → Promise<kullanici|null> · .giris({neden,kaynak}) → Promise<kullanici|null>
 *      .cikis() · .bekleme(plan,kaynak) · .hak(plan) · .olay(tur,meta)
 * Oturum HttpOnly çerezde; bu dosya hiçbir sırrı tutmaz. */
(function(){
'use strict';
var W=window,D=document,BEN=null,BEN_P=null,AYAR_P=null;
function api(yol,gov,yontem){
  return fetch(yol,{method:yontem||(gov?'POST':'GET'),credentials:'same-origin',
    headers:gov?{'Content-Type':'application/json'}:{},body:gov?JSON.stringify(gov):undefined})
   .then(function(r){return r.json().catch(function(){return {};}).then(function(j){j.__durum=r.status;return j;});});
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function ben(tazele){
  if(BEN_P&&!tazele) return BEN_P;
  BEN_P=api('/api/hesap/ben').then(function(j){BEN=j.kullanici||null;yay();return BEN;}).catch(function(){BEN=null;return null;});
  return BEN_P;
}
function ayar(){ if(!AYAR_P) AYAR_P=api('/api/hesap/ayar').catch(function(){return {};}); return AYAR_P; }
function yay(){ try{D.dispatchEvent(new CustomEvent('sorbi:hesap',{detail:{kullanici:BEN}}));}catch(e){} }
function olay(tur,meta){
  try{var g=JSON.stringify({type:tur,meta:meta||null});
    if(navigator.sendBeacon) navigator.sendBeacon('/api/olay',new Blob([g],{type:'application/json'}));
    else fetch('/api/olay',{method:'POST',headers:{'Content-Type':'application/json'},body:g,keepalive:true,credentials:'same-origin'});
  }catch(e){}
}
function hak(plan){ var p=(BEN&&BEN.plan)||''; return p==='tam'||p===plan||p.split('+').indexOf(plan)>=0; }

var CSS='.shk-ort{position:fixed;inset:0;z-index:6000;background:rgba(8,6,12,.62);display:flex;align-items:center;justify-content:center;padding:16px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}'
+'.shk{width:min(440px,100%);max-height:92vh;overflow:auto;background:var(--bg,#0B0810);color:var(--ink,#F2EFE9);border:1px solid rgba(var(--ink-rgb,242,239,233),.18);border-radius:18px;padding:1.5rem 1.4rem;font-family:Inter,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.45);position:relative}'
+'.shk h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.35rem;margin:0 0 .4rem}'
+'.shk p{font-size:.9rem;line-height:1.6;color:var(--mut,#A5A3AE);margin:0 0 1rem}'
+'.shk .shk-x{position:absolute;top:.6rem;right:.6rem;background:none;border:0;color:var(--mut,#A5A3AE);font-size:1.3rem;min-width:44px;min-height:44px;cursor:pointer}'
+'.shk .shk-g{min-height:44px;margin:.2rem 0 1rem;display:flex;justify-content:center}'
+'.shk .shk-ayr{display:flex;align-items:center;gap:.7rem;font-size:.75rem;color:var(--mut,#A5A3AE);margin:.4rem 0 .9rem}.shk .shk-ayr:before,.shk .shk-ayr:after{content:"";flex:1;height:1px;background:rgba(var(--ink-rgb,242,239,233),.16)}'
+'.shk label{display:block;font-size:.78rem;color:var(--mut,#A5A3AE);margin:0 0 .3rem}'
+'.shk input[type=email],.shk input[type=text]{width:100%;box-sizing:border-box;font:inherit;font-size:1rem;padding:.75rem .9rem;border-radius:12px;border:1px solid rgba(var(--ink-rgb,242,239,233),.22);background:rgba(var(--ink-rgb,242,239,233),.05);color:inherit}'
+'.shk .shk-b{width:100%;margin-top:.7rem;font:600 .95rem Inter,system-ui,sans-serif;min-height:46px;border-radius:99px;border:0;background:var(--ink,#F2EFE9);color:var(--bg,#0B0810);cursor:pointer}'
+'.shk .shk-b[disabled]{opacity:.55;cursor:default}'
+'.shk .shk-d{font-size:.82rem;margin-top:.7rem;min-height:1.2em}.shk .shk-d.h{color:#E3A692}.shk .shk-d.o{color:#8FC7A8}'
+'.shk .shk-k{font-size:.72rem;line-height:1.6;color:var(--dim,#807E8B);margin-top:1rem}.shk .shk-k a{color:inherit}';
function cssKur(){ if(D.getElementById('shkCss')) return; var s=D.createElement('style'); s.id='shkCss'; s.textContent=CSS; D.head.appendChild(s); }

function pencere(ic){
  cssKur();
  var o=D.createElement('div'); o.className='shk-ort';
  o.innerHTML='<div class="shk" role="dialog" aria-modal="true" aria-labelledby="shkB"><button class="shk-x" type="button" aria-label="Kapat">×</button>'+ic+'</div>';
  D.body.appendChild(o);
  var onceki=D.activeElement;
  function kapat(){ if(o.parentNode) o.parentNode.removeChild(o); D.removeEventListener('keydown',tus,true); try{onceki&&onceki.focus();}catch(e){} }
  function tus(e){ if(e.key==='Escape'){ e.preventDefault(); o.__kapat&&o.__kapat(); } }
  D.addEventListener('keydown',tus,true);
  o.addEventListener('click',function(e){ if(e.target===o) o.__kapat&&o.__kapat(); });
  o.querySelector('.shk-x').addEventListener('click',function(){ o.__kapat&&o.__kapat(); });
  o.__kapatIc=kapat;
  return o;
}

var GIS_P=null;
function gisYukle(){
  if(GIS_P) return GIS_P;
  GIS_P=new Promise(function(ok,red){ var s=D.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true; s.onload=ok; s.onerror=red; D.head.appendChild(s); });
  return GIS_P;
}

function kullaniciAdiAdimi(o,bitir){
  var k=o.querySelector('.shk');
  k.innerHTML='<button class="shk-x" type="button" aria-label="Kapat">×</button><h2 id="shkB">Bir kullanıcı adı seç</h2>'+
    '<p>Sorbi topluluğunda bu adla görüneceksin. E-postan kimseye gösterilmez.</p>'+
    '<label for="shkAd">Kullanıcı adı</label><input id="shkAd" type="text" autocomplete="username" maxlength="20" placeholder="ornek: gokyuzu.defne" autocapitalize="off" spellcheck="false">'+
    '<button class="shk-b" id="shkAdB" type="button">Kaydet ve devam et</button><div class="shk-d" id="shkAdD"></div>';
  k.querySelector('.shk-x').addEventListener('click',function(){ bitir(BEN); });
  var g=k.querySelector('#shkAd'); try{g.focus();}catch(e){}
  function kaydet(){
    var b=k.querySelector('#shkAdB'), d=k.querySelector('#shkAdD'); b.disabled=true; d.className='shk-d'; d.textContent='Kaydediliyor…';
    api('/api/hesap/kullanici-adi',{ad:g.value}).then(function(j){
      b.disabled=false;
      if(j.ok){ ben(true).then(function(u){ olay('kullanici_adi_secti'); bitir(u); }); }
      else { d.className='shk-d h'; d.textContent=j.error||'Kaydedilemedi.'; }
    });
  }
  k.querySelector('#shkAdB').addEventListener('click',kaydet);
  g.addEventListener('keydown',function(e){ if(e.key==='Enter') kaydet(); });
}

function giris(opt){
  opt=opt||{};
  return ben().then(function(u){
    if(u && u.kullanici_adi) return u;
    return ayar().then(function(a){ return new Promise(function(coz){
      var o, bitti=false;
      function bitir(v){ if(bitti) return; bitti=true; o.__kapatIc(); coz(v||null); }
      if(u && !u.kullanici_adi){ o=pencere(''); o.__kapat=function(){ bitir(BEN); }; kullaniciAdiAdimi(o,bitir); return; }
      var epostaAcik=a.eposta||a.test;
      o=pencere('<h2 id="shkB">'+esc(opt.baslik||'Sorbi\'ye gir')+'</h2>'+
        '<p>'+esc(opt.neden||'Ücretsiz üyelik: haritaların ve Masa dosyaların her cihazında.')+'</p>'+
        (a.google?'<div class="shk-g" id="shkG"></div>':'')+
        (a.google&&epostaAcik?'<div class="shk-ayr">ya da e-postayla</div>':'')+
        (epostaAcik?'<label for="shkE">E-posta</label><input id="shkE" type="email" autocomplete="email" inputmode="email" placeholder="ad@ornek.com">'+
          '<input type="text" id="shkHp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">'+
          '<button class="shk-b" id="shkEB" type="button">Giriş linki gönder</button>':'')+
        (!a.google&&!epostaAcik?'<p>Giriş birkaç gün içinde açılıyor. Şimdilik her şey bu cihazda çalışmaya devam ediyor.</p>':'')+
        '<div class="shk-d" id="shkD"></div>'+
        '<div class="shk-k">Devam ederek <a href="/gizlilik#uyelik" target="_blank" rel="noopener">üyelik ve gizlilik metnini</a> kabul etmiş olursun. Giriş şifresi yok; Masa senkronu için ayrıca bir kasa şifresi belirlersin. Hesabını istediğin an silebilirsin.</div>');
      o.__kapat=function(){ bitir(BEN); };
      var d=o.querySelector('#shkD');
      function tamam(j){
        if(!j.ok){ d.className='shk-d h'; d.textContent=j.error||'Giriş yapılamadı.'; return; }
        olay(j.yeni?'uye_giris_yeni':'uye_giris',opt.kaynak||null);
        ben(true).then(function(u2){ if(u2&&!u2.kullanici_adi) kullaniciAdiAdimi(o,bitir); else bitir(u2); });
      }
      if(a.google){
        gisYukle().then(function(){
          var g=W.google&&W.google.accounts&&W.google.accounts.id; if(!g) throw 0;
          g.initialize({client_id:a.google, ux_mode:'popup', callback:function(r){
            d.className='shk-d'; d.textContent='Giriş yapılıyor…';
            api('/api/hesap/google',{credential:r.credential,kaynak:opt.kaynak||'google'}).then(tamam);
          }});
          var kut=o.querySelector('#shkG');
          g.renderButton(kut,{theme:'outline',size:'large',shape:'pill',text:'continue_with',locale:'tr',width:Math.min(360,kut.clientWidth||320)});
        }).catch(function(){ var k=o.querySelector('#shkG'); if(k) k.innerHTML='<span style="font-size:.8rem;color:var(--mut)">Google düğmesi yüklenemedi; e-postayla devam edebilirsin.</span>'; });
      }
      if(epostaAcik){
        var e=o.querySelector('#shkE'), b=o.querySelector('#shkEB');
        function gonder(){
          b.disabled=true; d.className='shk-d'; d.textContent='Gönderiliyor…';
          api('/api/hesap/eposta-link',{eposta:e.value,hp:o.querySelector('#shkHp').value,geri:location.pathname+location.search}).then(function(j){
            b.disabled=false;
            if(j.test_link){ d.className='shk-d o'; d.innerHTML='Test linki: <a href="'+esc(j.test_link)+'">giriş</a>'; return; }
            if(j.ok){ d.className='shk-d o'; d.textContent='Linki gönderdik. E-postanı aç ve "Sorbi\'ye gir"e dokun; bu pencereyi kapatabilirsin.'; olay('eposta_link_istedi',opt.kaynak||null); }
            else { d.className='shk-d h'; d.textContent=j.error||'Gönderilemedi.'; }
          });
        }
        b.addEventListener('click',gonder); e.addEventListener('keydown',function(ev){ if(ev.key==='Enter') gonder(); });
        if(!a.google) try{e.focus();}catch(x){}
      }
    }); });
  });
}

function cikis(){ return api('/api/hesap/cikis',{}).then(function(){ BEN=null; BEN_P=Promise.resolve(null); yay(); }); }
function bekleme(plan,kaynak){
  return giris({neden: plan==='pro'?'Pro açıldığında ilk sana haber verelim; üyelik ücretsiz.':'Eğitim üyeliği açıldığında ilk sana haber verelim; üyelik ücretsiz.', kaynak:'bekleme-'+plan})
    .then(function(u){ if(!u) return {ok:false}; return api('/api/bekleme',{plan:plan,kaynak:kaynak||null}).then(function(j){ if(j.ok) ben(true); return j; }); });
}

W.SorbiHesap={ben:ben,giris:giris,cikis:cikis,bekleme:bekleme,hak:hak,olay:olay,api:api,esc:esc,css:cssKur};
})();
