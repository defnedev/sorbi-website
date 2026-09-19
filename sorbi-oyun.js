/*! sorbi-oyun.js — Sorbi sunucusuz oyunlaştırma çekirdeği.
 * Sıfır sunucu maliyeti: her şey localStorage (önek sorbi_oyun_). Hesap yok, istek yok, çerez yok.
 * Bildirimli: <div data-sorbi-sinav="id">, <div data-sorbi-ilerleme="bolum">, <span data-sorbi-nisan="ad">
 * API: SorbiOyun.kur(kok) .durum() .tamamla(id,puan) .isaretle(anahtar) .seviye() .seri()
 *      .nisanlar() .sinavSonuc(id) .bolumler() .sonraki() .sifirla() .destek()
 * Nişanlar öğrenmeye dayalıdır: şansa değil, kullanıcının yaptığı işe bağlanır. Dil olasılık kipindedir.
 */
(function(){
'use strict';
var W=window,D=document,ON='sorbi_oyun_',AN=ON+'v1',no=0;
/* Eşikler sitede toplanabilen puana göre ölçüldü: 18 sınav eksiksiz doğru yanıtlandığında
 * 335 puan birikiyor (12×18 burç + 22 + 22 + 20+15+20+20). En üst seviye 240'ta kalıyor;
 * böylece yalnız sınavlarla da ulaşılabilir. Eşikler yalnız düştüğü için kayıtlı puanlar bozulmaz. */
var SV=[[0,'Başlangıç'],[30,'Gözlemci'],[80,'Okuyan'],[150,'Çözen'],[240,'Ustalaşan']];
/* bölümler: "sıradaki adım" için; her bölüm kendi tamamlanma anahtarlarıyla sayılır */
var BOLUM=[
 {ad:'Öğren dersleri',url:'/ogren',top:4,ek:'ogren'},
 {ad:'On iki burç',url:'/burc-ozellikleri',top:12,ek:'burc-'},
 {ad:'Burç uyumu',url:'/burc-uyumu',top:5,ek:'uyum'}
];
var NISAN=[
 {ad:'retro',b:'Retroyu çözdün',a:'Retro dersinin sorularını eksiksiz doğru yanıtlayınca açılır.',
  ko:function(s){return tam(s,'ogren-1');}},
 {ad:'yukselen',b:'Yükseleni çözdün',a:'Yükselen dersinin sorularını eksiksiz doğru yanıtlayınca açılır.',
  ko:function(s){return tam(s,'ogren-3');}},
 {ad:'uc-element',b:'Üç element',a:'Üç ayrı canlı gösterimi kendin çalıştırınca açılır.',
  ko:function(s){return say(s.olay,'g:')>=3;}},
 {ad:'uc-ders',b:'Üç ders',a:'Üç dersin sorularını bitirince açılır.',
  ko:function(s){return Object.keys(s.tamam||{}).length>=3;}},
 {ad:'seri-3',b:'Üst üste üç gün',a:'Üç gün üst üste çalışınca açılır.',
  ko:function(s){return (s.seri&&s.seri.en||0)>=3;}}
];
function tam(s,id){var r=(s.sinav||{})[id];return !!(r&&r.n&&r.d===r.n);}
function say(o,ek){var n=0;for(var k in o||{})if(k.indexOf(ek)===0)n++;return n;}

var CSS='.sbo{background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.1rem;margin:1.4rem 0;font-family:Inter,system-ui,sans-serif;color:#F2EFE9}'
+'.sbo h3{font-family:Fraunces,Georgia,serif;font-size:1.05rem;font-weight:600;letter-spacing:-.01em;margin:0 0 .2rem}'
+'.sbo-ust{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}'
+'.sbo-halka{flex:0 0 auto;position:relative;width:74px;height:74px}'
+'.sbo-halka svg{display:block;transform:rotate(-90deg)}'
+'.sbo-halka span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:600;color:#F2EFE9;font-variant-numeric:tabular-nums}'
+'.sbo-bilgi{flex:1 1 200px;min-width:0}'
+'.sbo-bilgi p{font-size:.84rem;color:#A5A3AE;font-weight:300;margin:.15rem 0 0;line-height:1.55}'
+'.sbo-cubuk{height:6px;border-radius:99px;background:rgba(255,255,255,.08);margin-top:.5rem;overflow:hidden}'
+'.sbo-cubuk i{display:block;height:100%;background:#E3A692;border-radius:99px}'
+'.sbo-n{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.9rem}'
+'.sbo-r{position:relative;display:inline-flex;align-items:center;gap:.35rem;font-size:.8rem;letter-spacing:.02em;border:1px solid rgba(255,255,255,.14);border-radius:99px;padding:.3rem .6rem;color:#A5A3AE;background:transparent}'
+'.sbo-r.ac{color:#F2EFE9;border-color:#E3A692;background:rgba(227,166,146,.09)}'
+'.sbo-r i{font-style:normal;color:inherit}'
+'.sbo-gizli{font-size:.78rem;color:#A5A3AE;font-weight:300;line-height:1.6;margin-top:.9rem;padding-top:.75rem;border-top:1px solid rgba(255,255,255,.07)}'
+'.sbo-s{background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.1rem;margin:1.4rem 0;font-family:Inter,system-ui,sans-serif;color:#F2EFE9}'
+'.sbo-s .sbo-q{margin-top:1rem}.sbo-s .sbo-q:first-of-type{margin-top:.6rem}'
+'.sbo-s .sbo-qb{font-size:.95rem;font-weight:500;color:#F2EFE9;margin:0 0 .55rem;max-width:74ch;line-height:1.5}'
+'.sbo-s .sbo-sec{display:flex;flex-direction:column;gap:.4rem;max-width:62ch}'
+'.sbo-s button{font:inherit;font-size:.9rem;font-weight:400;text-align:left;color:#F2EFE9;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:.6rem .85rem;min-height:44px;cursor:pointer;line-height:1.4}'
+'.sbo-s button:hover:not([disabled]){background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22)}'
+'.sbo-s button[disabled]{cursor:default}'
+'.sbo-s button.d{border-color:#7FB3A8;background:rgba(127,179,168,.14)}'
+'.sbo-s button.y{border-color:#C4744E;background:rgba(196,116,78,.14)}'
+'.sbo-s .sbo-nd{font-size:.84rem;font-weight:300;color:#A5A3AE;line-height:1.6;margin:.55rem 0 0;max-width:70ch;border-left:2px solid rgba(255,255,255,.14);padding-left:.8rem}'
+'.sbo-s .sbo-nd b{color:#F2EFE9;font-weight:500}'
+'.sbo-s .sbo-nd.d{border-left-color:#7FB3A8}.sbo-s .sbo-nd.y{border-left-color:#C4744E}'
+'.sbo-s .sbo-son{font-size:.86rem;color:#F2EFE9;font-weight:500;margin-top:1rem;padding-top:.8rem;border-top:1px solid rgba(255,255,255,.08)}'
+'.sbo :focus-visible,.sbo-s :focus-visible{outline:2px solid #E3A692;outline-offset:2px;border-radius:8px}'
+'@media(max-width:560px){.sbo,.sbo-s{padding:.9rem}.sbo-halka{width:62px;height:62px}}';

/* ── depo: her erişim try/catch, bozuk veri sessizce sıfırlanır ── */
function bos(){return {xp:0,tamam:{},nisan:{},sinav:{},olay:{},seri:{n:0,son:'',en:0}};}
var DE=null;
function destek(){
 if(DE!==null)return DE;
 DE=false;
 try{W.localStorage.setItem(ON+'t','1');W.localStorage.removeItem(ON+'t');DE=true;}catch(e){}
 return DE;
}
var BEL=bos();
function oku(){
 if(!destek())return BEL;
 try{
  var r=W.localStorage.getItem(AN);if(!r)return bos();
  var s=JSON.parse(r);
  if(!s||typeof s!=='object')throw 0;
  var b=bos();
  b.xp=+s.xp||0;
  ['tamam','nisan','sinav','olay'].forEach(function(k){
   if(s[k]&&typeof s[k]==='object'&&!(s[k] instanceof Array))b[k]=s[k];});
  if(s.seri&&typeof s.seri==='object')
   b.seri={n:+s.seri.n||0,son:String(s.seri.son||'').slice(0,10),en:+s.seri.en||0};
  return b;
 }catch(e){try{W.localStorage.removeItem(AN);}catch(e2){}return bos();}
}
function yaz(s){
 if(!destek()){BEL=s;return;}
 try{W.localStorage.setItem(AN,JSON.stringify(s));}catch(e){BEL=s;}
}

/* ── seri: üst üste gün; gün atlanınca 1'e döner ── */
function p2(n){return (n<10?'0':'')+n;}
function gun(d){d=d||new Date();return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());}
function farkGun(a,b){
 if(!a)return 1e4;
 var x=Date.parse(a+'T00:00:00Z'),y=Date.parse(b+'T00:00:00Z');
 if(isNaN(x)||isNaN(y))return 1e4;
 return Math.round((y-x)/864e5);
}
function seriIc(s){
 var b=gun();
 if(s.seri.son===b)return s.seri;
 var f=farkGun(s.seri.son,b);
 s.seri.n=(f===1)?s.seri.n+1:1;
 s.seri.son=b;s.seri.en=Math.max(s.seri.en||0,s.seri.n);
 return s.seri;
}

/* ── seviye ── */
function seviyeIc(xp){
 var i=0;for(var j=0;j<SV.length;j++)if(xp>=SV[j][0])i=j;
 var alt=SV[i][0],ust=SV[i+1]?SV[i+1][0]:null;
 return {no:i+1,ad:SV[i][1],xp:xp,sonraki:ust,
  oran:ust?Math.min(1,(xp-alt)/(ust-alt)):1};
}

/* ── nişanlar ── */
function nisanIc(s){
 var yeni=[];
 NISAN.forEach(function(N){
  var vardi=!!s.nisan[N.ad],simdi=false;
  try{simdi=!!N.ko(s);}catch(e){}
  if(simdi&&!vardi){s.nisan[N.ad]=gun();yeni.push(N.ad);}
 });
 return yeni;
}
function nisanListe(){
 var s=oku();
 return NISAN.map(function(N){
  return {ad:N.ad,baslik:N.b,aciklama:N.a,acik:!!s.nisan[N.ad],tarih:s.nisan[N.ad]||''};
 });
}

/* ── bölümler: hangi bölüm ne kadar bitti, sıradaki adım hangisi ── */
function bolumListe(){
 var s=oku(),t=s.tamam||{};
 return BOLUM.map(function(B){
  var bit=Math.min(B.top,say(t,B.ek));
  return {ad:B.ad,url:B.url,bit:bit,toplam:B.top,bitti:bit>=B.top};
 });
}
function sonrakiAdim(){
 var l=bolumListe();
 for(var i=0;i<l.length;i++)if(!l[i].bitti)return l[i];
 return null;
}

/* ── dışa açık işlemler ── */
function kaydet(s){nisanIc(s);yaz(s);yenile();return s;}
function tamamla(id,puan){
 if(!id)return null;
 var s=oku();
 if(!s.tamam[id]){s.tamam[id]=gun();s.xp=(+s.xp||0)+(+puan||10);}
 seriIc(s);return kaydet(s);
}
function isaretle(k){
 if(!k)return null;
 var s=oku();
 if(!s.olay[k]){s.olay[k]=gun();seriIc(s);}
 return kaydet(s);
}
function sinavKaydet(id,d,y,n,puan){
 var s=oku(),r=s.sinav[id]||{};
 s.sinav[id]={d:d,y:y,n:n};
 if(d+y>=n&&!s.tamam[id]){s.tamam[id]=gun();s.xp=(+s.xp||0)+Math.round((+puan||15)*d/n);}
 else if(!r.n)s.xp=+s.xp||0;
 seriIc(s);return kaydet(s);
}
function sifirla(){
 try{W.localStorage.removeItem(AN);}catch(e){}
 BEL=bos();yenile();
}

/* ── bileşenler ── */
function ol(t,c,p,m){var e=D.createElement(t);if(c)e.className=c;
 if(m!=null)e.textContent=m;if(p)p.appendChild(e);return e;}
function ilerlemeCiz(el){
 var s=oku(),top=Math.max(1,+el.getAttribute('data-toplam')||3),ad=el.getAttribute('data-ad')||'İlerlemen';
 var onek=el.getAttribute('data-onek')||'';
 var kk=Object.keys(s.tamam||{});if(onek)kk=kk.filter(function(k){return k.indexOf(onek)===0;});
 var bit=kk.length,oran=Math.min(1,bit/top),sv=seviyeIc(+s.xp||0);
 var r=26,ce=2*Math.PI*r;
 el.className='sbo';
 el.innerHTML='<div class="sbo-ust"><div class="sbo-halka">'
 +'<svg width="74" height="74" viewBox="0 0 74 74" aria-hidden="true">'
 +'<circle cx="37" cy="37" r="'+r+'" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="6"/>'
 +'<circle cx="37" cy="37" r="'+r+'" fill="none" stroke="#E3A692" stroke-width="6" stroke-linecap="round"'
 +' stroke-dasharray="'+ce.toFixed(1)+'" stroke-dashoffset="'+(ce*(1-oran)).toFixed(1)+'"/></svg>'
 +'<span>'+bit+'/'+top+'</span></div>'
 +'<div class="sbo-bilgi"><h3>'+esc(ad)+'</h3>'
 +'<p>'+bit+' / '+top+' bölüm bitti · <b>'+esc(sv.ad)+'</b> (seviye '+sv.no+') · '+sv.xp+' puan'
 +(sv.sonraki?' · sonraki seviyeye '+(sv.sonraki-sv.xp)+' puan':'')+'</p>'
 +'<p>Seri: <b>'+(s.seri.n||0)+' gün</b>'+(s.seri.en>s.seri.n?' · en uzun '+s.seri.en+' gün':'')
 +(s.seri.son?' · son çalışma '+s.seri.son:' · henüz işaretlenmedi')+'</p>'
 +'<div class="sbo-cubuk"><i style="width:'+Math.round(sv.oran*100)+'%"></i></div>'
 +'</div></div><div class="sbo-n">'+nisanHtml(s)+'</div>'
 +'<p class="sbo-gizli">İlerlemen yalnız bu tarayıcıda, kendi cihazında tutuluyor: hesap açılmıyor, '
 +'sunucuya hiçbir veri gönderilmiyor, çerez kullanılmıyor.'
 +(destek()?'':' Bu tarayıcıda yerel depolama kapalı olduğu için ilerleme sayfa kapanınca korunmuyor.')
 +'</p>';
}
function nisanHtml(s){
 return NISAN.map(function(N){
  var a=!!s.nisan[N.ad];
  return '<span class="sbo-r'+(a?' ac':'')+'" title="'+esc(N.a)+'" aria-label="'
   +esc(N.b+' — '+(a?'açıldı':'henüz açılmadı')+'. '+N.a)+'">'
   +'<i aria-hidden="true">'+(a?'✦':'·')+'</i>'+esc(N.b)+'</span>';
 }).join('');
}
function nisanCiz(el){
 var ad=el.getAttribute('data-sorbi-nisan'),s=oku();
 var N=NISAN.filter(function(x){return x.ad===ad;})[0];
 if(!N){el.hidden=true;return;}
 var a=!!s.nisan[N.ad];
 el.className='sbo-r'+(a?' ac':'');
 el.innerHTML='<i aria-hidden="true">'+(a?'✦':'·')+'</i>'+esc(N.b);
 el.setAttribute('title',N.a);
 el.setAttribute('aria-label',N.b+(a?' — açıldı':' — henüz açılmadı')+'. '+N.a);
}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ── sınav: çoktan seçmeli, anında geri bildirim + doğru cevabın nedeni ── */
function sinavCiz(el){
 if(el.dataset.sboKuruldu)return;el.dataset.sboKuruldu='1';
 var id=el.getAttribute('data-sorbi-sinav')||('sinav-'+(++no));
 var ad=el.getAttribute('data-ad')||'Kendini dene';
 var puan=+el.getAttribute('data-puan')||15;
 var sorular=[].slice.call(el.querySelectorAll('[data-soru]'));
 if(!sorular.length){el.hidden=true;return;}
 el.classList.add('sbo-s');
 var bas=ol('h3','',null,ad),tid='sboS'+(++no);
 bas.id=tid;el.insertBefore(bas,el.firstChild);
 el.setAttribute('role','group');el.setAttribute('aria-labelledby',tid);
 var son=ol('p','sbo-son',el);son.setAttribute('role','status');son.setAttribute('aria-live','polite');
 var top=sorular.length,d=0,y=0,cev=0;
 sorular.forEach(function(q,qi){
  var soru=q.getAttribute('data-soru')||'';
  q.className='sbo-q';q.setAttribute('role','group');
  var sid=tid+'q'+qi,bl=ol('p','sbo-qb',null,soru);bl.id=sid;
  q.insertBefore(bl,q.firstChild);
  q.setAttribute('aria-labelledby',sid);
  var ops=[].slice.call(q.querySelectorAll('button'));
  var kutu=ol('div','sbo-sec',null);q.insertBefore(kutu,bl.nextSibling);
  ops.forEach(function(b){b.type='button';kutu.appendChild(b);});
  var nd=ol('p','sbo-nd',q);nd.hidden=true;nd.setAttribute('role','status');
  ops.forEach(function(b){
   b.addEventListener('click',function(){
    if(q.dataset.cevap)return;
    q.dataset.cevap='1';cev++;
    var ok=b.hasAttribute('data-dogru');
    if(ok)d++;else y++;
    b.classList.add(ok?'d':'y');
    b.setAttribute('aria-pressed','true');
    ops.forEach(function(o2){
     o2.disabled=true;
     if(!ok&&o2.hasAttribute('data-dogru'))o2.classList.add('d');
    });
    var dg=ops.filter(function(o2){return o2.hasAttribute('data-dogru');})[0];
    nd.hidden=false;nd.className='sbo-nd '+(ok?'d':'y');
    nd.innerHTML='<b>'+(ok?'Doğru.':'Bu değil.')+'</b> '
     +esc(b.getAttribute('data-neden')||'')
     +(!ok&&dg?' Doğru yanıt: “'+esc(dg.textContent)+'” — '+esc(dg.getAttribute('data-neden')||''):'');
    ozet();
   });
  });
 });
 function ozet(){
  son.textContent=cev+' / '+top+' soru yanıtlandı · '+d+' doğru, '+y+' yanlış'
   +(cev===top?(d===top?' · hepsi doğru':' · yanlışların nedenini yukarıda okuyabilirsin'):'');
  if(cev===top)sinavKaydet(id,d,y,top,puan);
 }
 ozet();
 el.sboSonuc=function(){return {d:d,y:y,n:top,cevaplanan:cev};};
}

/* ── kurulum ── */
var kokler=[];
function yenile(){
 kokler.forEach(function(k){
  try{
   k.querySelectorAll('[data-sorbi-ilerleme]').forEach(ilerlemeCiz);
   k.querySelectorAll('[data-sorbi-nisan]').forEach(nisanCiz);
  }catch(e){}
 });
}
function kur(kok){
 kok=kok||D;
 if(!D.getElementById('sboCss')){var st=D.createElement('style');st.id='sboCss';
  st.textContent=CSS;(D.head||D.body).appendChild(st);}
 if(kokler.indexOf(kok)<0)kokler.push(kok);
 try{kok.querySelectorAll('[data-sorbi-sinav]').forEach(sinavCiz);}catch(e){}
 yenile();
}
/* gösterim bileşeni kullanıldığında öğrenme olayı olarak işaretlenir */
D.addEventListener('sorbi:gosteri',function(e){
 var t=e&&e.detail&&e.detail.tip;if(t)isaretle('g:'+t);
});
W.SorbiOyun={
 kur:kur,durum:oku,destek:destek,
 tamamla:tamamla,isaretle:isaretle,puan:function(){return +oku().xp||0;},
 seviye:function(){return seviyeIc(+oku().xp||0);},
 seri:function(){var s=oku();seriIc(s);return kaydet(s).seri;},
 seriDurum:function(){return oku().seri;},
 nisanlar:nisanListe,
 bolumler:bolumListe,sonraki:sonrakiAdim,
 sinavSonuc:function(id){return (oku().sinav||{})[id]||null;},
 sifirla:sifirla,yenile:yenile
};
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',function(){kur();});else kur();
})();
