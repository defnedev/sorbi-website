/*! sorbi-kart.js — Sorbi paylaşım kartı üreteci
 *  window.SorbiKart.uret(veri)  -> Promise<{blob, dataUrl, genislik, yukseklik}>
 *  window.SorbiKart.indir(veri, dosyaAdi) -> Promise<boolean>
 *
 *  veri = { tur, ... }  tur: sayi | muhur | yerlesim | uclu | liste
 *  muhur icin: { muhur, altbaslik, ucluMetin, nadirSatir, svg, url, kaynak }
 *  liste icin: { ustEt, buyuk, alt, satirlar:[{ad,oran}], dipnot, imza }
 *  Sunucu yok, bağımlılık yok. Çıktı her zaman tam 1080×1920 PNG.
 */
(function(){
"use strict";

var W = 1080, H = 1920;

/* seni-taniyorum.html :root ile birebir */
var C = {
  bg:'#0B0810', isik:'#0B0810',
  gold:'#E3A692', goldBr:'#F2EFE9',
  ink:'#F2EFE9', mut:'#A5A3AE', dim:'#868494'
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
  /* radial-gradient(1100px 620px at 50% -6%, #0B0810 0, #0B0810 60%) — kart ölçeğinde */
  ctx.save();
  ctx.translate(W/2, -0.06*H);
  ctx.scale(1, 620/1100);
  var r=W*1.38;
  var g=ctx.createRadialGradient(0,0,0,0,0,r);
  g.addColorStop(0,   '#0B0810');
  g.addColorStop(0.6, C.bg);
  g.addColorStop(1,   C.bg);
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

/* ───────────────────────── ana çizim ───────────────────────── */
function cizMuhur(ctx,v,muhurImg){
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
    ctx.fillStyle='rgba(242,239,233,.05)';
    ctx.strokeStyle='rgba(242,239,233,.30)';
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

/* ───────────────── ortak parçalar (tüm kart tipleri) ───────────────── */

/* üst damga: "SORBİ · SENİN ANIN" — çizer, bittiği y'yi döndürür */
function damgaCiz(ctx,v){
  ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.font='500 26px '+F_GOV;
  ctx.fillStyle=C.gold;
  satirYaz(ctx,trBuyuk(v.damga||'Sorbi'),W/2,132,11);
  return 132+26;
}

/* alt blok: site adresi + soru. Bloğun ÜST y'sini döndürür (üstte kalan yer hesabı için) */
function altBlokCiz(ctx,v){
  var urlBoy=30, sorBoy=44, kayBoy=24;
  var urlSat=Math.round(urlBoy*1.3), sorSat=Math.round(sorBoy*1.3);
  var kaySat=v.kaynak?Math.round(kayBoy*1.4)+14:0;
  var altUst=H-104-(kaySat+urlSat+16+sorSat);
  ctx.textAlign='center'; ctx.textBaseline='top';
  /* kaynak: karttaki sayinin hangi ornekleme dayandigi. Kart siteden
     kopup gittigi icin sehadeti yaninda tasimasi gerekiyor. */
  if(v.kaynak){
    ctx.font='400 '+kayBoy+'px '+F_GOV;
    ctx.fillStyle='rgba(134,132,148,.72)';
    satirYaz(ctx,v.kaynak,W/2,altUst,1.2);
  }
  ctx.font='500 '+urlBoy+'px '+F_GOV;
  ctx.fillStyle=C.dim;
  satirYaz(ctx,v.url||'sorbiapp.com/seni-taniyorum',W/2,altUst+kaySat,2.4);
  ctx.font='italic 500 '+sorBoy+'px '+F_BAS;
  ctx.fillStyle=C.goldBr;
  satirYaz(ctx,v.soru||'Sen kaçta birsin?',W/2,altUst+kaySat+urlSat+16,0);
  return altUst;
}

/* küçük etiket satırı (HERKESTE OLMAYAN gibi) */
function etiketCiz(ctx,metin,y){
  ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.font='600 24px '+F_GOV;
  ctx.fillStyle=C.dim;
  satirYaz(ctx,trBuyuk(metin),W/2,y,8);
  return 24;
}

/* ince altın çizgi */
function cizgiCiz(ctx,y,gen){
  var g2=gen||300;
  var gr=ctx.createLinearGradient((W-g2)/2,0,(W+g2)/2,0);
  gr.addColorStop(0,'rgba(242,239,233,0)');
  gr.addColorStop(.5,'rgba(242,239,233,.55)');
  gr.addColorStop(1,'rgba(242,239,233,0)');
  ctx.fillStyle=gr;
  ctx.fillRect((W-g2)/2,y,g2,1.5);
  return 1.5;
}

/* metni altın hap içine alıp çizer, kapladığı yüksekliği döndürür */
function hapCiz(ctx,metin,y,o){
  var boy=o.boy||34, ls=o.ls||0.4, maxW=o.maxW||(GEN-160);
  var ol=olc(ctx,metin,{
    font:function(b){ return '600 '+b+'px '+F_BAS; },
    boy:boy, min:o.min||24, adim:2, maxW:maxW, maxSatir:o.maxSatir||1, satirYuk:1.34, ls:ls
  });
  ctx.font='600 '+ol.boy+'px '+F_BAS;
  var enGenis=0;
  ol.satirlar.forEach(function(s){ enGenis=Math.max(enGenis,genislik(ctx,s,ls)); });
  var kw=Math.min(GEN, enGenis+84), kh=ol.yukseklik+40;
  ctx.save();
  ctx.fillStyle='rgba(242,239,233,.05)';
  ctx.strokeStyle='rgba(242,239,233,.30)';
  ctx.lineWidth=1.5;
  yuvarlakDikdortgen(ctx,(W-kw)/2,y,kw,kh,kh/2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
  blokCiz(ctx,ol,{font:function(b){return '600 '+b+'px '+F_BAS;},renk:C.gold,ls:ls},y+20);
  return kh;
}

/* ───────────────── TİP: sayi — "kaçta bir" kancası ───────────────── */
function cizSayi(ctx,v){
  zeminCiz(ctx);
  var ustSon=damgaCiz(ctx,v);
  var altUst=altBlokCiz(ctx,v);

  /* ortada duracak blok: etiket + dev sayı + "kişide bir" + çizgi + üçlü + dilim */
  var parcalar=[];

  parcalar.push({tip:'etiket', metin:v.etiket||'Bu üçlü', h:24, bosluk:34});

  var oSayi=olc(ctx,String(v.sayi||''),{
    font:function(b){ return '700 '+b+'px '+F_BAS; },
    boy:196, min:96, adim:6, maxW:GEN, maxSatir:1, satirYuk:1.06
  });
  parcalar.push({tip:'sayi', ol:oSayi, h:oSayi.yukseklik, bosluk:6});

  var oBirim=olc(ctx,v.birim||'kişide bir',{
    font:function(b){ return 'italic 400 '+b+'px '+F_GOV; },
    boy:48, min:32, adim:2, maxW:GEN, maxSatir:2, satirYuk:1.34
  });
  parcalar.push({tip:'birim', ol:oBirim, h:oBirim.yukseklik, bosluk:54});

  parcalar.push({tip:'cizgi', h:2, bosluk:48});

  var oUc=null;
  if(v.ucluMetin){
    oUc=olc(ctx,v.ucluMetin,{
      font:function(b){ return '400 '+b+'px '+F_SEM; },
      boy:40, min:28, adim:2, maxW:GEN, maxSatir:2, satirYuk:1.38, ls:1.2
    });
    parcalar.push({tip:'uclu', ol:oUc, h:oUc.yukseklik, bosluk:26});
  }

  var oDilim=null;
  if(v.dilim){
    oDilim=olc(ctx,v.dilim,{
      font:function(b){ return '400 '+b+'px '+F_GOV; },
      boy:31, min:24, adim:1, maxW:GEN-60, maxSatir:3, satirYuk:1.5
    });
    parcalar.push({tip:'dilim', ol:oDilim, h:oDilim.yukseklik, bosluk:0});
  }

  var toplam=0;
  parcalar.forEach(function(p,i){ toplam+=p.h+(i<parcalar.length-1?p.bosluk:0); });
  var y=ustSon+Math.max(70,((altUst-ustSon)-toplam)/2);

  parcalar.forEach(function(p){
    if(p.tip==='etiket')      etiketCiz(ctx,p.metin,y);
    else if(p.tip==='sayi')   blokCiz(ctx,p.ol,{font:function(b){return '700 '+b+'px '+F_BAS;},renk:C.goldBr},y);
    else if(p.tip==='birim')  blokCiz(ctx,p.ol,{font:function(b){return 'italic 400 '+b+'px '+F_GOV;},renk:C.mut},y);
    else if(p.tip==='cizgi')  cizgiCiz(ctx,y,300);
    else if(p.tip==='uclu')   blokCiz(ctx,p.ol,{font:function(b){return '400 '+b+'px '+F_SEM;},renk:C.ink,ls:1.2},y);
    else if(p.tip==='dilim')  blokCiz(ctx,p.ol,{font:function(b){return '400 '+b+'px '+F_GOV;},renk:C.dim},y);
    y+=p.h+p.bosluk;
  });
}

/* ───────────────── TİP: yerlesim — "herkeste olmayan" ───────────────── */
function cizYerlesim(ctx,v){
  zeminCiz(ctx);
  var ustSon=damgaCiz(ctx,v);
  var altUst=altBlokCiz(ctx,v);

  var parcalar=[];
  parcalar.push({tip:'etiket', metin:v.etiket||'Herkeste olmayan', h:24, bosluk:40});

  var oBas=olc(ctx,v.baslik||'',{
    font:function(b){ return '700 '+b+'px '+F_BAS; },
    boy:88, min:48, adim:3, maxW:GEN, maxSatir:2, satirYuk:1.14
  });
  parcalar.push({tip:'baslik', ol:oBas, h:oBas.yukseklik, bosluk:v.olcu?28:36});

  if(v.olcu) parcalar.push({tip:'olcu', metin:v.olcu, h:0, bosluk:44});

  if(v.metin){
    var oMet=olc(ctx,v.metin,{
      font:function(b){ return '400 '+b+'px '+F_GOV; },
      boy:42, min:30, adim:2, maxW:GEN-30, maxSatir:6, satirYuk:1.52
    });
    parcalar.push({tip:'metin', ol:oMet, h:oMet.yukseklik, bosluk:v.nadirSatir?48:0});
  }

  if(v.nadirSatir) parcalar.push({tip:'nadir', metin:v.nadirSatir, h:0, bosluk:0});

  /* hap yükseklikleri çizim anında belli; önce ölçelim */
  parcalar.forEach(function(p){
    if(p.tip==='olcu' || p.tip==='nadir'){
      var ol=olc(ctx,p.metin,{
        font:function(b){ return '600 '+b+'px '+F_BAS; },
        boy:34, min:24, adim:2, maxW:GEN-160, maxSatir:2, satirYuk:1.34, ls:0.4
      });
      p.h=ol.yukseklik+40;
    }
  });

  var toplam=0;
  parcalar.forEach(function(p,i){ toplam+=p.h+(i<parcalar.length-1?p.bosluk:0); });
  var y=ustSon+Math.max(70,((altUst-ustSon)-toplam)/2);

  parcalar.forEach(function(p){
    if(p.tip==='etiket')       etiketCiz(ctx,p.metin,y);
    else if(p.tip==='baslik')  blokCiz(ctx,p.ol,{font:function(b){return '700 '+b+'px '+F_BAS;},renk:C.goldBr},y);
    else if(p.tip==='metin')   blokCiz(ctx,p.ol,{font:function(b){return '400 '+b+'px '+F_GOV;},renk:C.mut},y);
    else if(p.tip==='olcu' || p.tip==='nadir') hapCiz(ctx,p.metin,y,{boy:34,maxSatir:2});
    y+=p.h+p.bosluk;
  });
}

/* ───────────────── TİP: uclu — ☉ ☽ ↑ sade kart ───────────────── */
function cizUclu(ctx,v){
  zeminCiz(ctx);
  var ustSon=damgaCiz(ctx,v);
  var altUst=altBlokCiz(ctx,v);

  var satirlar=(v.uclu||[]).filter(Boolean);
  var satirYuk=190, aralik=0;
  var blokYuk=satirlar.length*satirYuk;

  var oBas=null, basBosluk=0;
  if(v.baslik){
    oBas=olc(ctx,v.baslik,{
      font:function(b){ return 'italic 500 '+b+'px '+F_BAS; },
      boy:56, min:34, adim:2, maxW:GEN, maxSatir:2, satirYuk:1.3
    });
    basBosluk=56;
  }
  var toplam=blokYuk+(oBas?basBosluk+oBas.yukseklik:0);
  var y=ustSon+Math.max(70,((altUst-ustSon)-toplam)/2);

  satirlar.forEach(function(s,i){
    var cy=y+i*satirYuk;
    /* rol etiketi */
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.font='600 23px '+F_GOV;
    ctx.fillStyle=C.dim;
    satirYaz(ctx,trBuyuk(s.rol||''),W/2,cy,8);
    /* glif + burç */
    ctx.font='400 74px '+F_SEM;
    var gw=ctx.measureText(s.glif||'').width;
    ctx.font='700 74px '+F_BAS;
    var bw=genislik(ctx,s.burc||'',0.6);
    var ara=26, top=gw+ara+bw, sx=(W-top)/2;
    ctx.textAlign='left';
    ctx.font='400 74px '+F_SEM;
    ctx.fillStyle=C.gold;
    ctx.fillText(s.glif||'',sx,cy+44);
    ctx.font='700 74px '+F_BAS;
    ctx.fillStyle=C.ink;
    var eski=ctx.textAlign;
    if(LS_VAR){ harfAralik(ctx,0.6); ctx.fillText(s.burc||'',sx+gw+ara,cy+44); harfAralik(ctx,0); }
    else ctx.fillText(s.burc||'',sx+gw+ara,cy+44);
    ctx.textAlign=eski;
    if(i<satirlar.length-1) cizgiCiz(ctx,cy+satirYuk-34,200);
  });

  if(oBas){
    ctx.textAlign='center';
    blokCiz(ctx,oBas,{font:function(b){return 'italic 500 '+b+'px '+F_BAS;},renk:C.goldBr},y+blokYuk+basBosluk);
  }
}

/* ───────────────── TİP: liste — /nadirlik kartı ─────────────────
   nadirlik.html'in gönderdiği şema: {ustEt, buyuk, alt, satirlar:[{ad,oran}],
   dipnot, imza}. Bu şemayı okuyan bir çizer yoktu; kart damga + yanlış
   adres + soru'dan ibaret çıkıyordu. */
function cizListe(ctx,v){
  zeminCiz(ctx);
  var ustSon=damgaCiz(ctx,v);

  /* alt blok: imza + dipnot */
  var impBoy=28, dipBoy=24;
  var impSat=Math.round(impBoy*1.4), dipSat=v.dipnot?Math.round(dipBoy*1.4)+12:0;
  var altUst=H-116-(dipSat+impSat);
  ctx.textAlign='center'; ctx.textBaseline='top';
  if(v.dipnot){
    ctx.font='400 '+dipBoy+'px '+F_GOV;
    ctx.fillStyle='rgba(134,132,148,.72)';
    satirYaz(ctx,v.dipnot,W/2,altUst,1.2);
  }
  ctx.font='500 '+impBoy+'px '+F_GOV;
  ctx.fillStyle=C.dim;
  satirYaz(ctx,v.imza||'sorbiapp.com/nadirlik',W/2,altUst+dipSat,2.2);

  var sat=(v.satirlar||[]).filter(function(x){ return x && (x.ad||x.oran); });
  var satYuk=76;

  var oBuyuk=olc(ctx,String(v.buyuk||''),{
    font:function(b){ return '700 '+b+'px '+F_BAS; },
    boy:170, min:78, adim:5, maxW:GEN, maxSatir:2, satirYuk:1.06
  });
  var oAlt=v.alt?olc(ctx,v.alt,{
    font:function(b){ return 'italic 400 '+b+'px '+F_GOV; },
    boy:46, min:30, adim:2, maxW:GEN-20, maxSatir:3, satirYuk:1.38
  }):null;

  var toplam=24+34+oBuyuk.yukseklik+(oAlt?22+oAlt.yukseklik:0)+(sat.length?56+sat.length*satYuk:0);
  var y=ustSon+Math.max(70,((altUst-ustSon)-toplam)/2);

  etiketCiz(ctx,v.ustEt||'En nadir yanın',y);  y+=24+34;
  blokCiz(ctx,oBuyuk,{font:function(b){return '700 '+b+'px '+F_BAS;},renk:C.goldBr},y);
  y+=oBuyuk.yukseklik;
  if(oAlt){ y+=22; blokCiz(ctx,oAlt,{font:function(b){return 'italic 400 '+b+'px '+F_GOV;},renk:C.ink},y); y+=oAlt.yukseklik; }

  if(sat.length){
    y+=56;
    cizgiCiz(ctx,y-28,GEN);
    for(var i=0;i<sat.length;i++){
      var sy=y+i*satYuk;
      ctx.textBaseline='top';
      ctx.font='400 36px '+F_GOV;
      ctx.fillStyle=C.mut; ctx.textAlign='left';
      var ad=String(sat[i].ad||'');
      while(ctx.measureText(ad).width>GEN-260 && ad.length>4) ad=ad.slice(0,-2);
      ctx.fillText(ad,KENAR,sy);
      ctx.font='600 36px '+F_BAS;
      ctx.fillStyle=C.gold; ctx.textAlign='right';
      ctx.fillText(String(sat[i].oran||''),W-KENAR,sy);
      if(i<sat.length-1){
        ctx.fillStyle='rgba(242,239,233,.07)';
        ctx.fillRect(KENAR,sy+52,GEN,1);
      }
    }
    ctx.textAlign='center';
  }
}

var CIZERLER={muhur:cizMuhur, sayi:cizSayi, yerlesim:cizYerlesim, uclu:cizUclu, liste:cizListe};

/* ───────────────────────── API ───────────────────────── */
function uret(veri){
  var v=veri||{};
  var tur=(v.tur && CIZERLER[v.tur]) ? v.tur
        : (v.satirlar || v.ustEt) ? 'liste'      /* nadirlik.html'in semasi */
        : 'muhur';
  var svgGerek=(tur==='muhur') && !!v.svg;   /* mühür dışındaki tipler çarkı çizmez */
  var px=680;
  return Promise.all([
    fontlariBekle(),
    svgGerek ? svgYukle(svgHazirla(v.svg,px),px).catch(function(e){ console.warn('[SorbiKart]',e); return null; }) : Promise.resolve(null)
  ]).then(function(sonuc){
    var img=sonuc[1];
    var cv=document.createElement('canvas');
    cv.width=W; cv.height=H;                 /* devicePixelRatio'ya dokunmuyoruz */
    var ctx=cv.getContext('2d');
    ctx.imageSmoothingEnabled=true;
    if(ctx.imageSmoothingQuality) ctx.imageSmoothingQuality='high';
    CIZERLER[tur](ctx,v,img);
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

window.SorbiKart={ uret:uret, indir:indir, GENISLIK:W, YUKSEKLIK:H,
  TURLER:['sayi','muhur','yerlesim','uclu','liste'] };

})();
