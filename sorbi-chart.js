/*! sorbi-chart.js — Sorbi ortak harita çarkı
 *  window.SorbiChart.draw(inner, outer, opts) -> SVG string
 *  window.SorbiChart.adapt(legacyChart, opts) -> çizime hazır harita nesnesi
 *  Temalar: 'paper' (varsayılan) · 'night'
 */
(function(){
"use strict";
var RAD=Math.PI/180, DEG=180/Math.PI;
function norm(x){return ((x%360)+360)%360;}
var SGLYPH=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'];
function dms(l){
  l=norm(l); var s=Math.floor(l/30), g=l-s*30;
  var d=Math.floor(g), m=Math.floor((g-d)*60), sec=Math.round((((g-d)*60)-m)*60);
  if(sec===60){sec=0;m++;} if(m===60){m=0;d++;}
  return {s:s,d:d,m:m,sec:sec};
}
function pad2(n){ return String(n).padStart(2,'0'); }

/* ── eski sayfalardaki harita nesnesini çizime uyarlar ── */
var NAME2 = {
 'Güneş':['sun','☉︎',1], 'Ay':['moon','☽︎',1], 'Merkür':['mer','☿︎',1],
 'Venüs':['ven','♀︎',1], 'Mars':['mar','♂︎',1], 'Jüpiter':['jup','♃︎',1],
 'Satürn':['sat','♄︎',1], 'Uranüs':['ura','♅︎',1], 'Neptün':['nep','♆︎',1],
 'Plüton':['plu','♇︎',1], 'Chiron':['chi','⚷︎',0], 'Lilith':['lil','⚸︎',0],
 'K. Ay Düğümü':['nod','☊︎',0], 'G. Ay Düğümü':['sno','☋︎',0],
 'Kuzey Ay Düğümü':['nod','☊︎',0], 'Güney Ay Düğümü':['sno','☋︎',0],
 'Şans Noktası':['pof','⊗︎',0]
};
var ASPMAP = {
 'Kavuşum':{a:0,orb:8,cls:'a-maj',major:1},
 'Karşıt':{a:180,orb:8,cls:'a-hard',major:1},
 'Üçgen':{a:120,orb:7,cls:'a-soft',major:1},
 'Kare':{a:90,orb:7,cls:'a-hard',major:1},
 'Altmışlık':{a:60,orb:5,cls:'a-soft',major:1},
 'Yüzelli':{a:150,orb:3,cls:'a-min',major:0},
 'Otuzluk':{a:30,orb:2,cls:'a-min',major:0}
};
function adapt(ch,opts){
  opts=opts||{};
  var pls=(ch.pls||[]).map(function(p){
    var m=NAME2[p.n]||[String(p.n).toLowerCase(),(p.ab||'•'),0];
    return {k:p.k||m[0], n:p.n, g:p.g||m[1], maj:(p.maj!==undefined?p.maj:m[2]),
            lon:p.lon, rx:!!p.rx, house:p.house};
  });
  var byName={}; pls.forEach(function(p){ byName[p.n]=p; });
  var asps=(ch.asps||[]).map(function(x){
    if(x.as) return x;
    var A=ASPMAP[x.nm]; if(!A) return null;
    var pa=byName[x.a]||x.a, pb=byName[x.b]||x.b;
    if(!pa||!pb||!pa.lon===undefined) return null;
    return {a:pa,b:pb,as:{a:A.a,orb:A.orb,cls:A.cls,major:A.major,n:x.nm},
            abs:Math.abs(x.orb||0), app:null};
  }).filter(Boolean);
  var c=ch.c;
  if(!c||!c.length){ c=[0]; for(var i=1;i<=12;i++) c[i]=norm((ch.asc||0)+(i-1)*30); }
  return {asc:ch.asc||0, mc:ch.mc||norm((ch.asc||0)+270), c:c, pls:pls, asps:asps,
          o:{house:(opts.house||ch.house||'P')}};
}

var THEMES={
 paper:{
  bg:'#F7F2E8', ring:'rgba(24,28,38,.26)', ringSoft:'rgba(24,28,38,.14)',
  band:.13, tick:'rgba(24,28,38,.42)', tickMinor:'rgba(24,28,38,.17)',
  cusp:'rgba(24,28,38,.15)', angle:'#1B2130', angleLbl:'#1B2130',
  glyph:'#171C28', glyphB:'#1F5E58', deg:'rgba(23,28,40,.66)', degB:'rgba(31,94,88,.75)',
  rx:'#A8412A', hnum:'rgba(23,28,40,.34)', lead:'rgba(24,28,38,.22)',
  center:'#F7F2E8', centerTxt:'#1B2130', centerSub:'rgba(23,28,40,.55)', star:'#9A7A2A',
  el:['#B0442A','#4F6B3A','#A0801F','#2F6B86'],
  asp:{'a-maj':'rgba(28,34,48,.42)','a-hard':'rgba(163,79,56,.52)','a-soft':'rgba(31,94,88,.46)','a-min':'rgba(28,34,48,.2)'}
 },
 night:{
  bg:'#0B0F14', ring:'rgba(201,169,98,.5)', ringSoft:'rgba(201,169,98,.22)',
  band:.12, tick:'rgba(232,228,218,.45)', tickMinor:'rgba(232,228,218,.18)',
  cusp:'rgba(201,169,98,.26)', angle:'#F4E4BA', angleLbl:'#F4E4BA',
  glyph:'#F4E4BA', glyphB:'#8FD0C2', deg:'rgba(232,228,218,.7)', degB:'rgba(143,208,194,.8)',
  rx:'#D8825C', hnum:'rgba(169,163,150,.6)', lead:'rgba(201,169,98,.3)',
  center:'#0B0F14', centerTxt:'#F4E4BA', centerSub:'rgba(169,163,150,.75)', star:'#C9A962',
  el:['#C4634A','#7E9C63','#C9A962','#5E93A8'],
  asp:{'a-maj':'rgba(244,228,186,.5)','a-hard':'rgba(212,124,88,.55)','a-soft':'rgba(127,179,168,.5)','a-min':'rgba(169,163,150,.24)'}
 }
};
var THEME='paper';

function drawWheel(inner,outer,opt){
  opt=opt||{};
  var T=THEMES[opt.theme||THEME]||THEMES.paper;
  var S=900, cx=S/2, cy=S/2, o=[];

  var R = outer ? {
    zo:418, zi:376, tickIn:362,
    g1:344, d1:321,
    div:304,
    g2:286, d2:263,
    hOut:242, hNum:228, asp:212
  } : {
    zo:418, zi:376, tickIn:362,
    g1:344, d1:319,
    hOut:296, hNum:279, asp:262
  };

  var noH = !!opt.noHouses;
  var orient = noH ? 0 : (inner.o.house==='W' ? norm(Math.floor(inner.asc/30)*30) : norm(inner.asc));
  function P(lon,r){ var t=norm(lon-orient)*RAD; return [cx-r*Math.cos(t), cy+r*Math.sin(t)]; }
  function line(p1,p2,st,w,da,cap){ o.push('<line x1="'+p1[0].toFixed(2)+'" y1="'+p1[1].toFixed(2)+'" x2="'+p2[0].toFixed(2)+'" y2="'+p2[1].toFixed(2)+'" stroke="'+st+'" stroke-width="'+w+'"'+(da?' stroke-dasharray="'+da+'"':'')+(cap?' stroke-linecap="'+cap+'"':'')+'/>'); }
  function circ(r,st,w,f){ o.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+(f||'none')+'" stroke="'+(st||'none')+'" stroke-width="'+(w||1)+'"/>'); }
  function txt(x,y,s,fill,size,extra,fam,weight){
    o.push('<text x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" fill="'+fill+'" font-size="'+size+'" text-anchor="middle" dominant-baseline="central" font-family="'+(fam||"Inter,-apple-system,Helvetica,sans-serif")+'"'+(weight?' font-weight="'+weight+'"':'')+(extra||'')+'>'+s+'</text>');
  }
  function arc(r1,r2,a0,a1,fill,op){
    var q0=P(a0,r1), q1=P(a1,r1), q2=P(a1,r2), q3=P(a0,r2);
    o.push('<path d="M'+q0[0].toFixed(1)+' '+q0[1].toFixed(1)+
      ' A'+r1+' '+r1+' 0 0 0 '+q1[0].toFixed(1)+' '+q1[1].toFixed(1)+
      ' L'+q2[0].toFixed(1)+' '+q2[1].toFixed(1)+
      ' A'+r2+' '+r2+' 0 0 1 '+q3[0].toFixed(1)+' '+q3[1].toFixed(1)+' Z" fill="'+fill+'" opacity="'+op+'"/>');
  }

  o.push('<defs><radialGradient id="bgg" cx="50%" cy="46%" r="62%">'+
    '<stop offset="0%" stop-color="'+(T===THEMES.paper?'#FFFCF5':'#141A24')+'"/>'+
    '<stop offset="100%" stop-color="'+T.bg+'"/></radialGradient></defs>');
  o.push('<rect width="'+S+'" height="'+S+'" fill="'+T.bg+'"/>');
  circ(444,null,0,'url(#bgg)');

  /* ── burç kuşağı ── */
  for(var s=0;s<12;s++){
    var a0=s*30, col=T.el[s%4];
    arc(R.zo,R.zi,a0,a0+30,col,T.band);
    line(P(a0,R.zi),P(a0,R.zo),T.ring,1);
    var g=P(a0+15,(R.zo+R.zi)/2);
    txt(g[0],g[1],SGLYPH[s],col,25);
  }
  circ(R.zo,T.ring,1.3);
  circ(R.zi,T.ring,1.3);

  /* ── derece çentikleri ── */
  for(var dg=0;dg<360;dg++){
    var maj=(dg%10===0), mid=(dg%5===0);
    var len = maj?14:(mid?8:4);
    line(P(dg,R.zi),P(dg,R.zi-len), maj?T.tick:T.tickMinor, maj?1:.7);
  }
  circ(R.tickIn,T.ringSoft,.8);

  /* ── ev başlangıçları ── */
  var angs={1:'AC',4:'IC',7:'DC',10:'MC'};
  if(!noH) for(var h=1;h<=12;h++){
    var cu=inner.c[h], isAng=!!angs[h];
    line(P(cu,R.asp),P(cu,R.zi), isAng?T.angle:T.cusp, isAng?1.6:.85, isAng?null:'4,4');
    if(isAng){
      var tip=P(cu,R.zo+7), base1=P(cu-1.1,R.zo-1), base2=P(cu+1.1,R.zo-1);
      o.push('<path d="M'+tip[0].toFixed(1)+' '+tip[1].toFixed(1)+' L'+base1[0].toFixed(1)+' '+base1[1].toFixed(1)+
             ' L'+base2[0].toFixed(1)+' '+base2[1].toFixed(1)+' Z" fill="'+T.angle+'"/>');
      var lp=P(cu,R.zo+21);
      txt(lp[0],lp[1],angs[h],T.angleLbl,12.5,' letter-spacing="1.4"',null,600);
    }
    var nxt=inner.c[h===12?1:h+1], midA=norm(cu+norm(nxt-cu)/2);
    var np=P(midA,R.hNum);
    txt(np[0],np[1],String(h),T.hnum,13.5,null,'Playfair Display,Georgia,serif');
    var dp=P(cu+2.4,R.hOut-11), xx=dms(cu);
    txt(dp[0],dp[1],xx.d+'°'+pad2(xx.m)+"′",T.hnum,8.4);
  }
  if(!noH) circ(R.hOut,T.ringSoft,.9);
  circ(R.asp,T.ringSoft,1);
  if(outer) circ(R.div,T.ringSoft,.9);

  /* ── sect gölgesi: ufkun üstü / altı ── */
  if(opt.sectShade && !noH){
    var a1=P(inner.asc,R.zi), a2=P(norm(inner.asc+180),R.zi);
    /* ufkun ÜSTÜ: AC'den MC yönüne giden yarım daire */
    o.push('<path d="M'+a1[0].toFixed(1)+' '+a1[1].toFixed(1)+
      ' A'+R.zi+' '+R.zi+' 0 0 1 '+a2[0].toFixed(1)+' '+a2[1].toFixed(1)+' Z" fill="'+
      (T===THEMES.paper?'#C9A34A':'#C9A962')+'" opacity="'+(T===THEMES.paper?.075:.06)+'"/>');
    /* ufkun ALTI */
    o.push('<path d="M'+a1[0].toFixed(1)+' '+a1[1].toFixed(1)+
      ' A'+R.zi+' '+R.zi+' 0 0 0 '+a2[0].toFixed(1)+' '+a2[1].toFixed(1)+' Z" fill="'+
      (T===THEMES.paper?'#2F4B6B':'#5E93A8')+'" opacity="'+(T===THEMES.paper?.07:.07)+'"/>');
    /* ufuk çizgisi */
    line(a1,a2,T.angle,1.4,null,'round');
  }

  /* ── açı çizgileri: orba göre kalınlık ── */
  (opt.aspects||[]).forEach(function(x){
    if(x.a.k==='pof'||x.b.k==='pof') return;
    if(outer && !x.as.major) return;
    var tight=1-Math.min(1,x.abs/(x.as.orb*1.4));
    var w=x.as.major ? (.5+tight*.95) : (.38+tight*.4);
    var op=x.as.major ? (.38+tight*.48) : (.3+tight*.3);
    o.push('<line x1="'+P(x.a.lon,R.asp)[0].toFixed(1)+'" y1="'+P(x.a.lon,R.asp)[1].toFixed(1)+
      '" x2="'+P(x.b.lon,R.asp)[0].toFixed(1)+'" y2="'+P(x.b.lon,R.asp)[1].toFixed(1)+
      '" stroke="'+T.asp[x.as.cls]+'" stroke-width="'+w.toFixed(2)+'" opacity="'+op.toFixed(2)+'" stroke-linecap="round"'+
      (x.as.major?'':' stroke-dasharray="2.5,3.5"')+'/>');
  });

  /* ── gezegen halkası ── */
  function ring(list,rg,rd,tickFrom,col,degCol,gsz){ /* rd artık kullanılmıyor */
    var items=list.slice().sort(function(a,b){return norm(a.lon-orient)-norm(b.lon-orient);});
    var disp=items.map(function(p){return norm(p.lon-orient);});
    var MIN = outer?8.2:9.2;
    for(var it=0;it<300;it++){
      var moved=false;
      for(var i=0;i<disp.length;i++){
        var j=(i+1)%disp.length;
        var d=disp[j]-disp[i]; if(d<0) d+=360;
        if(d<MIN){ var push=(MIN-d)/2; disp[i]=norm(disp[i]-push); disp[j]=norm(disp[j]+push); moved=true; }
      }
      if(!moved) break;
    }
    items.forEach(function(p,i){
      var da=norm(disp[i]+orient);
      /* dereceye işaret + kırık kılavuz çizgi */
      line(P(p.lon,tickFrom),P(p.lon,tickFrom-9),col,1.2,null,'round');
      var k=P(p.lon,tickFrom-9), m=P(da,rg+17), e=P(da,rg+11);
      o.push('<path d="M'+k[0].toFixed(1)+' '+k[1].toFixed(1)+' L'+m[0].toFixed(1)+' '+m[1].toFixed(1)+
             ' L'+e[0].toFixed(1)+' '+e[1].toFixed(1)+'" fill="none" stroke="'+T.lead+'" stroke-width=".8"/>');
      var gp=P(da,rg);
      txt(gp[0],gp[1],p.g,p.rx?T.rx:col,gsz*(p.maj?1:.84));
      /* etiket: her zaman yatay, merkeze doğru kaydırılmış */
      var ux=(cx-gp[0]), uy=(cy-gp[1]), ul=Math.sqrt(ux*ux+uy*uy)||1;
      var off=outer?21:26;
      var x=dms(p.lon);
      var lbl=x.d+'°'+pad2(x.m)+"′"+(p.rx?'<tspan fill="'+T.rx+'" font-size="'+(outer?7.4:8.2)+'"> ℞</tspan>':'');
      txt(gp[0]+ux/ul*off, gp[1]+uy/ul*off, lbl, degCol, outer?8.6:9.6, null, null, 500);
    });
  }

  if(outer){
    ring(outer.pls,R.g1,R.d1,R.zi,T.glyphB,T.degB,19.5);
    ring(inner.pls,R.g2,R.d2,R.div,T.glyph,T.deg,19.5);
  } else {
    ring(inner.pls,R.g1,R.d1,R.zi,T.glyph,T.deg,22);
  }

  /* ── merkez ── */
  circ(outer?74:86,T.ringSoft,1,T.center);
  txt(cx,cy-(opt.sub?16:8),'✦',T.star,16);
  var title=(opt.title||'Sorbi');
  txt(cx,cy+(opt.sub?4:12),title.length>22?title.slice(0,21)+'…':title,T.centerTxt,opt.sub?12.5:13.5,null,'Playfair Display,Georgia,serif',500);
  if(opt.sub) txt(cx,cy+22,opt.sub,T.centerSub,9.5);

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+S+' '+S+'" width="100%" style="max-width:100%;height:auto;border-radius:10px">'+o.join('')+'</svg>';
}


window.SorbiChart={
  THEMES:THEMES,
  draw:function(inner,outer,opts){ return drawWheel(inner,outer,opts||{}); },
  adapt:adapt,
  dms:dms
};
})();
