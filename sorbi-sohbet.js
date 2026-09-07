/* SorbiSohbet — okuma sonrası tek soruluk sohbet.
 * LLM YOK: cevaplar kullanıcının kendi haritasından, tarayıcıda, kural tabanlı üretilir.
 * Neden: (1) soru başına API maliyeti yok, (2) her cümleyi biz yazdığımız için
 * marka anayasasına ve reklam yasağına uyum garanti, (3) uydurma yok — her cevap
 * gerçek gezegen/ev/dignite verisine dayanıyor ve dayanağı ekranda gösteriliyor.
 */
(function(){
'use strict';
var BURC=['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
var AD={sun:'Güneş',moon:'Ay',mer:'Merkür',ven:'Venüs',mar:'Mars',jup:'Jüpiter',sat:'Satürn',ura:'Uranüs',nep:'Neptün',plu:'Plüton'};
var YONETICI=['mar','ven','mer','moon','sun','mer','ven','mar','jup','sat','sat','jup'];
var SIRA=['','birinci','ikinci','üçüncü','dördüncü','beşinci','altıncı','yedinci','sekizinci','dokuzuncu','onuncu','on birinci','on ikinci'];
function norm(x){return ((x%360)+360)%360;}
function bs(l){return Math.floor(norm(l)/30);}
function buyuk(s){return s.charAt(0).toLocaleUpperCase('tr-TR')+s.slice(1);}
/* Türkçe liste: "A, B ve C" — art arda "ve" kullanma */
function liste(a){ if(!a.length) return ''; if(a.length===1) return a[0];
 return a.slice(0,-1).join(', ')+' ve '+a[a.length-1]; }
function adlar(ps){ return liste(ps.map(function(p){return AD[p.k];})); }

/* --- konu tanımları: anahtar kelimeler + haritada nereye bakılacağı --- */
var KONULAR=[
 {k:'ask',   et:'Aşk ve ilişkiler', ev:7,  gez:'ven',
  ip:['aşk','ask','sevgi','ilişki','iliski','sevgili','partner','evlilik','flört','flort','birlikte','ayrılık','ayrilik','kalp','romantik','çift','cift']},
 {k:'is',    et:'İş ve kariyer',    ev:10, gez:'sat',
  ip:['iş','is ','kariyer','meslek','çalış','calis','patron','terfi','şirket','sirket','başarı','basari','hedef','işim','isim','mesleğ']},
 {k:'para',  et:'Para ve güvenlik', ev:2,  gez:null,
  ip:['para','maddi','kazanç','kazanc','birikim','borç','borc','gelir','maaş','maas','zengin','ekonomi','finans','güvence','guvence']},
 {k:'aile',  et:'Aile ve kökler',   ev:4,  gez:'moon',
  ip:['aile','anne','baba','ev ','kök','kok','çocukluk','cocukluk','yuva','memleket','geçmiş','gecmis','ata']},
 {k:'zihin', et:'Zihin ve iletişim',ev:3,  gez:'mer',
  ip:['zihin','düşünce','dusunce','iletişim','iletisim','konuş','konus','yaz','öğren','ogren','okul','eğitim','egitim','fikir','anlat','kafa']},
 {k:'ofke',  et:'Öfke ve enerji',   ev:1,  gez:'mar',
  ip:['öfke','ofke','sinir','kızgın','kizgin','kavga','enerji','cesaret','savaş','savas','tepki','agresif','hırs','hirs']},
 {k:'zor',   et:'En zorlandığım yer',ev:null,gez:'sat',
  ip:['zor','zorlan','sıkıntı','sikinti','engel','korku','kaygı','kaygi','takıl','takil','yetersiz','eksik','ders','sınav','sinav','acı','aci']},
 {k:'guc',   et:'En güçlü yanım',   ev:null,gez:null,
  ip:['güç','guc','güçlü','guclu','yetenek','iyi olduğum','iyi oldugum','avantaj','kuvvet','artı','arti','başarılı','basarili','özellik','ozellik']},
 {k:'cevre', et:'Arkadaşlar ve çevre',ev:11,gez:null,
  ip:['arkadaş','arkadas','çevre','cevre','sosyal','grup','topluluk','dost','ekip','network','insanlar']},
 {k:'ic',    et:'Yalnızlık ve iç dünya',ev:12,gez:'nep',
  ip:['yalnız','yalniz','içe','ice','rüya','ruya','sezgi','ruh','huzur','kaçış','kacis','dinlen','iç dünya','ic dunya','gizli']}
];

function anahtarla(s){
 return String(s||'').toLocaleLowerCase('tr-TR')
  .replace(/İ/g,'i').replace(/I/g,'ı');
}
function konuBul(soru){
 var q=anahtarla(soru), en=null, enP=0;
 KONULAR.forEach(function(K){
  var p=0;
  K.ip.forEach(function(w){ if(q.indexOf(anahtarla(w))>=0) p+=w.length; });
  if(p>enP){ enP=p; en=K; }
 });
 return en;
}

/* --- haritadan olgu çıkarma --- */
function kur(ch){
 var pl={}; (ch.pls||[]).forEach(function(p){ pl[p.k]=p; });
 var c=ch.c||null, saatsiz=!!ch.noTime;
 function evBurcu(h){ return (!c||saatsiz)?null:bs(c[h]); }
 function evYoneticisi(h){ var s=evBurcu(h); return s===null?null:YONETICI[s]; }
 function evdekiler(h){
  if(saatsiz) return [];
  return (ch.pls||[]).filter(function(p){ return p.house===h && /^(sun|moon|mer|ven|mar|jup|sat|ura|nep|plu)$/.test(p.k); });
 }
 function dignite(k){
  var p=pl[k]; if(!p) return null;
  if(!window.SorbiDignite || ch.day===undefined || ch.day===null) return null;
  try{ return window.SorbiDignite.tekil(k,p.lon,ch.day); }catch(e){ return null; }
 }
 return {pl:pl,saatsiz:saatsiz,evBurcu:evBurcu,evYoneticisi:evYoneticisi,evdekiler:evdekiler,dignite:dignite,gunduz:ch.day};
}

function durumCumlesi(k,H){
 var d=H.dignite(k), p=H.pl[k]; if(!p) return '';
 var b=BURC[bs(p.lon)];
 if(!d) return AD[k]+' '+b+' burcunda';
 if(d.puan>=4) return AD[k]+' '+b+' burcunda güçlü duruyor';
 if(d.puan<=-4) return AD[k]+' '+b+' burcunda yabancı toprakta';
 if(d.peregrin) return AD[k]+' '+b+' burcunda özel bir güç almıyor';
 return AD[k]+' '+b+' burcunda karışık duruyor';
}
function nerede(k,H){ var p=H.pl[k]; return (p&&p.house)?buyuk(SIRA[p.house])+' evde':''; }

/* --- konu bazlı cevaplar: hepsi olasılık kipinde --- */
var METIN={
 ask:function(H){
  var y=H.evYoneticisi(7), ven=H.pl.ven, icinde=H.evdekiler(7), d=[];
  var c=[];
  if(ven) c.push('Aşkta ölçün Venüs: '+durumCumlesi('ven',H)+(nerede('ven',H)?', '+nerede('ven',H):'')+'.');
  if(ven) d.push('Venüs '+BURC[bs(ven.lon)]);
  if(y&&H.pl[y]){ c.push('İlişki evinin yöneticisi '+AD[y]+': '+durumCumlesi(y,H).replace(AD[y]+' ','')+'; bağ kurma biçimin bu gezegenin rengini taşıyabilir.'); d.push('7. ev yöneticisi '+AD[y]); }
  if(icinde.length) { c.push(buyuk(SIRA[7])+' evinde '+adlar(icinde)+' var — ilişkilerin hayatında sessiz bir alan olmayabilir.'); d.push('7. evde '+adlar(icinde)); }
  if(!c.length) c.push('Doğum saatin olmadan ilişki evini okuyamıyorum, ama Venüs '+(ven?BURC[bs(ven.lon)]:'')+' senin sevme dilini gösteriyor.');
  return {c:c,d:d};
 },
 is:function(H){
  var y=H.evYoneticisi(10), icinde=H.evdekiler(10), c=[], d=[];
  if(H.saatsiz) return {c:['Kariyer evi doğum saatine bağlı; saatini bilmeden onuncu evi okuyamıyorum. Yine de Satürn ve Güneş konumun iş disiplinin hakkında fikir veriyor: '+durumCumlesi('sat',H)+'.'],d:['Satürn '+BURC[bs(H.pl.sat.lon)]]};
  if(y&&H.pl[y]){ c.push('Kariyer evinin yöneticisi '+AD[y]+': '+durumCumlesi(y,H).replace(AD[y]+' ','')+(nerede(y,H)?', '+nerede(y,H):'')+'. Mesleki yönün bu gezegenin ilgilendiği alana kayma eğiliminde olabilir.'); d.push('10. ev yöneticisi '+AD[y]); }
  if(icinde.length){ c.push('Onuncu evinde '+adlar(icinde)+' var; görünür olmak senin için doğal bir yer olabilir.'); d.push('10. evde '+adlar(icinde)); }
  c.push('Satürn '+(H.pl.sat?BURC[bs(H.pl.sat.lon)]:'')+': ustalaşman zaman isteyebilir ama kalıcı olabilir.');
  return {c:c,d:d};
 },
 para:function(H){
  var y=H.evYoneticisi(2), icinde=H.evdekiler(2), c=[], d=[];
  if(H.saatsiz) return {c:['Para evi doğum saatine bağlı; saatini bilmeden ikinci evi okuyamıyorum.'],d:[]};
  if(y&&H.pl[y]){ c.push('Kaynak evinin yöneticisi '+AD[y]+': '+durumCumlesi(y,H).replace(AD[y]+' ','')+(nerede(y,H)?', '+nerede(y,H):'')+'. Kazanma biçimin bu gezegenin doğasına yakın olabilir.'); d.push('2. ev yöneticisi '+AD[y]); }
  if(icinde.length){ c.push('İkinci evinde '+adlar(icinde)+' var.'); d.push('2. evde '+adlar(icinde)); }
  c.push('Bu bir gelir tahmini değil; haritanın hangi araçla güvence kurmaya eğilimli olduğunu söylüyor.');
  return {c:c,d:d};
 },
 aile:function(H){
  var y=H.evYoneticisi(4), ay=H.pl.moon, c=[], d=[];
  if(ay){ c.push('Kökün ve iç güvenliğin Ay ile ölçülür: '+durumCumlesi('moon',H)+(nerede('moon',H)?', '+nerede('moon',H):'')+'.'); d.push('Ay '+BURC[bs(ay.lon)]); }
  if(y&&H.pl[y]){ c.push('Aile evinin yöneticisi '+AD[y]+': '+durumCumlesi(y,H).replace(AD[y]+' ','')+'; çocukluk zemininin tonu bu gezegenden okunabilir.'); d.push('4. ev yöneticisi '+AD[y]); }
  return {c:c,d:d};
 },
 zihin:function(H){
  var c=[], d=[], y=H.evYoneticisi(3);
  c.push('Zihnin Merkür ile ölçülür: '+durumCumlesi('mer',H)+(nerede('mer',H)?', '+nerede('mer',H):'')+'.');
  d.push('Merkür '+BURC[bs(H.pl.mer.lon)]);
  if(H.pl.mer && H.pl.mer.rx) c.push('Doğduğunda Merkür geri gidiyordu — düşünceni dışa vermeden önce içeride birkaç kez kurmuş olabilirsin.');
  if(y&&H.pl[y]){ c.push('İletişim evinin yöneticisi '+AD[y]+'; öğrenme ve anlatma biçimin bu gezegene benzeyebilir.'); d.push('3. ev yöneticisi '+AD[y]); }
  return {c:c,d:d};
 },
 ofke:function(H){
  var c=[], d=[];
  c.push('Öfken ve itici gücün Mars: '+durumCumlesi('mar',H)+(nerede('mar',H)?', '+nerede('mar',H):'')+'.');
  d.push('Mars '+BURC[bs(H.pl.mar.lon)]);
  if(H.gunduz!==undefined&&H.gunduz!==null){
   c.push(H.gunduz
    ? 'Gündüz doğduğun için Mars bu haritada sect dışı: tepkin gerekenden sert çıkabilir, soğuması zaman alabilir.'
    : 'Gece doğduğun için Mars senin tarafında: öfkeni işe çevirmek sana daha kolay gelebilir.');
   d.push(H.gunduz?'gündüz doğumu':'gece doğumu');
  }
  return {c:c,d:d};
 },
 zor:function(H){
  var c=[], d=[];
  c.push('Haritanın en çok emek isteyen yeri Satürn: '+durumCumlesi('sat',H)+(nerede('sat',H)?', '+nerede('sat',H):'')+'.');
  d.push('Satürn '+BURC[bs(H.pl.sat.lon)]);
  if(H.gunduz!==undefined&&H.gunduz!==null){
   var disi=H.gunduz?'mar':'sat';
   c.push((H.gunduz?'Gündüz':'Gece')+' doğmuşsun; bu haritada işi zorlaştıran taraf '+AD[disi]+' — '+durumCumlesi(disi,H).replace(AD[disi]+' ','')+'. Bu alanda erken yaşta fazla ciddiyet öğrenmiş olabilirsin.');
   d.push('sect dışı kötücü: '+AD[disi]);
  }
  c.push('Zorluk kader değil; haritanın hangi kasını çalıştırmanı istediği olabilir.');
  return {c:c,d:d};
 },
 guc:function(H){
  var en=null, enP=-99;
  ['sun','moon','mer','ven','mar','jup','sat'].forEach(function(k){
   var d=H.dignite(k); if(d && d.puan>enP){ enP=d.puan; en=k; }
  });
  var c=[], d=[];
  if(en && enP>0){
   c.push('Haritanda en rahat çalışan gezegen '+AD[en]+': '+durumCumlesi(en,H)+(nerede(en,H)?', '+nerede(en,H):'')+'.');
   c.push('Bu alanda kendini zorlamadan iş görebilirsin; yorulduğunda buraya dönmek seni toparlayabilir.');
   d.push(AD[en]+' esansiyel puan +'+enP);
  } else {
   c.push('Klasik yedi gezegenin hiçbiri kendi evinde değil; gücün tek bir yerde toplanmak yerine dağılmış olabilir.');
   c.push('Bu bir eksiklik değil: yönü sen verdiğinde esneklik avantaja dönebilir.');
   d.push('hiçbiri güçlü konumda değil');
  }
  return {c:c,d:d};
 },
 cevre:function(H){
  var y=H.evYoneticisi(11), icinde=H.evdekiler(11), c=[], d=[];
  if(H.saatsiz) return {c:['Arkadaşlık evi doğum saatine bağlı; saatini bilmeden on birinci evi okuyamıyorum.'],d:[]};
  if(y&&H.pl[y]){ c.push('Çevre evinin yöneticisi '+AD[y]+': '+durumCumlesi(y,H).replace(AD[y]+' ','')+'; seni besleyen insan tipi bu gezegene benzeyebilir.'); d.push('11. ev yöneticisi '+AD[y]); }
  if(icinde.length){ c.push('On birinci evinde '+adlar(icinde)+' var — gruplar hayatında ağırlık taşıyabilir.'); d.push('11. evde '+adlar(icinde)); }
  return {c:c,d:d};
 },
 ic:function(H){
  var y=H.evYoneticisi(12), icinde=H.evdekiler(12), c=[], d=[];
  if(H.saatsiz) return {c:['On ikinci ev doğum saatine bağlı; saatini bilmeden okuyamıyorum. Neptün '+BURC[bs(H.pl.nep.lon)]+' yine de sezgi ve kaçış biçimin hakkında fikir veriyor.'],d:['Neptün '+BURC[bs(H.pl.nep.lon)]]};
  if(icinde.length){ c.push('On ikinci evinde '+adlar(icinde)+' var; bu alanlar hayatının görünmeyen tarafında çalışıyor olabilir.'); d.push('12. evde '+adlar(icinde)); }
  if(y&&H.pl[y]){ c.push('On ikinci evin yöneticisi '+AD[y]+': '+durumCumlesi(y,H).replace(AD[y]+' ','')+'; geri çekildiğinde seni toparlayan şey buradan okunabilir.'); d.push('12. ev yöneticisi '+AD[y]); }
  if(!c.length) c.push('On ikinci evin boş — içe dönüş senin için sürekli bir tema olmayabilir, ihtiyaç duyduğunda uğradığın bir yer olabilir.');
  return {c:c,d:d};
 }
};

function cevapla(ch,soru){
 var K=konuBul(soru);
 if(!K) return null;
 var H=kur(ch), r;
 try{ r=METIN[K.k](H); }catch(e){ return null; }
 if(!r || !r.c.length) return null;
 return { konu:K.k, baslik:K.et, metin:r.c, dayanak:r.d };
}

window.SorbiSohbet={
 konular: KONULAR.map(function(K){ return {k:K.k, et:K.et}; }),
 cevapla: cevapla,
 konuBul: konuBul
};
})();
