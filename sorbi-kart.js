/*! sorbi-kart.js — Sorbi paylaşım kartı üreteci
 *  window.SorbiKart.uret(veri)  -> Promise<{blob, dataUrl, genislik, yukseklik}>
 *  window.SorbiKart.indir(veri, dosyaAdi) -> Promise<boolean>
 *
 *  veri = { muhur, altbaslik, ucluMetin, nadirSatir, kunye, svg, url }
 *  Sunucu yok, bağımlılık yok. Çıktı her zaman tam 1080×1920 PNG.
 */
(function(){
"use strict";

var W = 1080, H = 1920;

/* seni-taniyorum.html :root ile birebir */
var C = {
  bg:'#0B0F14', isik:'#10151d',
  gold:'#DFA98F', goldBr:'#F2D3B8',
  ink:'#E8E4DA', mut:'#A9A396', dim:'#8A8578'
};

/* Space Grotesk / Inter yoksa sırayla düşülecek yığın */
var F_BAS = "'Space Grotesk','Inter','IBM Plex Sans',system-ui,sans-serif";
var F_GOV = "'Inter','IBM Plex Sans',system-ui,sans-serif";
var F_SEM = "'Inter','Noto Sans Symbols2','Segoe UI Symbol','DejaVu Sans',system-ui,sans-serif";

var KENAR = 90;               /* sol/sağ cömert boşluk */
var GEN   = W - KENAR*2;      /* 900 */

/* ───────────────────────── yardımcılar ───────────────────────── */

/* Chromium 99+ ctx.letterSpacing destekler; yoksa harf harf çizeriz */
var LS_VAR = (function(){
  try{ var c=document.createElement('canvas').getContext('2d'); return ('letterSpacing' in c); }
  catch(e){ return false; }
})();

function harfAralik(ctx,px){ if(LS_VAR) ctx.letterSpacing=(px||0)+'px'; }

/* Türkçe güvenli büyük harf (i→İ, ı→I) */
function trBuyuk(s){
  return String(s).replace(/i/g,'İ').replace(/ı/g,'I').toUpperCase();
}

function genislik(ctx,t,ls){
  if(!ls) return ctx.measureText(t).width;
  if(LS_VAR){ harfAralik(ctx,ls); var w=ctx.measureText(t).width; harfAralik(ctx,0); return w; }
  var ch=Array.from(String(t)), w2=0;
  for(var i=0;i<ch.length;i++) w2+=ctx.measureText(ch[i]).width+ls;
  return Math.max(0,w2-ls);
}

/* ortalanmış tek satır (harf aralıklı olabilir), textBaseline='top' varsayar */
function satirYaz(ctx,t,cx,y,ls){
  if(!ls){ ctx.fillText(t,cx,y); return; }
  if(LS_VAR){
    /* letterSpacing son harften sonra da boşluk ekler; ortalamayı yarım aralık düzelt */
    harfAralik(ctx,ls);
    ctx.fillText(t, ctx.textAlign==='center' ? cx-ls/2 : cx, y);
    harfAralik(ctx,0);
    return;
  }
  var ch=Array.from(String(t)), w=genislik(ctx,t,ls), x=cx-w/2;
  var eskiHiza=ctx.textAlign; ctx.textAlign='left';
  for(var i=0;i<ch.length;i++){ ctx.fillText(ch[i],x,y); x+=ctx.measureText(ch[i]).width+ls; }
  ctx.textAlign=eskiHiza;
}

/* kelime bazlı satır sarma; sığmayan tek kelimeyi karakterden böler */
function sar(ctx,metin,maxW,ls){
  var kel=String(metin==null?'':metin).trim().split(/\s+/).filter(Boolean);
  if(!kel.length) return [];
  var satirlar=[], cur='';
  function tekKelimeBol(k){
    var ch=Array.from(k), p='', out=[];
    for(var i=0;i<ch.length;i++){
      if(p && genislik(ctx,p+ch[i],ls)>maxW){ out.push(p); p=ch[i]; }
      else p+=ch[i];
    }
    if(p) out.push(p);
    return out;
  }
  for(var i=0;i<kel.length;i++){
    var d = cur ? cur+' '+kel[i] : kel[i];
    if(genislik(ctx,d,ls)<=maxW){ cur=d; continue; }
    if(cur){ satirlar.push(cur); cur=''; }
    if(genislik(ctx,kel[i],ls)>maxW){
      var p=tekKelimeBol(kel[i]);
      for(var j=0;j<p.length-1;j++) satirlar.push(p[j]);
      cur=p[p.length-1];
    } else cur=kel[i];
  }
  if(cur) satirlar.push(cur);
  return satirlar;
}

/* metni maxSatir'a sığana kadar küçültür → {boy, satirlar, yukseklik} */
function olc(ctx,metin,o){
  var boy=o.boy, min=o.min||o.boy, adim=o.adim||2, ls=o.ls||0, satirlar=[];
  while(true){
    ctx.font=o.font(boy);
    satirlar=sar(ctx,metin,o.maxW,ls);
    if(satirlar.length<=o.maxSatir || boy<=min) break;
    boy-=adim;
  }
  var sy=Math.round(boy*(o.satirYuk||1.3));
  return {boy:boy, satirlar:satirlar, satirYuk:sy, yukseklik:satirlar.length*sy};
}

/* ölçülmüş bloğu çizer, kapladığı yüksekliği döndürür */
function blokCiz(ctx,ol,o,y){
  ctx.font=o.font(ol.boy);
  ctx.fillStyle=o.renk;
  ctx.textAlign='center'; ctx.textBaseline='top';
  var ust=Math.round((ol.satirYuk-ol.boy*1.0)/2); /* satır kutusu içinde dikey nefes */
  for(var i=0;i<ol.satirlar.length;i++){
    satirYaz(ctx,ol.satirlar[i],W/2,y+i*ol.satirYuk+ust*0.35,o.ls||0);
  }
  return ol.yukseklik;
}

function yuvarlakDikdortgen(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

/* ───────────────── yazı tipleri hazır olmadan çizme ───────────────── */
function fontlariBekle(){
  if(!document.fonts) return Promise.resolve();
  var ornek='Sorbi ĞÜŞİÖÇ ığşiöç 0123';
  var istek=[
    '700 92px "Space Grotesk"','600 40px "Space Grotesk"','italic 500 42px "Space Grotesk"',
    'italic 400 40px "Inter"','400 34px "Inter"','500 26px "Inter"'
  ];
  var isler=istek.map(function(f){
    try{ return document.fonts.load(f,ornek); }catch(e){ return Promise.resolve(); }
  });
  return Promise.all(isler.map(function(p){ return Promise.resolve(p).catch(function(){}); }))
    .then(function(){ return document.fonts.ready; })
    .catch(function(){});
}

/* ───────────────────────── SVG → canvas ───────────────────────── */
/* SorbiChart.muhur çıktısı width="100%" + style taşır; görsel olarak
   yüklenirken içsel boyutu belirsiz kalır. Kök etiketi px'e sabitliyoruz.
   textPath/use için xlink:href yedeği ekliyoruz (eski motorlar). */
function svgHazirla(svg,px){
  var s=String(svg||'');
  s=s.replace(/^[\s\S]*?<svg\b([^>]*)>/i,function(m,attr){
    attr=attr.replace(/\s(?:width|height|style)\s*=\s*(?:"[^"]*"|'[^']*')/gi,'');
    if(!/xmlns\s*=/i.test(attr)) attr+=' xmlns="http://www.w3.org/2000/svg"';
    if(!/xmlns:xlink\s*=/i.test(attr)) attr+=' xmlns:xlink="http://www.w3.org/1999/xlink"';
    return '<svg'+attr+' width="'+px+'" height="'+px+'">';
  });
  s=s.replace(/<(textPath|use)\b([^>]*?)\shref="([^"]*)"/gi,function(m,tag,onc,val){
    if(/xlink:href/i.test(onc)) return m;
    return '<'+tag+onc+' href="'+val+'" xlink:href="'+val+'"';
  });
  return s;
}

/* data: URL — köken temiz, canvas'ı KİRLETMEZ (toBlob/toDataURL çalışır).
   blob: URL de temiz olurdu ama bazı gömülü webview'larda CSP blob: engelliyor
   ve revoke zamanlaması yarış yaratıyor; data: URL'de o riskler yok. */
function svgYukle(s,px){
  return new Promise(function(coz,hata){
    var img=new Image();
    img.onload=function(){ coz(img); };
    img.onerror=function(){ hata(new Error('Mühür SVG yüklenemedi')); };
    try{ img.decoding='sync'; }catch(e){}
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
  });
}

/* ───────────────────────── zemin ───────────────────────── */
function zeminCiz(ctx){
  ctx.fillStyle=C.bg;
  ctx.fillRect(0,0,W,H);
  /* radial-gradient(1100px 620px at 50% -6%, #10151d 0, #0B0F14 60%) — kart ölçeğinde */
  ctx.save();
  ctx.translate(W/2, -0.06*H);
  ctx.scale(1, 620/1100);
  var r=W*1.38;
  var g=ctx.createRadialGradient(0,0,0,0,0,r);
  g.addColorStop(0,   '#10151d');
  g.addColorStop(0.6, C.bg);
  g.addColorStop(1,   C.bg);
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

/* ───────────────────────── ana çizim ───────────────────────── */
function ciz(ctx,v,muhurImg){
  zeminCiz(ctx);
  ctx.textAlign='center'; ctx.textBaseline='top';

  /* 1 — SORBİ damgası */
  var damga=trBuyuk(v.damga||'Sorbi');
  ctx.font='500 26px '+F_GOV;
  ctx.fillStyle=C.gold;
  var y=132;
  satirYaz(ctx,damga,W/2,y,11);
  y+=26+56;

  /* 2 — mühür adı */
  var oAd=olc(ctx,v.muhur||'',{
    font:function(b){ return '700 '+b+'px '+F_BAS; },
    boy:94, min:52, adim:3, maxW:GEN, maxSatir:2, satirYuk:1.14
  });
  y+=blokCiz(ctx,oAd,{font:function(b){return '700 '+b+'px '+F_BAS;},renk:C.goldBr},y);
  y+=26;

  /* 3 — altbaşlık (italik) */
  var oAlt=olc(ctx,v.altbaslik||'',{
    font:function(b){ return 'italic 400 '+b+'px '+F_GOV; },
    boy:42, min:28, adim:2, maxW:GEN-40, maxSatir:3, satirYuk:1.42
  });
  y+=blokCiz(ctx,oAlt,{font:function(b){return 'italic 400 '+b+'px '+F_GOV;},renk:C.mut},y);
  y+=52;

  /* 4 — nadirlik satırı: ince altın çerçeve içinde, dikkat çeken */
  if(v.nadirSatir){
    var oNad=olc(ctx,v.nadirSatir,{
      font:function(b){ return '600 '+b+'px '+F_BAS; },
      boy:40, min:26, adim:2, maxW:GEN-130, maxSatir:1, satirYuk:1.34, ls:0.4
    });
    ctx.font='600 '+oNad.boy+'px '+F_BAS;
    var enGenis=0;
    oNad.satirlar.forEach(function(s){ enGenis=Math.max(enGenis,genislik(ctx,s,0.4)); });
    var kw=Math.min(GEN, enGenis+96), kh=oNad.yukseklik+44;
    ctx.save();
    ctx.fillStyle='rgba(223,169,143,.05)';
    ctx.strokeStyle='rgba(223,169,143,.30)';
    ctx.lineWidth=1.5;
    yuvarlakDikdortgen(ctx,(W-kw)/2,y,kw,kh,kh/2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    blokCiz(ctx,oNad,{font:function(b){return '600 '+b+'px '+F_BAS;},renk:C.gold,ls:0.4},y+22);
    y+=kh+34;
  }

  /* 5 — üçlü metni */
  if(v.ucluMetin){
    var oUc=olc(ctx,v.ucluMetin,{
      font:function(b){ return '400 '+b+'px '+F_SEM; },
      boy:36, min:26, adim:2, maxW:GEN, maxSatir:2, satirYuk:1.36, ls:1.2
    });
    y+=blokCiz(ctx,oUc,{font:function(b){return '400 '+b+'px '+F_SEM;},renk:C.ink,ls:1.2},y);
  }
  var ustSon=y;

  /* 7 — alt blok (önce ölç: mühre kalan yeri bilelim) */
  var urlBoy=30, sorBoy=44;
  var urlSat=Math.round(urlBoy*1.3), sorSat=Math.round(sorBoy*1.3);
  var altYuk=urlSat+16+sorSat;
  var altUst=H-104-altYuk;

  /* 6 — mühür: üst blokla alt blok arasına ortalanır */
  if(muhurImg){
    var bosluk=altUst-ustSon;
    var boyut=Math.max(320, Math.min(680, bosluk-40, GEN));
    var mx=(W-boyut)/2, my=ustSon+(bosluk-boyut)/2;
    ctx.drawImage(muhurImg,mx,my,boyut,boyut);
  }

  /* alt blok çizimi */
  ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.font='500 '+urlBoy+'px '+F_GOV;
  ctx.fillStyle=C.dim;
  satirYaz(ctx,v.url||'sorbiapp.com/seni-taniyorum',W/2,altUst,2.4);

  ctx.font='italic 500 '+sorBoy+'px '+F_BAS;
  ctx.fillStyle=C.goldBr;
  satirYaz(ctx,v.soru||'Sen kaçta birsin?',W/2,altUst+urlSat+16,0);
}

/* ───────────────────────── API ───────────────────────── */
function uret(veri){
  var v=veri||{};
  var px=680;
  return Promise.all([
    fontlariBekle(),
    v.svg ? svgYukle(svgHazirla(v.svg,px),px).catch(function(e){ console.warn('[SorbiKart]',e); return null; }) : Promise.resolve(null)
  ]).then(function(sonuc){
    var img=sonuc[1];
    var cv=document.createElement('canvas');
    cv.width=W; cv.height=H;                 /* devicePixelRatio'ya dokunmuyoruz */
    var ctx=cv.getContext('2d');
    ctx.imageSmoothingEnabled=true;
    if(ctx.imageSmoothingQuality) ctx.imageSmoothingQuality='high';
    ciz(ctx,v,img);
    var dataUrl=cv.toDataURL('image/png');   /* kirlenmiş olsaydı burada patlardı */
    return new Promise(function(coz,hata){
      if(!cv.toBlob){ hata(new Error('toBlob desteklenmiyor')); return; }
      cv.toBlob(function(b){
        if(b) coz({blob:b, dataUrl:dataUrl, genislik:W, yukseklik:H});
        else hata(new Error('PNG üretilemedi'));
      },'image/png');
    });
  });
}

function indir(veri,dosyaAdi){
  return uret(veri).then(function(r){
    var url=URL.createObjectURL(r.blob);
    var a=document.createElement('a');
    a.href=url;
    a.download=dosyaAdi||'sorbi-muhur.png';
    a.rel='noopener';
    a.style.cssText='position:fixed;left:-9999px;opacity:0';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      try{ a.parentNode && a.parentNode.removeChild(a); }catch(e){}
      try{ URL.revokeObjectURL(url); }catch(e){}
    },2000);
    return true;
  }).catch(function(e){
    console.error('[SorbiKart] kart üretilemedi:',e);
    return false;
  });
}

window.SorbiKart={ uret:uret, indir:indir, GENISLIK:W, YUKSEKLIK:H };

})();
