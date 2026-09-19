/*! sorbi-gosteri.js — paylaşılan canlı gösterim bileşeni. <div data-sorbi-gosteri="TIP" data-...>
 * API: SorbiGosteri.kur(kok) / .tipler / .ekle(tip,fn). Dış bağımlılık yok; açı kuralları SorbiAstro.ASPECTS'ten.
 * Tipler: zodyak-carki element-nitelik aci-gosterimi retro-dongusu uzaklik-grafigi yukselen-halkasi */
(function(){
'use strict';
var W=window,D=document,TIP={},no=0;
var M=Math,PI=M.PI,TAU=PI*2,rd=PI/180,mn=M.min,mx=M.max,cs=M.cos,sn=M.sin,fl=M.floor,ab=M.abs;
var C={bg:'#0F0B13',ln:'rgba(255,255,255,.10)',l2:'rgba(255,255,255,.20)',ink:'#F2EFE9',
mut:'#9BA0AB',dim:'#9BA0AB',gld:'#E3A692',gbr:'#F2D3B8',ter:'#C4744E',gun:'#F1DCA8',dun:'#7FB3A8'};
var S='Koç Boğa İkizler Yengeç Aslan Başak Terazi Akrep Yay Oğlak Kova Balık'.split(' ');
var SG='♈︎ ♉︎ ♊︎ ♋︎ ♌︎ ♍︎ ♎︎ ♏︎ ♐︎ ♑︎ ♒︎ ♓︎'.split(' ');
var EL='Ateş Toprak Hava Su'.split(' '),ELC=['#C75B39','#9E8B4E','#B58A5E','#5E8C86'];
var NT='Öncü Sabit Değişken'.split(' ');
var YON='Mars Venüs Merkür Ay Güneş Merkür Venüs Mars Jüpiter Satürn Satürn Jüpiter'.split(' ');
var YMO={7:'Plüton',10:'Uranüs',11:'Neptün'};
var AZ=!!(W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches);
var CSS='.sbg{background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1rem;margin:1.2rem 0}'
+'.sbg canvas{width:100%;height:auto;display:block;border-radius:10px;background:#0F0B13}'
+'.sbg-k{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-top:.8rem}'
+'.sbg-b{font:inherit;font-size:.84rem;font-weight:600;color:#180F14;background:#F2D3B8;border:0;border-radius:10px;padding:0 1rem;min-height:40px;cursor:pointer}'
+'.sbg-b:hover{background:#E3A692}'
+'.sbg-b.sbg-i{background:transparent;color:#9BA0AB;border:1px solid rgba(255,255,255,.14);font-weight:500}'
+'.sbg-b.sbg-i:hover{background:rgba(255,255,255,.06);color:#F2EFE9}'
+'.sbg-s{flex:1 1 140px;min-width:110px;min-height:40px;accent-color:#E3A692;background:transparent}'
+'.sbg-o{font-family:ui-monospace,Menlo,monospace;font-size:.78rem;color:#9BA0AB;font-variant-numeric:tabular-nums}'
+'.sbg-o b{color:#F2D3B8;font-weight:600}'
+'.sbg-l{font-size:.76rem;color:#9BA0AB;white-space:nowrap}'
+'.sbg-p{display:flex;gap:.5rem;align-items:center;flex:1 1 180px;min-width:0}'
+'.sbg-p .sbg-s{flex:1 1 60px;min-width:60px}'
+'.sbg-e{display:inline-block;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;border:1px solid currentColor;border-radius:99px;padding:.08rem .45rem;color:#9BA0AB}'
+'.sbg-e.g{color:#C4744E}'
+'.sbg-z{font-size:.86rem;font-weight:300;color:#9BA0AB;line-height:1.65;margin-top:.8rem;padding-top:.8rem;border-top:1px solid rgba(255,255,255,.08);max-width:74ch}'
+'.sbg-z b{color:#F2EFE9;font-weight:500}.sbg-z i{font-style:normal;color:#F2D3B8}'
+'.sbg :focus-visible{outline:2px solid #F2D3B8;outline-offset:2px;border-radius:8px}'
+'@media(max-width:560px){.sbg-k>.sbg-s,.sbg-p{flex-basis:100%}.sbg-o{overflow-wrap:anywhere}}';

/* ── ortak çizim ── */
function zm(o,G,Y){o.fillStyle=C.bg;o.fillRect(0,0,G,Y);}
function yz(o,m,x,y,b,r,h){o.fillStyle=r||C.mut;o.font=(b||'11px')+' ui-monospace,Menlo,monospace';
o.textAlign=h||'left';o.textBaseline='middle';o.fillText(m,x,y);}
function dt(o,x,y,r,c){o.fillStyle=c;o.beginPath();o.arc(x,y,r,0,TAU);o.fill();}
function cz(o,x0,y0,x1,y1,c,w){o.strokeStyle=c;o.lineWidth=w||1;o.beginPath();
o.moveTo(x0,y0);o.lineTo(x1,y1);o.stroke();}
function pl(o,n,X,Y,c,w,f){o.strokeStyle=c;o.lineWidth=w;o.beginPath();
for(var i=0,b=1;i<n;i++){if(f&&!f(i)){b=1;continue;}b?o.moveTo(X(i),Y(i)):o.lineTo(X(i),Y(i));b=0;}
o.stroke();}
function dlm(o,cx,cy,R,ic,a0,a1){o.beginPath();o.arc(cx,cy,R,a0,a1);o.arc(cx,cy,ic,a1,a0,true);o.closePath();}
function nrm(x){return ((x%360)+360)%360;}
function ayr(a,b){var A=W.SorbiAstro;if(A&&A.sep)return A.sep(a,b);
var d=nrm(a-b);return d>180?360-d:d;}
function sinif(s){var A=W.SorbiAstro,T=A&&A.ASPECTS?A.ASPECTS.filter(function(x){return x.major;})
:[{a:0,n:'Kavuşum',orb:8},{a:180,n:'Karşıt',orb:8},{a:120,n:'Üçgen',orb:7},{a:90,n:'Kare',orb:7},{a:60,n:'Altmışlık',orb:5}];
var e=null;T.forEach(function(q){var f=ab(s-q.a);if(f<=q.orb&&(!e||f<e.f))e={A:q,f:f};});return e;}
function grup(b,n){return S.filter(function(_,i){return i%n===b%n;}).join(', ');}
function bno(v){var i=S.indexOf(v);if(i<0)i=parseInt(v,10);return isFinite(i)?((i%12)+12)%12:0;}
function sa(d){return ('0'+(d/60|0)).slice(-2)+':'+('0'+d%60).slice(-2);}
function bos(o,G,Y){zm(o,G,Y);yz(o,'Veri yüklenemedi',G/2,Y/2,'12px',C.dim,'center');}
/* 12 burçluk halka: element rengi + nitelik çentiği (1 öncü, 2 sabit, 3 değişken) */
function halka(o,cx,cy,R,ic,v,sade){
for(var b=0,t,a;b<12;b++){
 var a0=(b*30-90)*rd,a1=a0+PI/6,se=b===v,am=a0+PI/12;
 dlm(o,cx,cy,R,ic,a0,a1);
 if(sade){o.fillStyle=b%2?'rgba(255,255,255,.028)':'rgba(255,255,255,.055)';o.fill();}
 else{o.globalAlpha=se?.42:.16;o.fillStyle=ELC[b%4];o.fill();o.globalAlpha=1;}
 o.strokeStyle=se?C.gbr:C.ln;o.lineWidth=se?1.6:1;o.stroke();
 yz(o,SG[b],cx+cs(am)*(R+ic)/2,cy+sn(am)*(R+ic)/2,se?'15px':(sade?'13px':'12px'),
  se?C.gbr:(sade?C.dim:C.mut),'center');
 if(sade)continue;
 for(t=0;t<=b%3;t++){a=am+(t-(b%3)/2)*.12;
  cz(o,cx+cs(a)*(R-3),cy+sn(a)*(R-3),cx+cs(a)*(R+3),cy+sn(a)*(R+3),se?C.gbr:C.l2,1.4);}
}}

/* ── 1 · zodyak çarkı ── */
TIP['zodyak-carki']=function(d){var b0=bno(d.burc);
return{etiket:'Zodyak çarkı: on iki burç dilimi, element renkleri, nitelik çentikleri.',
en:1000,boy:function(G){return G<520?.9:.55;},adet:12,hiz:1100,kare:b0,durak:b0,
kay:[{ad:'k',min:0,max:11,etiket:'Burç seç'}],
ciz:function(c){var o=c.o,G=c.G,Y=c.Y,b=c.k%12;zm(o,G,Y);
 var cx=G/2,cy=Y/2,R=mn(G,Y)/2-14,ic=R-mx(24,R*.16);
 halka(o,cx,cy,R,ic,b);
 var g=ic>140;
 yz(o,SG[b],cx,cy-(g?46:30),g?'28px':'22px',C.gbr,'center');
 yz(o,S[b],cx,cy-(g?14:8),g?'17px':'14px',C.ink,'center');
 yz(o,EL[b%4]+' · '+NT[b%3],cx,cy+(g?10:12),g?'12px':'10px',C.ink,'center');
 yz(o,'yön. '+YON[b],cx,cy+(g?32:30),'11px',C.gbr,'center');
 if(g)yz(o,'çentik: 1 öncü · 2 sabit · 3 değişken',cx,cy+56,'10px',C.dim,'center');
},
metin:function(c){var b=c.k%12;
 return{o:SG[b]+' <b>'+S[b]+'</b> · '+EL[b%4]+' · '+NT[b%3],
 z:'<b>'+S[b]+'</b> '+b*30+'°–'+(b*30+30)+'° · <i>'+EL[b%4]+'</i> elementi, <i>'+NT[b%3]
 +'</i> niteliği · yöneticisi '+YON[b]+(YMO[b]?' (modern: '+YMO[b]+')':'')
 +'. Aynı element: '+grup(b,4)+'. Aynı nitelik: '+grup(b,3)+'.'};
}};};

/* ── 2 · element × nitelik ızgarası ── */
TIP['element-nitelik']=function(d){var b0=bno(d.burc);
return{etiket:'Element × nitelik ızgarası: dört element, üç nitelik.',
en:1000,boy:function(G){return G<520?.86:.5;},adet:12,hiz:1100,kare:b0,durak:b0,
kay:[{ad:'k',min:0,max:11,etiket:'Burç seç'}],
ciz:function(c){var o=c.o,G=c.G,Y=c.Y,b=c.k%12,e,m;zm(o,G,Y);
 var sl=mn(76,G*.2),us=mn(40,Y*.13),gw=(G-sl-14)/3,gh=(Y-us-16)/4;
 for(m=0;m<3;m++)yz(o,NT[m],sl+gw*(m+.5),us-14,'11px',C.mut,'center');
 for(e=0;e<4;e++){o.fillStyle=ELC[e];o.fillRect(sl-12,us+gh*(e+.5)-4,8,8);
  yz(o,EL[e],sl-18,us+gh*(e+.5),'11px',C.mut,'right');
  for(m=0;m<3;m++){
   var i=(9*e+4*m)%12,x=sl+gw*m+3,y=us+gh*e+3,w=gw-6,h=gh-6,se=i===b;
   o.globalAlpha=se?.4:.13;o.fillStyle=ELC[e];o.beginPath();o.rect(x,y,w,h);o.fill();o.globalAlpha=1;
   o.strokeStyle=se?C.gbr:C.ln;o.lineWidth=se?1.6:1;o.stroke();
   yz(o,SG[i],x+w/2,y+h/2-(h>44?9:0),se?'16px':'13px',se?C.gbr:C.mut,'center');
   if(h>44)yz(o,S[i],x+w/2,y+h/2+11,'10px',se?C.ink:C.dim,'center');
}}},
metin:function(c){var b=c.k%12;
 return{o:SG[b]+' <b>'+S[b]+'</b> → '+EL[b%4]+' / '+NT[b%3],
 z:'Her element–nitelik kesişimine tek bir burç düşer. <b>'+S[b]+'</b> → <i>'+EL[b%4]
 +'</i> satırı, <i>'+NT[b%3]+'</i> kolonu. Satır: '+grup(b,4)+'. Kolon: '+grup(b,3)+'.'};
}};};

/* ── 3 · açı gösterimi (orb kuralları sorbi-astro.js'ten) ── */
TIP['aci-gosterimi']=function(d){var aA=d.a||'Mars',aB=d.b||'Venüs';
return{etiket:'Açı gösterimi: iki gezegen ve aralarındaki açı.',
en:1000,boy:function(G){return G<520?.9:.55;},adet:360,hiz:32,kare:150,durak:150,
kay:[{ad:'a',min:0,max:359,deger:+(d.aBoylam||30)||0,etiket:aA+' boylamı, derece',kisa:aA},
 {ad:'k',min:0,max:359,etiket:aB+' boylamı, derece',kisa:aB}],
ciz:function(c){var o=c.o,G=c.G,Y=c.Y,la=nrm(c.v.a),lb=nrm(c.k);zm(o,G,Y);
 var cx=G/2,cy=Y/2,R=mn(G,Y)/2-14,ic=R-mx(22,R*.15),s=ayr(la,lb),r=sinif(s),g=ic>140;
 halka(o,cx,cy,R,ic,-1);
 var d1=nrm(lb-la),yn=d1<=180?1:-1,uz=d1<=180?d1:360-d1;
 o.strokeStyle=r?'rgba(242,211,184,.8)':'rgba(155,160,171,.45)';o.lineWidth=2.5;
 o.beginPath();o.arc(cx,cy,ic*.82,(la-90)*rd,(la-90+yn*uz)*rd,yn<0);o.stroke();
 [[la,aA,C.gld],[lb,aB,C.dun]].forEach(function(q){
  var a=(q[0]-90)*rd,x=cx+cs(a)*(ic-8),y=cy+sn(a)*(ic-8);
  cz(o,cx+cs(a)*ic*.9,cy+sn(a)*ic*.9,x,y,q[2],1.5);dt(o,x,y,5,q[2]);
  yz(o,q[1],x-cs(a)*16,y-sn(a)*16,'10px',q[2],cs(a)<-.3?'left':'right');});
 yz(o,s.toFixed(1)+'°',cx,cy-(g?26:16),g?'26px':'20px',C.ink,'center');
 yz(o,r?r.A.n:'büyük açı yok',cx,cy+(g?6:8),g?'14px':'11px',r?C.gbr:C.mut,'center');
 if(r)yz(o,'orb '+r.f.toFixed(2)+'° / '+r.A.orb+'°',cx,cy+(g?28:26),'10px',C.dim,'center');
 if(g){yz(o,aA+' '+S[la/30|0]+' '+(la%30).toFixed(0)+'°',cx,cy+50,'10px',C.dim,'center');
  yz(o,aB+' '+S[lb/30|0]+' '+(lb%30).toFixed(0)+'°',cx,cy+66,'10px',C.dim,'center');}
},
metin:function(c){var la=nrm(c.v.a),lb=nrm(c.k),s=ayr(la,lb),r=sinif(s);
 return{o:'<b>'+s.toFixed(1)+'°</b> · '+(r?r.A.n:'büyük açı yok'),
 z:aA+' '+la.toFixed(0)+'° ('+S[la/30|0]+'), '+aB+' '+lb.toFixed(0)+'° ('+S[lb/30|0]
 +'). Ayrım <b>'+s.toFixed(2)+'°</b>. '+(r?'<i>'+r.A.n+'</i> '+r.A.a+'°, orb '+r.f.toFixed(2)
 +'° — sınır '+r.A.orb+'°.':'Hiçbir büyük açının orb sınırında değil.')
 +' Orb tam açıdan sapmadır; sapma büyüdükçe açı zayıflar.'};
}};};

/* ── 4 · retro döngüsü (data-kaynak) ── */
TIP['retro-dongusu']=function(d){
return{etiket:'Merkür retrosu: yörüngeler ve burçlar kuşağındaki iz.',
en:1200,boy:.4667,hiz:110,kare:+(d.kare||50),kay:[{ad:'k',min:0,max:1,etiket:'Gün'}],
hazir:function(v){var n=((v||{}).kareler||[]).length;this.adet=n;this.durak=n-1;
 this.kay[0].max=mx(1,n-1);},
ciz:function(c){var o=c.o,G=c.G,Y=c.Y,K=(c.veri||{}).kareler;
 if(!K||!K.length)return bos(o,G,Y);
 zm(o,G,Y);var k=K[mn(c.k,K.length-1)];
 var sG=mn(G*.46,Y*.95),cx=sG/2+12,cy=Y/2,br=mn(sG,Y)/2-26,AU=br/1.15;
 o.strokeStyle=C.ln;o.lineWidth=1;
 [.387,1].forEach(function(a){o.beginPath();o.arc(cx,cy,a*AU,0,TAU);o.stroke();});
 dt(o,cx,cy,6,C.gun);yz(o,'Güneş',cx,cy+18,'10px',C.dim,'center');
 var px=cx+k.mx*AU,py=cy-k.my*AU,ex=cx+k.ex*AU,ey=cy-k.ey*AU;
 var dx=px-ex,dy=py-ey,u=M.hypot(dx,dy)||1;
 o.setLineDash([3,3]);
 cz(o,ex,ey,ex+dx/u*br*2.2,ey+dy/u*br*2.2,k.geri?'rgba(196,116,78,.55)':'rgba(227,166,146,.4)',1);
 o.setLineDash([]);
 dt(o,ex,ey,5,C.dun);yz(o,'Dünya',ex,ey-14,'10px',C.dun,'center');
 dt(o,px,py,4.5,k.geri?C.ter:C.gld);
 yz(o,'Merkür',px,py-13,'10px',k.geri?C.ter:C.gld,'center');
 var sx=sG+34,sg=G-sx-14,sy=28,sh=Y-70;if(sg<=60)return;
 var L=K.map(function(x){return x.lon;}),m0=mn.apply(null,L)-6,m1=mx.apply(null,L)+6;
 var X=function(i){return sx+(K[i].lon-m0)/(m1-m0)*sg;},Yg=function(i){return sy+i/(K.length-1)*sh;};
 for(var b=fl(m0/30);b<=fl(m1/30);b++){
  var x0=mx(sx,sx+(b*30-m0)/(m1-m0)*sg),x1=mn(sx+(b*30+30-m0)/(m1-m0)*sg,sx+sg);
  if(b%2===0){o.fillStyle='rgba(255,255,255,.022)';o.fillRect(x0,sy,x1-x0,sh);}
  var ot=(x0+x1)/2,j=((b%12)+12)%12;
  if(ot>sx&&ot<sx+sg)yz(o,SG[j]+' '+S[j],ot,sy-12,'10px',C.dim,'center');}
 pl(o,K.length,X,Yg,'rgba(227,166,146,.28)',2);
 pl(o,K.length,X,Yg,C.ter,2.5,function(i){return K[i].geri;});
 dt(o,X(mn(c.k,K.length-1)),Yg(c.k),4.5,k.geri?C.ter:C.gbr);
 cz(o,sx,Yg(c.k),sx+sg,Yg(c.k),k.geri?'rgba(196,116,78,.3)':'rgba(242,211,184,.25)',1);
 yz(o,'zaman ↓',sx-4,sy+sh/2,'10px',C.dim,'right');
 yz(o,'Dünya’dan görünen boylam →',sx+sg/2,Y-16,'10px',C.dim,'center');
},
metin:function(c){var K=(c.veri||{}).kareler||[];if(!K.length)return{o:'Veri yüklenemedi',z:''};
 var k=K[mn(c.k,K.length-1)],g=K.filter(function(x){return x.geri;});
 return{o:k.t+' &nbsp;·&nbsp; <b>'+k.lon.toFixed(1)+'°</b> '+S[(k.lon/30|0)%12]
 +' &nbsp; <span class="sbg-e'+(k.geri?' g':'')+'">'+(k.geri?'geri hareketli':'ileri')+'</span>',
 z:'<b>'+k.t+'</b> · Merkür '+k.lon.toFixed(1)+'° '+S[(k.lon/30|0)%12]+', '
 +(k.geri?'<i>geri hareketli görünüyor</i>':'ileri hareketli')+'. '+K.length+' günün '+g.length
 +' gününde geri hareket görünüyor'+(g.length?' ('+g[0].t+' → '+g[g.length-1].t+')':'')
 +'; yörüngede geri giden bir şey yok.'};
}};};

/* ── 5 · Merkür–Güneş açı farkı grafiği (data-kaynak) ── */
TIP['uzaklik-grafigi']=function(){
return{etiket:'Merkür–Güneş açı farkı, iki yıl.',en:1200,boy:.3167,adet:0,
ciz:function(c){var o=c.o,G=c.G,Y=c.Y,K=(c.veri||{}).kareler;
 if(!K||!K.length)return bos(o,G,Y);
 zm(o,G,Y);
 var sl=62,sg=G-16,us=22,at=Y-30,g=sg-sl,h=at-us,eb=mx.apply(null,K.map(ab));
 var Yv=function(v){return us+h/2-(v/32)*(h/2);};
 o.fillStyle='rgba(227,166,146,.13)';o.fillRect(sl,Yv(eb),g,Yv(-eb)-Yv(eb));
 o.setLineDash([5,4]);
 [eb,-eb].forEach(function(v){cz(o,sl,Yv(v),sg,Yv(v),'rgba(227,166,146,.75)',1.5);});
 o.setLineDash([]);cz(o,sl,Yv(0),sg,Yv(0),C.l2,1);
 [30,eb,0,-eb,-30].forEach(function(v){
  if(ab(ab(v)-eb)<.01)yz(o,(v>0?'+':'')+v.toFixed(1)+'°',sl-8,Yv(v),'11px',C.gbr,'right');
  else if(v===0)yz(o,'Güneş',sl-6,Yv(0),'10px',C.mut,'right');
  else yz(o,(v>0?'+':'')+v+'°',sl-6,Yv(v),'10px',C.dim,'right');});
 pl(o,K.length,function(i){return sl+i/(K.length-1)*g;},function(i){return Yv(K[i]);},
  'rgba(242,211,184,.85)',1.4);
 yz(o,'2026',sl,Y-14,'10px',C.dim,'left');yz(o,'2027',sg,Y-14,'10px',C.dim,'right');
 yz(o,'Merkür Güneş’in doğusunda',sg-6,us+10,'10px',C.dim,'right');
 yz(o,'Merkür Güneş’in batısında',sg-6,at-8,'10px',C.dim,'right');
 yz(o,'bu bandın dışına çıkamaz',sl+10,Yv(0)-10,'11px','rgba(227,166,146,.75)','left');
},
metin:function(c){var K=(c.veri||{}).kareler||[];if(!K.length)return{o:'Veri yüklenemedi',z:''};
 var eb=mx.apply(null,K.map(ab));
 return{o:'İki yılda en büyük ayrılık: <b>'+eb.toFixed(1)+'°</b> — bandın dışına hiç çıkmıyor',
 z:'İki yıllık veride Merkür ile Güneş arasındaki en büyük açı farkı <b>'+eb.toFixed(1)
 +'°</b>; çizgi bandın dışına hiç çıkmıyor. Bu yüzden Merkür yalnızca Güneş’in burcunda, bir öncekinde ya da bir sonrakinde bulunabilir.'};
}};};

/* ── 6 · yükselen halkası (data-kaynak) ── */
TIP['yukselen-halkasi']=function(d){var yer=d.yer||'';
return{etiket:'Bir gün boyunca yükselen burç halkası.',
en:1000,boy:.52,hiz:70,kare:+(d.kare||36),kay:[{ad:'k',min:0,max:1,etiket:'Saat'}],
hazir:function(v){var n=((v||{}).kareler||[]).length;this.adet=n;this.durak=n-1;
 this.kay[0].max=mx(1,n-1);},
ciz:function(c){var o=c.o,G=c.G,Y=c.Y,K=(c.veri||{}).kareler;
 if(!K||!K.length)return bos(o,G,Y);
 zm(o,G,Y);var k=K[mn(c.k,K.length-1)],cx=G/2,cy=Y/2+8,R=mn(G*.62,Y)/2-38;
 halka(o,cx,cy,R,R-26,k.asc/30|0,1);
 cz(o,cx-R-14,cy,cx+R+14,cy,C.l2,1);yz(o,'ufuk',cx+R+18,cy,'10px',C.dim,'left');
 var an=(k.asc-90)*rd,ux=cx+cs(an)*(R-4),uy=cy+sn(an)*(R-4);
 cz(o,cx,cy,ux,uy,C.gbr,2);dt(o,ux,uy,4,C.gbr);dt(o,cx,cy,4,C.gld);
 yz(o,sa(k.dk),cx,cy-R-22,'16px',C.ink,'center');
 if(yer)yz(o,yer,cx,cy+R+24,'10px',C.dim,'center');
},
metin:function(c){var K=(c.veri||{}).kareler||[];if(!K.length)return{o:'Veri yüklenemedi',z:''};
 var k=K[mn(c.k,K.length-1)],b=k.asc/30|0,t={};
 K.forEach(function(x){t[x.asc/30|0]=1;});
 return{o:sa(k.dk)+' &nbsp;·&nbsp; yükselen <b>'+S[b]+'</b> '+(k.asc%30).toFixed(0)+'°',
 z:'Saat <b>'+sa(k.dk)+'</b>'+(yer?' · '+yer:'')+' — ufukta yükselen burç <i>'+S[b]+'</i> '
 +(k.asc%30).toFixed(0)+'°. Gün içinde on iki burcun '+Object.keys(t).length
 +' tanesi ufuktan geçiyor; yükselen ortalama iki saatte bir değişir.'};
}};};

/* ═══ çekirdek ═══ */
function ol(t,c,p,m){var e=D.createElement(t);if(c)e.className=c;
if(m!=null)e.textContent=m;if(p)p.appendChild(e);return e;}
function olcek(cv,sp){
var o=cv.getContext('2d'),dpr=mn(W.devicePixelRatio||1,2);
var g=mx(120,M.round(cv.clientWidth||sp.en||1000));
var y=M.round(g*(typeof sp.boy==='function'?sp.boy(g):(sp.boy||.5)));
var w=M.round(g*dpr),h=M.round(y*dpr);
if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
cv.style.height=y+'px';o.setTransform(dpr,0,0,dpr,0,0);return{o:o,G:g,Y:y};}
function bildir(t,y){try{D.dispatchEvent(new CustomEvent('sorbi:gosteri',{detail:{tip:t,olay:y}}));}catch(e){}}

function kurBir(el){
if(el.dataset.sbgKuruldu)return;el.dataset.sbgKuruldu='1';
var tip=el.getAttribute('data-sorbi-gosteri'),yap=TIP[tip],sp;
try{sp=yap&&yap(el.dataset);}catch(e){}
if(!sp){el.hidden=true;return;}
var id='sbgZ'+(++no);el.classList.add('sbg');
var cv=ol('canvas','',el);
cv.setAttribute('role','img');cv.setAttribute('aria-label',sp.etiket||'Gösterim');
cv.setAttribute('aria-describedby',id);
cv.width=sp.en||1000;
cv.height=M.round(cv.width*(typeof sp.boy==='function'?sp.boy(cv.width):(sp.boy||.5)));
var kk=ol('div','sbg-k',el),z=ol('div','sbg-z',el);z.id=id;
var st={k:+(sp.kare||0),v:{},veri:null,oyn:0,rid:0,son:0,bek:0},gr=[],btn=null,oku=null;
function ilk(q){return +(q.deger||q.min||0);}
(sp.kay||[]).forEach(function(q){if(q.ad!=='k')st.v[q.ad]=ilk(q);});
function ciz(){
 var m=olcek(cv,sp),c={o:m.o,G:m.G,Y:m.Y,k:st.k,v:st.v,veri:st.veri},t=null;
 try{sp.ciz(c);t=sp.metin&&sp.metin(c);}catch(e){}
 if(t){if(oku)oku.innerHTML=t.o||'';
  z.innerHTML=(t.z||'')+(AZ?' <span style="color:#9BA0AB">Azaltılmış hareket açık: tek kare gösteriliyor, kaydırıcıyla ilerletebilirsin.</span>':'');}
}
function senk(){gr.forEach(function(g){var v=g.ad==='k'?st.k:st.v[g.ad];if(+g.el.value!==v)g.el.value=v;});}
function dur(){st.oyn=0;if(st.rid)cancelAnimationFrame(st.rid);st.rid=0;
 if(btn){btn.textContent='Oynat';btn.setAttribute('aria-pressed','false');}}
function basla(){if(AZ||!(sp.adet>1)||st.oyn)return;st.oyn=1;st.son=0;
 if(btn){btn.textContent='Duraklat';btn.setAttribute('aria-pressed','true');}
 st.rid=requestAnimationFrame(dongu);}
function dongu(ts){if(!st.oyn)return;
 if(!st.son||ts-st.son>=(sp.hiz||110)){st.son=ts;st.k=(st.k+1)%sp.adet;senk();ciz();}
 st.rid=requestAnimationFrame(dongu);}
if((sp.adet>1||sp.hazir)&&!AZ){btn=ol('button','sbg-b',kk);btn.type='button';btn.textContent='Oynat';
 btn.setAttribute('aria-pressed','false');
 btn.addEventListener('click',function(){st.oyn?dur():basla();bildir(tip,'oynat');});}
(sp.kay||[]).forEach(function(q){
 var yer=kk;
 if(sp.kay.length>1&&q.kisa){yer=ol('div','sbg-p',kk);ol('span','sbg-l',yer,q.kisa);}
 var r=ol('input','sbg-s',yer);r.type='range';r.min=q.min;r.max=q.max;r.step=q.adim||1;
 r.value=q.ad==='k'?st.k:st.v[q.ad];r.setAttribute('aria-label',q.etiket||'Değer');
 r.addEventListener('input',function(){
  if(q.ad==='k'){st.k=+this.value;dur();}else st.v[q.ad]=+this.value;
  ciz();bildir(tip,'kaydirici');});
 gr.push({ad:q.ad,el:r});});
if(sp.metin){oku=ol('span','sbg-o',kk);oku.setAttribute('aria-hidden','true');}
if(sp.kay&&sp.kay.length){var sf=ol('button','sbg-b sbg-i',kk);sf.type='button';sf.textContent='Sıfırla';
 sf.addEventListener('click',function(){dur();st.k=+(sp.kare||0);
  (sp.kay||[]).forEach(function(q){if(q.ad!=='k')st.v[q.ad]=ilk(q);});senk();ciz();});}
function hazirla(v){
 st.veri=v;if(sp.hazir)try{sp.hazir.call(sp,v);}catch(e){}
 if(AZ&&sp.durak!=null)st.k=sp.durak;
 gr.forEach(function(g){if(g.ad==='k'&&sp.kay)g.el.max=sp.kay[0].max;});
 if(btn)btn.disabled=!(sp.adet>1);
 senk();ciz();if(el.dataset.oto==='1')basla();}
var kn=el.dataset.kaynak;
if(kn){ciz();fetch(kn).then(function(r){return r.json();}).then(function(j){
 hazirla(el.dataset.yol?j[el.dataset.yol]:j);},function(){hazirla(null);});}
else hazirla(null);
W.addEventListener('resize',ciz);
D.addEventListener('visibilitychange',function(){
 if(D.hidden){if(st.oyn){st.bek=1;dur();}}else if(st.bek){st.bek=0;basla();}});
}
function kur(kok){
kok=kok||D;
if(!D.getElementById('sbgCss')){var s=D.createElement('style');s.id='sbgCss';
 s.textContent=CSS;(D.head||D.body).appendChild(s);}
var L=kok.querySelectorAll?kok.querySelectorAll('[data-sorbi-gosteri]'):[];
for(var i=0;i<L.length;i++)kurBir(L[i]);}
W.SorbiGosteri={kur:kur,tipler:TIP,ekle:function(t,f){TIP[t]=f;}};
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',function(){kur();});else kur();
})();
