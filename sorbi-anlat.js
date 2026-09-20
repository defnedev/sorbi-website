/*! sorbi-anlat.js — terimleri kendi haritandan anlatır.
 *  Her terim: bir cümle tanım + senin haritanda karşılığı + halkada nerede olduğu.
 *  Jargon yok, yorum yok. Doğum bilgisi yoksa şu anın gökyüzü kullanılır ve bu söylenir.
 *
 *  SorbiAnlat.kur(el)            → tam liste (kartlar)
 *  SorbiAnlat.ac('yukselen')     → tek terimi sayfa içi panelde aç
 *  SorbiAnlat.baglaLinkler(kok)  → [data-anlat] taşıyan her kelimeyi tıklanır yapar
 */
(function(){
'use strict';
var W=window,D=document,M=Math,PI=M.PI,TAU=PI*2,rd=PI/180,cs=M.cos,sn=M.sin;
var SG='♈︎ ♉︎ ♊︎ ♋︎ ♌︎ ♍︎ ♎︎ ♏︎ ♐︎ ♑︎ ♒︎ ♓︎'.split(' ');
var BURC='Koç Boğa İkizler Yengeç Aslan Başak Terazi Akrep Yay Oğlak Kova Balık'.split(' ');
var BURC_DA='Koç’ta Boğa’da İkizler’de Yengeç’te Aslan’da Başak’ta Terazi’de Akrep’te Yay’da Oğlak’ta Kova’da Balık’ta'.split(' ');
var ELEM=['ateş','toprak','hava','su'], NIT=['öncü','sabit','değişken'];
var YON=['mar','ven','mer','moon','sun','mer','ven','mar','jup','sat','sat','jup'];
var AD={sun:'Güneş',moon:'Ay',mer:'Merkür',ven:'Venüs',mar:'Mars',jup:'Jüpiter',sat:'Satürn',ura:'Uranüs',nep:'Neptün',plu:'Plüton'};
var ILGI={sun:'Güneş’in',moon:'Ay’ın',mer:'Merkür’ün',ven:'Venüs’ün',mar:'Mars’ın',jup:'Jüpiter’in',sat:'Satürn’ün',ura:'Uranüs’ün',nep:'Neptün’ün',plu:'Plüton’un'};
var EV_KONU=['sen ve bedenin','paran ve eşyan','kardeş, komşu, yazışma','ev, aile, kök','keyif, aşk, çocuk','düzen, iş rutini, sağlık','eş, ortak, karşı taraf','ortak para, borç, derin değişim','eğitim, uzak yol, inanç','iş hayatı, görünürlük','arkadaşlar, topluluk','yalnız kalınan yer, arka plan'];

/* tema: canvas değişken okuyamaz */
var __rc={};
function tk(a){var t=D.documentElement.getAttribute('data-tema')||'gece',k=t+'|'+a;
 if(__rc[k])return __rc[k];var v=getComputedStyle(D.documentElement).getPropertyValue(a).trim();return (__rc[k]=v||'#F2EFE9');}
function tkr(a,o){return 'rgba('+tk(a+'-rgb')+','+o+')';}
function nrm(x){return ((x%360)+360)%360;}
function kisa(a,b){var d=nrm(b-a);return d>180?d-360:d;}
function ayr(a,b){return M.abs(kisa(a,b));}
function bn(l){return M.floor(nrm(l)/30);}
function der(l){return M.floor(nrm(l)%30);}
function dak(l){return M.round((nrm(l)%1)*60);}
function pad(n){return (n<10?'0':'')+n;}
function konumMetni(l){return der(l)+'° '+BURC[bn(l)]+' '+pad(dak(l))+'′';}

/* ── harita ── */
var CH=null, KAYNAK='';
function harita(){
 if(CH)return CH;
 var A=W.SorbiAstro; if(!A)return null;
 var b=null; try{b=JSON.parse(localStorage.getItem('sorbi_birth')||'null');}catch(e){}
 if(!b){try{var pr=JSON.parse(localStorage.getItem('sorbi_profile')||'null');if(pr&&pr.birth)b=pr.birth;}catch(e){}}
 if(b&&b.date){
  var d=b.date.split('-'),t=(b.time||'').split(':'),saatsiz=!b.time;
  CH=A.chart({y:+d[0],mo:+d[1],d:+d[2],h:saatsiz?12:+t[0],mi:saatsiz?0:+t[1],
   tz:b.tz||'Europe/Istanbul',lat:+b.lat||41.0082,lon:+b.lon||28.9784,house:saatsiz?'W':'P'});
  CH.saatsiz=saatsiz; CH.tahmin=!!b.tahmin; CH.yer=b.place||''; CH.tarih=b.date;
  KAYNAK=saatsiz?'dogum-saatsiz':(b.tahmin?'dogum-tahmin':'dogum');
 }else{
  CH=A.now({tz:'Europe/Istanbul',lat:41.0082,lon:28.9784,house:'P'});
  CH.saatsiz=false; CH.simdi=true; KAYNAK='simdi';
 }
 CH.P={}; CH.pls.forEach(function(p){if(AD[p.k])CH.P[p.k]=p;});
 return CH;
}
function gz(k){var c=harita();return c&&c.P[k];}

/* ── halka: gösteri diliyle, tek vurgu ── */
function ciz(cv,vurgu){
 var c=harita(); if(!c)return;
 var dpr=M.min(W.devicePixelRatio||1,2),G=cv.clientWidth||320;
 if(cv.width!==M.round(G*dpr)){cv.width=M.round(G*dpr);cv.height=cv.width;}
 var x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,G,G);
 var cx=G/2,cy=G/2,R=G/2-10,ic=R-M.max(20,G*.075),rp=ic-M.max(14,G*.06),mono='ui-monospace,Menlo,monospace';
 var kok=c.saatsiz?0:c.asc;
 function ang(l){return (180-(l-kok))*rd;}
 var v=vurgu||{};
 /* burç halkası */
 for(var b=0;b<12;b++){
  var a0=ang(b*30),a1=ang(b*30+30);
  x.beginPath();x.arc(cx,cy,R,a0,a1,true);x.arc(cx,cy,ic,a1,a0,false);x.closePath();
  var sec=(v.burc===b)||(v.burclar&&v.burclar.indexOf(b)>=0);
  x.fillStyle=sec?tkr('--acc',.2):(b%2?tkr('--ink',.028):tkr('--ink',.055));x.fill();
  x.strokeStyle=tkr('--ink',.10);x.lineWidth=1;x.stroke();
  var am=ang(b*30+15);
  x.fillStyle=sec?tk('--ink'):tk('--mut');x.font='12px '+mono;x.textAlign='center';x.textBaseline='middle';
  x.fillText(SG[b],cx+cs(am)*(R+ic)/2,cy+sn(am)*(R+ic)/2);
 }
 /* evler */
 if((v.ev||v.evler)&&!c.saatsiz){
  for(var i=0;i<12;i++){
   var h0=c.saatsiz?nrm(c.asc-der(c.asc)-dak(c.asc)/60+i*30):c.c[i],
       h1=c.saatsiz?nrm(h0+30):c.c[(i+1)%12];
   var g0=ang(h0),g1=ang(h1);
   if(v.ev===i+1){x.beginPath();x.arc(cx,cy,ic,g0,g1,true);x.lineTo(cx,cy);x.closePath();x.fillStyle=tkr('--acc',.13);x.fill();}
   x.strokeStyle=tkr('--ink',v.ev===i+1?.3:.12);x.lineWidth=1;
   x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+cs(g0)*ic,cy+sn(g0)*ic);x.stroke();
   if(v.evler||v.ev===i+1){var gm=ang(nrm(h0+kisa(h0,h1)/2));
    x.fillStyle=(v.ev===i+1)?tk('--ink'):tk('--dim');x.font='10px '+mono;
    x.fillText(String(i+1),cx+cs(gm)*(ic-M.max(12,G*.05)),cy+sn(gm)*(ic-M.max(12,G*.05)));}
  }
 }
 /* ufuk + meridyen */
 if(!c.saatsiz){
  var aA=ang(c.asc),aM=ang(c.mc);
  x.strokeStyle=v.asc?tk('--acc'):tkr('--ink',.22);x.lineWidth=v.asc?1.6:1;
  x.beginPath();x.moveTo(cx+cs(aA)*ic,cy+sn(aA)*ic);x.lineTo(cx-cs(aA)*ic,cy-sn(aA)*ic);x.stroke();
  x.strokeStyle=v.mc?tk('--acc'):tkr('--ink',.12);x.lineWidth=v.mc?1.6:1;
  x.beginPath();x.moveTo(cx+cs(aM)*ic,cy+sn(aM)*ic);x.lineTo(cx-cs(aM)*ic,cy-sn(aM)*ic);x.stroke();
  x.font='10px '+mono;x.textAlign='center';
  x.fillStyle=v.asc?tk('--acc'):tk('--dim');x.fillText('AC',cx+cs(aA)*(R+9),cy+sn(aA)*(R+9));
  x.fillStyle=v.mc?tk('--acc'):tk('--dim');x.fillText('MC',cx+cs(aM)*(R+9),cy+sn(aM)*(R+9));
  /* ufkun altı: gündüz/gece anlatımı */
  if(v.ufuk){x.beginPath();x.arc(cx,cy,ic,ang(c.asc),ang(c.asc)+PI,true);x.closePath();x.fillStyle=tkr('--ink',.05);x.fill();}
 }
 /* açı çizgisi */
 if(v.aci){var p=gz(v.aci[0]),q=gz(v.aci[1]);
  if(p&&q){var a1_=ang(p.lon),a2_=ang(q.lon);x.strokeStyle=tk('--acc');x.lineWidth=1.2;
   x.beginPath();x.moveTo(cx+cs(a1_)*rp,cy+sn(a1_)*rp);x.lineTo(cx+cs(a2_)*rp,cy+sn(a2_)*rp);x.stroke();}}
 /* gezegenler */
 var sira=Object.keys(c.P).map(function(k){return {k:k,lon:c.P[k].lon};}).sort(function(a,b){return a.lon-b.lon;});
 var kat={};for(var i2=0;i2<sira.length;i2++){var s=sira[i2],q2=sira[i2-1];kat[s.k]=(q2&&ayr(q2.lon,s.lon)<7)?(kat[q2.k]||0)+1:0;}
 for(var k in c.P){
  var p2=c.P[k],a=ang(p2.lon),r=rp-kat[k]*(G*.052),
      one=(v.gezegen===k)||(v.gezegenler&&v.gezegenler.indexOf(k)>=0)||(v.aci&&v.aci.indexOf(k)>=0);
  var xx=cx+cs(a)*r,yy=cy+sn(a)*r;
  if(one){x.beginPath();x.arc(xx,yy,8,0,TAU);x.fillStyle=tkr('--acc',.18);x.fill();}
  x.beginPath();x.arc(xx,yy,one?4:2.6,0,TAU);x.fillStyle=one?tk('--acc'):tkr('--ink',.55);x.fill();
  x.fillStyle=one?tk('--ink'):tkr('--ink',.5);x.font=(one?'13px ':'11px ')+mono;
  var gx=cx+cs(a)*(r-M.max(14,G*.055)),gy=cy+sn(a)*(r-M.max(14,G*.055));
  x.fillText(p2.g,gx,gy);
  if(v.retro&&p2.rx){x.fillStyle=tk('--acc');x.font='8px '+mono;x.fillText('R',gx+8,gy-7);}
 }
 /* ek nokta: düğüm gibi gezegen olmayan noktalar */
 if(v.nokta){var np=v.nokta,na=ang(np.lon),nr=rp+M.max(9,G*.04);
  var nx=cx+cs(na)*nr,ny=cy+sn(na)*nr;
  x.beginPath();x.arc(nx,ny,7,0,TAU);x.fillStyle=tkr('--acc',.18);x.fill();
  x.fillStyle=tk('--acc');x.font='13px '+mono;x.textAlign='center';x.textBaseline='middle';x.fillText(np.g,nx,ny);
  var oa=ang(np.lon+180),ox=cx+cs(oa)*nr,oy=cy+sn(oa)*nr;
  x.fillStyle=tkr('--ink',.45);x.font='11px '+mono;x.fillText(np.g2||'',ox,oy);}
 /* ay evresi: merkeze küçük disk */
 if(v.evre){
  var su=c.P.sun,ay=c.P.moon,f=nrm(ay.lon-su.lon),r3=M.max(13,G*.055);
  x.save();x.beginPath();x.arc(cx,cy,r3,0,TAU);x.fillStyle=tkr('--ink',.12);x.fill();
  x.beginPath();x.arc(cx,cy,r3,-PI/2,PI/2,f>180);x.closePath();x.fillStyle=tk('--ink');x.fill();
  var k2=M.abs(cs(f*rd));x.beginPath();x.ellipse(cx,cy,r3*k2,r3,0,0,TAU);
  x.fillStyle=(f<90||f>270)?tkr('--ink',.12):tk('--ink');x.fill();x.restore();
 }else{x.beginPath();x.arc(cx,cy,2,0,TAU);x.fillStyle=tkr('--ink',.4);x.fill();}
}

/* ── terimler ── */
function elemSay(){var c=harita(),e=[0,0,0,0],n=[0,0,0];
 ['sun','moon','mer','ven','mar','jup','sat'].forEach(function(k){var b=bn(c.P[k].lon);e[b%4]++;n[b%3]++;});
 return {e:e,n:n};}
function evre(f){f=nrm(f);
 if(f<22.5||f>=337.5)return 'yeni ay';
 if(f<67.5)return 'büyüyen hilal'; if(f<112.5)return 'ilk dördün';
 if(f<157.5)return 'büyüyen şişkin ay'; if(f<202.5)return 'dolunay';
 if(f<247.5)return 'küçülen şişkin ay'; if(f<292.5)return 'son dördün';
 return 'küçülen hilal';}
function liste(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' ve '+a[a.length-1];}
function enBuyuk(a){var i=0;for(var j=1;j<a.length;j++)if(a[j]>a[i])i=j;return i;}
function enKucuk(a){var i=0;for(var j=1;j<a.length;j++)if(a[j]<a[i])i=j;return i;}

var T=[
{k:'yukselen',ad:'Yükselen',
 tanim:'Doğduğun anda doğu ufkundan yükselmekte olan burç. Gökyüzünün senin bulunduğun yerden görünen hâli; bu yüzden saat ve şehir ister. Güneş burcu aynı gün doğan herkeste aynıdır, yükselen ise ortalama iki saatte bir değişir; bazı burçlar bir saatte, bazıları üç saatte geçer.',
 sende:function(c){ if(c.saatsiz)return 'Saatin kayıtlı olmadığı için yükselen çıkmıyor. Gün içinde on iki kez değiştiğinden kesin bulunamaz, ama hayatındaki birkaç tarihle daraltılabilir; yükselen tahmini aracı bunun için var.';
  if(c.simdi)return 'Şu an İstanbul’da doğu ufkunda '+BURC[bn(c.asc)]+' var: '+konumMetni(c.asc)+'. Bu dakikada doğan bir bebeğin yükseleni bu olurdu.';
  return 'Senin yükselenin '+konumMetni(c.asc)+'. Yani doğduğun anda doğu ufkunda '+BURC[bn(c.asc)]+' vardı'+(c.yer?', '+c.yer+'’da':'')+'.';},
 vurgu:{asc:1}},
{k:'gunes',ad:'Güneş burcu',
 tanim:'Doğduğun gün Güneş’in hangi burçta olduğu. Gazetede burcun diye yazan bu. Yılda bir tur attığı için bir burçta yaklaşık bir ay kalır; saat bilmesen de değişmez.',
 sende:function(c){var p=c.P.sun;
  if(c.simdi)return 'Güneş şu an '+konumMetni(p.lon)+'. Yani bugün doğanların çoğunun güneş burcu '+BURC[bn(p.lon)]+'.';
  return 'Güneşin '+konumMetni(p.lon)+(c.saatsiz?'.':', '+p.house+'. evde.')+' Güneş bir burçta bir ay kaldığı için bunu senin doğduğun aya yakın doğan herkesle paylaşıyorsun.';},
 vurgu:function(c){return {gezegen:'sun',burc:bn(c.P.sun.lon)};}},
{k:'ay',ad:'Ay burcu',
 tanim:'Doğduğun anda Ay’ın hangi burçta olduğu. Ay en hızlı hareket eden gök cismi: iki buçuk günde burç değiştirir. Bu yüzden aynı gün doğan iki kişinin Ay burcu farklı olabilir ve saatin bilinmesi işe yarar.',
 sende:function(c){var p=c.P.moon,su=c.P.sun,f=nrm(p.lon-su.lon);
  var ev=evre(f);
  if(c.simdi)return 'Ay şu an '+konumMetni(p.lon)+' ve '+ev+' hâlinde.';
  return 'Ayın '+konumMetni(p.lon)+(c.saatsiz?'':', '+p.house+'. evde')+'. O gün Ay '+ev+' hâlindeydi.'+(c.saatsiz?' Saat bilinmediği için öğlen kabul edildi; Ay günde 13 derece gittiğinden bu derece altı yedi derece oynayabilir.':'');},
 vurgu:{gezegen:'moon',evre:1}},
{k:'ev',ad:'Ev',
 tanim:'Halkanın on iki dilimi. Burçlar gökyüzünün bölümleri, evler ise senin hayatının bölümleri: birincisi sen ve bedenin, dördüncüsü evin, yedincisi karşındaki, onuncusu iş hayatın. Evler yükselenden başlar, o yüzden saat ister.',
 sende:function(c){ if(c.saatsiz)return 'Saat olmadan evler kurulamıyor. Bu yüzden saatsiz haritada gezegenlerin burçları doğru, evleri boş kalır.';
  var ek=c.simdi?'. evde ':'. evinde (';
  var l=[];[1,4,7,10].forEach(function(e){var g=[];for(var k in c.P)if(c.P[k].house===e)g.push(AD[k]);
   if(g.length)l.push(e+ek+(c.simdi?'':EV_KONU[e-1]+') ')+g.join(', '));});
  var o=c.simdi?'Şu an ':'Sende ';
  return l.length?o+l.join('; ')+' var.':o+'dört köşe evde (1, 4, 7, 10) gezegen yok; bu da bir bilgi, gezegenler halkanın başka yerlerinde toplanmış demek.';},
 vurgu:{evler:1,ev:1}},
{k:'mc',ad:'MC (tepe noktası)',
 tanim:'Doğduğun anda gezegenlerin yolunun gökteki en yüksek yeri. Yükselen doğu ufkundaysa MC tepe yönüdür; iş hayatı, görünürlük, insanların seni nasıl tanıdığı bu noktayla anlatılır. O da saate bağlı.',
 sende:function(c){ if(c.saatsiz)return 'Saat olmadan tepe noktası da çıkmıyor; ufuk gibi o da dünyanın dönüşüne bağlı.';
  return (c.simdi?'Şu an tepe noktası ':'Senin tepe noktan ')+konumMetni(c.mc)+'.';},
 vurgu:{mc:1}},
{k:'yonetici',ad:'Harita yöneticisi',
 tanim:'Her burcun bir yönetici gezegeni vardır. Yükselen burcunun yöneticisi bütün haritanın yöneticisi sayılır; nerede duruyorsa oraya ağırlık verilir. Burada eski yöneticiler kullanılıyor: Akrep’in Mars, Kova’nın Satürn, Balık’ın Jüpiter. Bazı uygulamalar bunlara Plüton, Uranüs ve Neptün der.',
 sende:function(c){ if(c.saatsiz)return 'Harita yöneticisi yükselenden çıkar, saat olmadan bulunamaz.';
  var y=YON[bn(c.asc)],p=c.P[y];
  return (c.simdi?'Şu anki yükselen ':'Yükselenin ')+BURC[bn(c.asc)]+', onun yöneticisi '+AD[y]+'. '+
   (c.simdi?ILGI[y]+' yeri: ':'Senin '+ILGI[y]+' ')+BURC_DA[bn(p.lon)]+', '+p.house+'. evde ('+EV_KONU[p.house-1]+').';},
 vurgu:function(c){return c.saatsiz?{}:{gezegen:YON[bn(c.asc)],asc:1};}},
{k:'aci',ad:'Açı',
 tanim:'İki gezegen arasındaki derece farkı. 0, 60, 90, 120 ve 180 derece civarındaki farklar açı sayılır; yorumda gezegenlerin birbirini görmesi diye anlatılan şey bu. Tam dereceden sapmaya orb denir, sapma ne kadar küçükse açı o kadar belirgin kabul edilir. Burada yalnız Güneş, Ay, Merkür, Venüs ya da Mars’ın karıştığı açılar sayıldı; dış gezegenlerin birbiriyle yaptığı açılar yıllarca sürdüğü için bir kuşağın tamamında aynıdır.',
 sende:function(c){var A=W.SorbiAstro,KIS={sun:1,moon:1,mer:1,ven:1,mar:1},
   as=A.within(c,1,false).filter(function(x){return AD[x.a.k]&&AD[x.b.k]&&(KIS[x.a.k]||KIS[x.b.k]);});
  if(!as.length)return 'Kişisel gezegenlerinle başka bir gezegen arasında dar açı çıkmadı, yani o gün gezegenler birbirinden uzaktı.';
  var x=as[0];
  return (c.simdi?'Şu andaki en dar açı ':'Sendeki en dar açı ')+x.a.n+' ile '+x.b.n+' arasında: '+x.as.n.toLowerCase()+', '+M.abs(x.orb).toFixed(1)+' derece sapmayla. Toplam '+as.length+' açı var.'+
   (c.saatsiz?' Saat bilinmediği için Ay’ın açıları oynayabilir, gerisi sabit.':'');},
 vurgu:function(c){var A=W.SorbiAstro,KIS={sun:1,moon:1,mer:1,ven:1,mar:1},
   as=A.within(c,1,false).filter(function(x){return AD[x.a.k]&&AD[x.b.k]&&(KIS[x.a.k]||KIS[x.b.k]);});
  return as.length?{aci:[as[0].a.k,as[0].b.k]}:{};}},
{k:'retro',ad:'Retro',
 tanim:'Bir gezegenin gökyüzünde bir süre geri gidiyor gibi görünmesi. Gerçekte geri gitmiyor: Dünya onu geçerken bakış açımız değişiyor, iz geri sarıyor. Merkür yılın beşte birinde geri görünür, yani retroda doğmak yaygındır.',
 sende:function(c){var l=[];for(var k in c.P)if(c.P[k].rx)l.push(AD[k]);
  if(c.simdi)return l.length?'Şu an geri görünen gezegenler: '+l.join(', ')+'.':'Şu an hiçbir gezegen geri görünmüyor, bu da seyrek olan taraf.';
  return l.length?'Doğduğun gün geri görünen gezegenler: '+l.join(', ')+'.':'Doğduğun gün hiçbir gezegen geri görünmüyordu, bu da seyrek olan taraf.';},
 vurgu:{retro:1}},
{k:'element',ad:'Element ve nitelik',
 tanim:'On iki burç dörder elemente (ateş, toprak, hava, su) ve üçer niteliğe (öncü, sabit, değişken) ayrılır. Hangi elementte çok, hangisinde az gezegenin olduğu haritanın dengesini anlatır.',
 sende:function(c){var s=elemSay(),i=enBuyuk(s.e),j=enKucuk(s.e),n=enBuyuk(s.n),enc=[],enz=[];
  for(var q=0;q<4;q++){if(s.e[q]===s.e[i])enc.push(ELEM[q]);if(s.e[q]===s.e[j])enz.push(ELEM[q]);}
  return 'Yedi klasik gezegenin dağılımı: ateş '+s.e[0]+', toprak '+s.e[1]+', hava '+s.e[2]+', su '+s.e[3]+'. En çok '+liste(enc)+', en az '+liste(enz)+'. Niteliklerde ağırlık '+NIT[n]+' burçlarda.'+(c.saatsiz?' Ay burç değiştirirse bu sayım bir oynayabilir.':'');},
 vurgu:function(c){var s=elemSay(),i=enBuyuk(s.e),b=[];for(var x=0;x<12;x++)if(x%4===i)b.push(x);return {burclar:b};}},
{k:'yigin',ad:'Yığın (stellium)',
 tanim:'Üç ya da daha fazla gezegenin aynı burçta toplanması. Çok özel gibi anlatılır ama saydık: yedi klasik gezegenden en az üçünün aynı burçta olduğu gün, günlerin yüzde kırk üçü. Asıl seyrek olan dört ve üstü.',
 sende:function(c){var s=[0,0,0,0,0,0,0,0,0,0,0,0];['sun','moon','mer','ven','mar','jup','sat'].forEach(function(k){s[bn(c.P[k].lon)]++;});
  var i=enBuyuk(s);
  var o=c.simdi?'Şu an ':'Sende ';
  var not=c.saatsiz?' Ay üçlünün içindeyse saat bilinmediği için bu sayım değişebilir.':'';
  if(s[i]>=5)return o+s[i]+' gezegen '+BURC_DA[i]+' toplanmış. Beşli yığın yüz iki günde bir görülüyor, gerçekten seyrek.'+not;
  if(s[i]===4)return o+'dört gezegen '+BURC_DA[i]+' toplanmış. Dörtlü yığın on iki günde bir görülüyor.'+not;
  if(s[i]===3)return o+'üç gezegen '+BURC_DA[i]+' toplanmış. En az üçlü yığın günlerin yüzde kırk üçünde var, yani yaygın.'+not;
  return o+'en kalabalık burçta '+s[i]+' gezegen var ('+BURC[i]+'), yani yığın yok; günlerin yarısından çoğu böyle.'+not;},
 vurgu:function(c){var s=[0,0,0,0,0,0,0,0,0,0,0,0];['sun','moon','mer','ven','mar','jup','sat'].forEach(function(k){s[bn(c.P[k].lon)]++;});return {burc:enBuyuk(s)};}},
{k:'dugum',ad:'Ay düğümü',
 tanim:'Ay’ın gökyüzündeki yolu, Güneş’in yolunu iki noktada keser. Bu iki noktaya düğüm denir ve tam karşı karşıyadırlar. Tutulmalar ancak Güneş ile Ay bu noktalara yakınken olabilir; yani düğüm astrolojik bir süs değil, tutulmanın adresi. Yorumda kuzey düğüm gidilen yön, güney düğüm geride bırakılan diye anlatılır.',
 sende:function(c){var n=null;c.pls.forEach(function(p){if(p.k==='nod')n=p;}); if(!n)return 'Düğüm hesaplanamadı.';
  return (c.simdi?'Kuzey düğüm şu an ':'Kuzey düğümün ')+konumMetni(n.lon)+(c.saatsiz?'':', '+n.house+'. evde')+'. Güney düğüm tam karşısında, '+BURC_DA[bn(n.lon+180)]+'. Düğümler geriye doğru ilerler ve on sekiz buçuk yılda bir tur atar.';},
 vurgu:function(c){var n=null;c.pls.forEach(function(p){if(p.k==='nod')n=p;});return n?{nokta:{lon:n.lon,g:'☊︎',g2:'☋︎'},burc:bn(n.lon)}:{};}},
{k:'gunduz',ad:'Gündüz ve gece haritası',
 tanim:'Güneş doğduğun anda ufkun üstündeyse gündüz, altındaysa gece haritası olur. Klasik astrolojinin en eski ayrımlarından biri; hangi gezegenlerin rahat çalıştığı buna göre değişir.',
 sende:function(c){ if(c.saatsiz)return 'Saat olmadan Güneş’in ufkun üstünde mi altında mı olduğu bilinemiyor.';
  if(c.simdi)return c.day?'Şu an Güneş ufkun üstünde: gündüz haritası olurdu.':'Şu an Güneş ufkun altında: gece haritası olurdu.';
  return c.day?'Sende Güneş ufkun üstündeydi: gündüz haritası.':'Sende Güneş ufkun altındaydı: gece haritası.';},
 vurgu:{ufuk:1,gezegen:'sun'}}
];

/* ── görünüm ── */
var CSS='.sa-k{border:1px solid rgba(var(--ink-rgb),.12);border-radius:16px;padding:1.1rem 1.1rem 1.2rem;margin:.8rem 0;background:rgba(var(--ink-rgb),.022)}'
+'.sa-k h3{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.18rem;color:var(--ink);margin:0 0 .35rem}'
+'.sa-k .sa-t{color:var(--mut);font-size:.95rem;line-height:1.7;margin:0}'
+'.sa-alt{display:grid;grid-template-columns:150px 1fr;gap:1.1rem;align-items:center;margin-top:.9rem}'
+'@media(max-width:560px){.sa-alt{grid-template-columns:1fr;justify-items:center;text-align:center}}'
+'.sa-c{width:150px;height:150px;display:block}'
+'.sa-s{color:var(--ink);font-size:.95rem;line-height:1.75;font-weight:300}'
+'.sa-e{font-family:ui-monospace,Menlo,monospace;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);display:block;margin-bottom:.25rem}'
+'.sa-bas{display:flex;gap:.6rem;align-items:baseline;flex-wrap:wrap;margin-bottom:1rem}'
+'.sa-bas b{font-family:ui-monospace,Menlo,monospace;font-size:.76rem;color:var(--mut);font-weight:400}'
+'.sa-bas a{color:var(--acc)}'
+'.sa-lnk{color:inherit;border-bottom:1px dashed rgba(var(--ink-rgb),.4);cursor:pointer}'
+'.sa-lnk:hover{border-bottom-color:var(--ink)}'
+'.sa-p{position:fixed;inset:auto 0 0 0;z-index:9000;background:var(--bg);border-top:1px solid rgba(var(--ink-rgb),.14);'
+'border-radius:18px 18px 0 0;padding:1.2rem 1.1rem 1.6rem;max-height:86vh;overflow:auto;box-shadow:0 -18px 40px rgba(var(--bg-rgb),.6)}'
+'@media(min-width:720px){.sa-p{inset:auto auto 1.4rem 50%;transform:translateX(-50%);max-width:560px;border-radius:18px;border:1px solid rgba(var(--ink-rgb),.14)}}'
+'.sa-p .sa-k{border:none;background:none;padding:0;margin:0}'
+'.sa-kap{position:absolute;top:.7rem;right:.9rem;background:none;border:none;color:var(--mut);font-size:1.3rem;cursor:pointer;line-height:1}';
function css(){if(D.getElementById('saCss'))return;var s=D.createElement('style');s.id='saCss';s.textContent=CSS;(D.head||D.body).appendChild(s);}
function el(t,c,p,h){var e=D.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;if(p)p.appendChild(e);return e;}

function kart(t,kok){
 var c=harita(); if(!c)return null;
 var k=el('div','sa-k',kok);
 el('span','sa-e',k,'Ne demek');
 el('h3','',k,t.ad);
 el('p','sa-t',k,t.tanim);
 var alt=el('div','sa-alt',k);
 var cv=el('canvas','sa-c',alt);
 var s=el('div','sa-s',alt);
 el('span','sa-e',s,c.simdi?'Şu anki gökyüzünde':'Senin haritanda');
 el('span','',s,t.sende(c));
 var v=typeof t.vurgu==='function'?t.vurgu(c):t.vurgu;
 var boya=function(){ciz(cv,v);};
 if(cv.clientWidth)boya(); else setTimeout(boya,0);
 W.addEventListener('resize',boya);
 try{new MutationObserver(boya).observe(D.documentElement,{attributes:true,attributeFilter:['data-tema']});}catch(e){}
 return k;
}
function baslik(kok){
 var c=harita(),b=el('div','sa-bas',kok);
 var m={dogum:'Aşağıdakilerin hepsi senin haritandan hesaplandı: '+(c.tarih||'')+(c.yer?' · '+c.yer:'')+'.',
        'dogum-saatsiz':'Doğum saatin kayıtlı değil: saate bağlı olanlar (yükselen, evler, tepe noktası) çıkmıyor, gerisi çıkıyor.',
        'dogum-tahmin':'Saatin tahmin edilmiş: yükselen ve evler o tahmin kadar güvenilir, gezegen burçları kesin.',
        simdi:'Doğum bilgin kayıtlı değil, bu yüzden şu anın gökyüzü kullanılıyor. Kendi haritanı görmek için tarihini gir.'}[KAYNAK];
 el('b','',b,m);
 if(KAYNAK==='simdi'){var a=el('a','',b,'tarihini gir →');a.href='/';}
 if(KAYNAK==='dogum-saatsiz'){var a2=el('a','',b,'yükselen tahmini →');a2.href='/yukselen-tahmini';}
}
function kur(kok){
 css(); if(!harita()){kok.innerHTML='<p class="sa-t">Harita motoru yüklenemedi.</p>';return;}
 kok.innerHTML=''; baslik(kok);
 T.forEach(function(t){kart(t,kok);});
}
function ac(ad){
 css(); var t=null;T.forEach(function(x){if(x.k===ad)t=x;}); if(!t||!harita())return;
 kapat();
 var p=el('div','sa-p',D.body);p.id='saPanel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');
 var b=el('button','sa-kap',p,'✕');b.type='button';b.setAttribute('aria-label','Kapat');b.onclick=kapat;
 kart(t,p);
 p.tabIndex=-1;p.focus();
 D.addEventListener('keydown',esc);
}
function esc(e){if(e.key==='Escape')kapat();}
function kapat(){var p=D.getElementById('saPanel');if(p)p.parentNode.removeChild(p);D.removeEventListener('keydown',esc);}
function baglaLinkler(kok){
 css();
 var L=(kok||D).querySelectorAll('[data-anlat]');
 for(var i=0;i<L.length;i++){(function(e){
  if(e.dataset.saBagli)return; e.dataset.saBagli='1';
  e.classList.add('sa-lnk');e.setAttribute('role','button');e.tabIndex=0;
  e.onclick=function(){ac(e.getAttribute('data-anlat'));};
  e.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ac(e.getAttribute('data-anlat'));}};
 })(L[i]);}
}
W.SorbiAnlat={kur:kur,ac:ac,baglaLinkler:baglaLinkler,terimler:T};
})();
