/* SorbiForm — ortak doğum bilgisi giriş bileşeni.
   Native date/time inputları segmentli (GG.AA.YYYY / SS:DK) profesyonel girişe çevirir,
   değeri native inputa geri yazar => sayfa JS'i değişmeden çalışır.
   Ayrıca tüm form alanlarını Sorbi diline normalize eder (koyu cam, altın odak). */
(function(){
'use strict';
var CSS=[
'/* SorbiForm normalize */',
'input[type=text],input[type=email],input[type=tel],input[type=number],input[type=search],input:not([type]),select,textarea{background:rgba(0,0,0,.35)!important;border:1px solid rgba(255,255,255,.14)!important;color:#F2EFE9!important;border-radius:12px!important;color-scheme:dark;transition:border-color .15s,box-shadow .15s}',
'input:focus,select:focus,textarea:focus{outline:none!important;border-color:rgba(227,166,146,.55)!important;box-shadow:0 0 0 3px rgba(227,166,146,.14)!important}',
'select{padding:.7rem .85rem;font-family:inherit}',
'.sfwrap{display:flex;align-items:center;gap:.35rem;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:.62rem .8rem;transition:border-color .15s,box-shadow .15s}',
'.sfwrap:focus-within{border-color:rgba(227,166,146,.55);box-shadow:0 0 0 3px rgba(227,166,146,.14)}',
'.sfwrap input.sfseg{background:none!important;border:none!important;box-shadow:none!important;padding:0!important;margin:0;color:#F2EFE9!important;font:inherit;font-size:1.02rem;font-variant-numeric:tabular-nums;text-align:center;width:2.15ch;caret-color:#E3A692}',
'.sfwrap input.sfseg.sfy{width:4.3ch}',
'.sfwrap input.sfseg::placeholder{color:#5C6068;letter-spacing:.5px}',
'.sfwrap .sfsep{color:#5C6068;user-select:none;font-size:1rem}',
'.sfwrap .sfic{margin-left:auto;color:#8A8F98;font-size:.85rem;opacity:.7}',
'.sfhint{font-size:.72rem;color:#6D7280;margin-top:.3rem;letter-spacing:.3px}',
'.sfnot{font-size:.74rem;line-height:1.45;margin-top:.35rem;letter-spacing:.2px}',
'/* mobil: nav kaydırılabilir, sayfa yana taşmaz */',
'.sbnav nav,.sorbi-topnav nav,.topnav nav{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;min-width:0;-webkit-overflow-scrolling:touch}',
'.sbnav nav::-webkit-scrollbar,.sorbi-topnav nav::-webkit-scrollbar,.topnav nav::-webkit-scrollbar{display:none}',
'@media(max-width:640px){html,body{overflow-x:hidden}}',
'.form .full,.form label{min-width:0;max-width:100%}',
'/* şehir arama listeleri (index .geolist + eski .gr) ortak dil */',
'.geolist,.gr{background:rgba(14,15,20,.97)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:14px!important;box-shadow:0 18px 50px rgba(0,0,0,.55)!important;backdrop-filter:blur(14px);overflow:hidden}',
'.geolist>div,.gr .gi{padding:.62rem .9rem!important;cursor:pointer;color:#D6D3CC;transition:background .12s}',
'.geolist>div:hover,.gr .gi:hover{background:rgba(227,166,146,.12)!important;color:#F2EFE9}',
'.gr .gi small{color:#8A8F98;display:block;font-size:.75rem;margin-top:.1rem}'
].join('\n');

function injectCSS(){var s=document.createElement('style');s.id='sorbi-form-css';s.textContent=CSS;document.head.appendChild(s);}

function mkSeg(ph,w){var i=document.createElement('input');i.type='text';i.inputMode='numeric';i.autocomplete='off';i.className='sfseg'+(w?' sfy':'');i.placeholder=ph;i.maxLength=w?4:2;return i;}
function sep(t){var s=document.createElement('span');s.className='sfsep';s.textContent=t;return s;}
function ic(t){var s=document.createElement('span');s.className='sfic';s.textContent=t;return s;}

function pad(v){return ('0'+v).slice(-2);}

function enhance(native,kind){
 if(native.dataset.sf)return; native.dataset.sf='1';
 var wrap=document.createElement('div');wrap.className='sfwrap';
 var segs,write,read;
 if(kind==='date'){
   var g=mkSeg('GG'),a=mkSeg('AA'),y=mkSeg('YYYY',1);
   segs=[g,a,y];
   wrap.appendChild(g);wrap.appendChild(sep('.'));wrap.appendChild(a);wrap.appendChild(sep('.'));wrap.appendChild(y);wrap.appendChild(ic('✦'));
   write=function(){ if(g.value.length&&a.value.length&&y.value.length===4){var vv=y.value+'-'+pad(a.value)+'-'+pad(g.value);
     if(!gecerliGun(vv)){ not(native,'Böyle bir tarih yok — günü kontrol et.','hata'); if(native.value){native.value='';fire(native);} return; }
     if(native.value!==vv){native.value=vv;fire(native);} tarihDenetle(native); } else if(native.value){native.value='';fire(native);} };
   read=function(){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(native.value||'');if(m){y.value=m[1];a.value=m[2];g.value=m[3];}else{g.value=a.value=y.value='';}};
 }else{
   var h=mkSeg('SS'),mn=mkSeg('DK');
   segs=[h,mn];
   wrap.appendChild(h);wrap.appendChild(sep(':'));wrap.appendChild(mn);wrap.appendChild(ic('◷'));
   write=function(){ if(h.value.length&&mn.value.length){var vv=pad(h.value)+':'+pad(mn.value); if(native.value!==vv){native.value=vv;fire(native);} } };
   read=function(){var m=/^(\d{2}):(\d{2})/.exec(native.value||'');if(m){h.value=m[1];mn.value=m[2];}else{h.value=mn.value='';}};
 }
 var lims={GG:31,AA:12,SS:23,DK:59,YYYY:2100};
 segs.forEach(function(sg,ix){
   sg.addEventListener('input',function(){
     sg.value=sg.value.replace(/\D/g,'');
     var lim=lims[sg.placeholder]||99;
     if(sg.value.length>=sg.maxLength||(sg.value.length&&+sg.value>Math.floor(lim/10)&&sg.maxLength===2)){
       if(+sg.value>lim)sg.value=String(lim);
       if(ix<segs.length-1&&sg.value.length>=(sg.maxLength===4?4:sg.value.length>=2?2:1)&&(sg.value.length===sg.maxLength||+sg.value>Math.floor(lim/10)))segs[ix+1].focus();
     }
     write();
   });
   sg.addEventListener('blur',function(){ if(sg.value.length===1&&sg.maxLength===2)sg.value=pad(sg.value); write(); });
   sg.addEventListener('keydown',function(e){
     if(e.key==='Backspace'&&!sg.value&&ix>0)segs[ix-1].focus();
     if((e.key==='.'||e.key===':'||e.key===',')&&ix<segs.length-1){e.preventDefault();segs[ix+1].focus();}
   });
 });
 native.style.display='none';
 native.parentNode.insertBefore(wrap,native.nextSibling);
 read();
 // programatik doldurmayı yakala (deep-link autofill vs.)
 var last=native.value;
 setInterval(function(){ if(native.value!==last){last=native.value;read();} },350);
 // segment yazınca last'i de güncelle
 native.addEventListener('change',function(){last=native.value;});
}

function fire(el){try{el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}}


function gecerliGun(v){
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||''); if(!m) return false;
  var y=+m[1],mo=+m[2],d=+m[3]; if(mo<1||mo>12||d<1) return false;
  var dt=new Date(Date.UTC(y,mo-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d;
}

/* ── doğum tarihi aralık uyarısı + bulunamayan yer uyarısı (2026-09-17) ── */
function not(el,msg,tur){
  var id='sfnot-'+(el.id||Math.random().toString(36).slice(2));
  var box=document.getElementById(id);
  if(!msg){ if(box) box.remove(); return; }
  if(!box){ box=document.createElement('div'); box.id=id; box.className='sfnot'; (el.closest('.sfwrap')||el).insertAdjacentElement('afterend',box); }
  box.textContent=msg; box.style.color = tur==='hata' ? '#F2A08A' : '#E4CF9A';
}
function tarihDenetle(native){
  var v=native.value; if(!v){ not(native,''); return; }
  var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if(!m){ not(native,'Tarihi GG.AA.YYYY olarak tamamla.','hata'); return; }
  var y=+m[1],mo=+m[2],d=+m[3], dt=new Date(Date.UTC(y,mo-1,d));
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==d){ not(native,'Böyle bir tarih yok — günü kontrol et.','hata'); return; }
  var bugun=new Date();
  if(dt.getTime() > Date.UTC(bugun.getFullYear(),bugun.getMonth(),bugun.getDate())){ not(native,'Bu tarih gelecekte. Doğum tarihini gir.','hata'); return; }
  if(y<1900){ not(native,'1900 öncesi tarihlerde hesap güvenilir değil.','uyari'); return; }
  not(native,'');
}
function yerDenetle(inp){
  var q=(inp.value||'').trim();
  if(q.length<2){ not(inp,''); return; }
  if(!window.SorbiYer||!window.SorbiYer.ara){ return; }
  var beklenen=q;
  window.SorbiYer.ara(q).then(function(veri){
    if((inp.value||'').trim()!==beklenen) return;
    var r=(veri&&veri.results)||[];
    not(inp, r.length? '' : 'Bu yeri bulamadım — hesap İstanbul’a göre yapılır. Şehri Türkçe yazmayı dene.', 'uyari');
  }).catch(function(){});
}
function denetimKur(){
  document.querySelectorAll('input[type=date]').forEach(function(n){
    if(!/(^|-)(d|bd|cDate|fDate|tarih|date)$/i.test(n.id||'') && !/tarih|date/i.test(n.id||'')) { /* yine de doğum tarihi olabilir */ }
    n.addEventListener('change',function(){tarihDenetle(n);});
    n.addEventListener('blur',function(){tarihDenetle(n);});
    if(n.value) tarihDenetle(n);
  });
  ['bp','p','fPlace','fYer','cPlace','cCity','yer'].forEach(function(id){
    var inp=document.getElementById(id); if(!inp) return;
    inp.addEventListener('blur',function(){ setTimeout(function(){ yerDenetle(inp); },250); });
  });
}

function init(){
 injectCSS();
 denetimKur();
 document.querySelectorAll('input[type=date]').forEach(function(n){enhance(n,'date');});
 document.querySelectorAll('input[type=time]').forEach(function(n){enhance(n,'time');});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.SorbiForm={enhance:enhance};
})();
