/* SorbiProfil — girişli deneyim katmanı.
   İlk hesaplamada kaydedilen doğum bilgisi (sorbi_birth / sorbi_profile) her araçta
   otomatik kullanılır; bu modül bunu GÖRÜNÜR kılar: nav altına profil çipi basar,
   "değiştir" ve "çıkış" verir. Kayıtlı kişiler = Haritalarım kitaplığı (sorbi_charts).
   Veri cihazda kalır; sunucuya hiçbir şey gitmez. */
(function(){
'use strict';

function birth(){
  try{
    var b=JSON.parse(localStorage.getItem('sorbi_birth')||'null');
    if(b&&b.date) return b;
    var p=JSON.parse(localStorage.getItem('sorbi_profile')||'null');
    if(p&&p.birth&&p.birth.date) return p.birth;
  }catch(e){}
  return null;
}
function name(){
  try{
    var p=JSON.parse(localStorage.getItem('sorbi_profile')||'null');
    if(p&&p.name) return p.name;
    var b=JSON.parse(localStorage.getItem('sorbi_birth')||'null');
    if(b&&b.name) return b.name;
  }catch(e){}
  return '';
}
function people(){
  try{ return (JSON.parse(localStorage.getItem('sorbi_charts')||'[]')||[]).filter(function(c){return c&&c.date;}); }
  catch(e){ return []; }
}
function logout(){
  try{ localStorage.removeItem('sorbi_birth'); localStorage.removeItem('sorbi_profile'); }catch(e){}
  location.reload();
}
function fmtDate(d){ // YYYY-MM-DD -> GG.AA.YYYY
  var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(d||''); return m ? (m[3]+'.'+m[2]+'.'+m[1]) : (d||'');
}

function chip(){
  var b=birth(); if(!b) return;               // profil yoksa sessiz kal
  if(document.getElementById('sbprofil')) return;
  var n=name();
  var css=document.createElement('style');
  css.textContent=[
   '#sbprofil{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;max-width:1120px;margin:.55rem auto 0;padding:.45rem .9rem;',
   'background:rgba(227,166,146,.07);border:1px solid rgba(227,166,146,.22);border-radius:99px;width:fit-content;',
   'font:500 .78rem/1.4 Inter,system-ui,sans-serif;color:#D6D3CC}',
   '#sbprofil b{color:#F2D3B8;font-weight:600}',
   '#sbprofil .sbp-dot{color:#5C6068}',
   '#sbprofil a{color:#9BA0AB;text-decoration:underline;text-underline-offset:2px;cursor:pointer}',
   '#sbprofil a:hover{color:#F2EFE9}',
   '@media(max-width:560px){#sbprofil{font-size:.72rem;margin:.5rem .7rem 0;padding:.4rem .7rem}}'
  ].join('');
  document.head.appendChild(css);
  var el=document.createElement('div');
  el.id='sbprofil';
  el.innerHTML='✦ <b>'+esc(n||'Profilin')+'</b>'+
    '<span class="sbp-dot">·</span>'+esc(fmtDate(b.date))+(b.time?' '+esc(b.time):'')+
    (b.place?'<span class="sbp-dot">·</span>'+esc((b.place||'').split(',')[0]):'')+
    '<span class="sbp-dot">—</span>bilgilerin her araçta hazır'+
    '<a id="sbpEdit">değiştir</a><a id="sbpOut">çıkış</a>';
  var nav=document.querySelector('.sbnav')||document.querySelector('.topnav')||document.querySelector('.sorbi-topnav');
  if(nav&&nav.parentNode) nav.parentNode.insertBefore(el,nav.nextSibling);
  else document.body.insertBefore(el,document.body.firstChild);
  document.getElementById('sbpOut').onclick=logout;
  document.getElementById('sbpEdit').onclick=function(){
    el.remove();
    var f=document.querySelector('.sfwrap input.sfseg')||document.querySelector('input[type=text],input:not([type])');
    if(f){ f.focus(); f.scrollIntoView({behavior:'smooth',block:'center'}); }
  };
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

/* ── sıfır tık: profil varsa araç kendiliğinden çalışır ── */
function autorun(){
  if(!birth()) return;
  if(/[?&](d|m)=/.test(location.search)) return;        // deep-link kendi akışını yönetir
  var go=document.getElementById('go')||document.getElementById('goBtn');
  if(!go||go.dataset.sbAuto) return;
  var d=document.getElementById('d')||document.getElementById('fDate');
  if(!d||!d.value) return;                              // sayfanın kendi ön-dolumu bitmemişse çalışma
  go.dataset.sbAuto='1';
  var n=0;(function w(){
    if(window.Astronomy){ try{ go.click(); }catch(e){} }
    else if(n++<60){ setTimeout(w,200); }
  })();
}
function mend(){ /* jeton bakımı: profil ve birth birbirini tamamlasın */
  try{
    var b=JSON.parse(localStorage.getItem('sorbi_birth')||'null');
    var p=JSON.parse(localStorage.getItem('sorbi_profile')||'null');
    if(b&&b.date&&(!p||!p.birth||!p.birth.date)){ p=p||{}; p.birth=b; localStorage.setItem('sorbi_profile',JSON.stringify(p)); }
    else if(p&&p.birth&&p.birth.date&&(!b||!b.date)){ localStorage.setItem('sorbi_birth',JSON.stringify(p.birth)); }
  }catch(e){}
}
function boot(){ mend(); chip(); setTimeout(autorun,500); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
window.SorbiProfil={birth:birth,name:name,people:people,logout:logout,autorun:autorun};
})();
