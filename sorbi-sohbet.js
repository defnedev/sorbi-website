/* SorbiSohbet — okuma sonrası tek soruluk sohbet.
 * LLM YOK: cevaplar kullanıcının kendi haritasından, tarayıcıda, kural tabanlı üretilir.
 * Neden: (1) soru başına API maliyeti yok, (2) her cümleyi biz yazdığımız için
 * marka anayasasına ve reklam yasağına uyum garanti, (3) uydurma yok — her cevap
 * gerçek gezegen/ev/dignite verisine dayanıyor ve dayanağı ekranda gösteriliyor.
 *
 * Mobil AI sohbetiyle hizalanan kurallar (consultation/prompts.py ile aynı çizgi):
 *  - İskelet: Özet (1 cümle) + Yorum (en fazla 2 dayanak cümlesi) + Zamanlama (yalnız
 *    gerçekten hesaplanmış geçiş verisi varsa) + Sınır (hassas konuda tek satır).
 *  - Anti-halüsinasyon: her olgu sohbete verilen harita nesnesinden gelir. Saat yoksa
 *    ev / yükselen / sect okunmaz ve bu açıkça söylenir.
 *  - Olasılık kipi zorunlu: "olacak / kesinlikle / mutlaka / -acaksın" son aşamada süzülür.
 *  - Hizmet satışı, premium, abonelik, "bize yaz" dili yok (ozTest bunu tarar).
 *  - Uzunluk: cevap en fazla 90 kelime.
 *  - Kriz sinyali: astroloji cevabı yerine sıcak bir yönlendirme metni.
 */
(function(){
'use strict';
var BURC=['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
var AD={sun:'Güneş',moon:'Ay',mer:'Merkür',ven:'Venüs',mar:'Mars',jup:'Jüpiter',sat:'Satürn',ura:'Uranüs',nep:'Neptün',plu:'Plüton'};
var YONETICI=['mar','ven','mer','moon','sun','mer','ven','mar','jup','sat','sat','jup'];
var SIRA=['','birinci','ikinci','üçüncü','dördüncü','beşinci','altıncı','yedinci','sekizinci','dokuzuncu','onuncu','on birinci','on ikinci'];
var MAX_KELIME=90;
function norm(x){return ((x%360)+360)%360;}
function bs(l){return Math.floor(norm(l)/30);}
function buyuk(s){return s.charAt(0).toLocaleUpperCase('tr-TR')+s.slice(1);}
/* Türkçe liste: "A, B ve C" — art arda "ve" kullanma */
function liste(a){ if(!a.length) return ''; if(a.length===1) return a[0];
 return a.slice(0,-1).join(', ')+' ve '+a[a.length-1]; }
function adlar(ps){ return liste(ps.map(function(p){return AD[p.k];})); }
function kelimeSay(t){ var m=String(t||'').trim().match(/\S+/g); return m?m.length:0; }

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

/* --- kriz sinyali: astroloji cevabı verilmez, yönlendirme döner --- */
var KRIZ_IP=['intihar','kendimi öldür','kendimi oldur','kendime zarar','ölmek istiyorum','olmek istiyorum',
 'yaşamak istemiyorum','yasamak istemiyorum','canıma kıy','canima kiy','hayatıma son','hayatima son',
 'kendimi kes','bileklerimi','yok olmak istiyorum','ölsem daha iyi','olsem daha iyi','kendimi as'];
function krizMi(soru){
 var q=anahtarla(soru);
 for(var i=0;i<KRIZ_IP.length;i++) if(q.indexOf(anahtarla(KRIZ_IP[i]))>=0) return true;
 return false;
}
var KRIZ_METIN=[
 'Bunu yazdığın için teşekkür ederim; bu soruyu bir haritaya bırakmak istemiyorum, çünkü burada önemli olan gökyüzü değil sensin.',
 'Şu an güvende olmak öncelik. Güvendiğin bir insana bugün ulaşmayı ve bir ruh sağlığı uzmanıyla ya da Türkiye\'deki acil yardım / kriz destek hatlarıyla konuşmayı düşünebilirsin.',
 'Hazır olduğunda haritan hep burada; ama önce sen.'
];

/* --- hassas konu tespiti: tek satırlık sınır cümlesi --- */
var HASSAS=[
 {t:'tıbbi',    ip:['sağlık','saglik','hasta','kanser','ameliyat','ilaç','ilac','doktor','depresyon','panik','anksiyete','hamile','gebe','teşhis','teshis','tedavi','ağrı','agri']},
 {t:'finansal', ip:['borç','borc','kredi','yatırım','yatirim','kripto','borsa','hisse','iflas','icra','faiz','para','maddi','kazanç','kazanc','gelir','maaş','maas']},
 {t:'hukuki',   ip:['dava','mahkeme','avukat','hukuk','ceza','boşan','bosan','velayet','nafaka','sözleşme','sozlesme','miras','tazminat']},
 {t:'ilişki',   ip:['aldat','terk','ayrıl','ayril','boşan','bosan','şiddet','siddet','kriz','bitir','kopuş','kopus']},
 {t:'ölüm',     ip:['ölüm','olum','öldü','oldu mu','cenaze','kaybettim','vefat','yas ']}
];
function hassasBul(soru,konuK){
 var q=anahtarla(soru), bulunan=[];
 HASSAS.forEach(function(Hs){
  for(var i=0;i<Hs.ip.length;i++){ if(q.indexOf(anahtarla(Hs.ip[i]))>=0){ bulunan.push(Hs.t); break; } }
 });
 if(konuK==='para' && bulunan.indexOf('finansal')<0) bulunan.push('finansal');
 return bulunan;
}
function sinirCumlesi(tipler){
 if(!tipler.length) return '';
 var alan=[];
 if(tipler.indexOf('tıbbi')>=0) alan.push('tıbbi');
 if(tipler.indexOf('hukuki')>=0) alan.push('hukuki');
 if(tipler.indexOf('finansal')>=0) alan.push('finansal');
 if(alan.length) return 'Bu bir tavsiye değil; '+liste(alan)+' bir karar için uzmana danışmak gerekebilir.';
 return 'Bu bir tavsiye değil; zor bir dönemde bir uzmanla konuşmak iyi gelebilir.';
}

/* --- olasılık kipi süzgeci: kesinlik kalıpları üretilemez --- */
var KESIN_RE=/olacak|kesinlikle|mutlaka|acaksın|eceksin|acaksınız|eceksiniz|\bkesin\b|\basla\b|garanti/i;
var KIP_DEGISIM=[
 [/\bolacaksınız\b/gi,'olabilirsiniz'],[/\bolacaksın\b/gi,'olabilirsin'],[/\bolacaktır\b/gi,'olabilir'],
 [/\bolacaklar\b/gi,'olabilirler'],[/\bolacak\b/gi,'olabilir'],
 [/\bkesinlikle\s+/gi,''],[/\bmutlaka\s+/gi,''],[/\bkesin\s+/gi,''],[/\basla\s+/gi,''],
 [/(\S+)acaksın\b/gi,'$1abilirsin'],[/(\S+)eceksin\b/gi,'$1ebilirsin']
];
function kipSuz(cumle){
 var t=String(cumle||'');
 if(!KESIN_RE.test(t)) return t;
 KIP_DEGISIM.forEach(function(r){ t=t.replace(r[0],r[1]); });
 t=t.replace(/\s{2,}/g,' ').trim();
 if(KESIN_RE.test(t)) return ''; /* çevrilemediyse cümle atlanır */
 return t.charAt(0).toLocaleUpperCase('tr-TR')+t.slice(1);
}
function suz(cumleler){ return cumleler.map(kipSuz).filter(Boolean); }

/* --- haritadan olgu çıkarma: yalnız verilen nesneden --- */
function kur(ch){
 var pl={}; (ch.pls||[]).forEach(function(p){ pl[p.k]=p; });
 var saatsiz=!!ch.noTime, c=(ch.c&&!saatsiz)?ch.c:null;
 /* saat yoksa sect (gündüz/gece) de bilinmez: öğle varsayımıyla gelen day kullanılmaz */
 var gunduz=(saatsiz||ch.day===undefined||ch.day===null)?null:!!ch.day;
 function evBurcu(h){ return c?bs(c[h]):null; }
 function evYoneticisi(h){ var s=evBurcu(h); return s===null?null:YONETICI[s]; }
 function evdekiler(h){
  if(saatsiz) return [];
  return (ch.pls||[]).filter(function(p){ return p.house===h && /^(sun|moon|mer|ven|mar|jup|sat|ura|nep|plu)$/.test(p.k); });
 }
 function dignite(k){
  var p=pl[k]; if(!p || !window.SorbiDignite) return null;
  try{
   if(gunduz!==null) return window.SorbiDignite.tekil(k,p.lon,gunduz);
   /* sect bilinmiyor: sect'e bağlı üçlü puanı düşürülür (iki hesabın küçüğü) */
   var a=window.SorbiDignite.tekil(k,p.lon,true), b=window.SorbiDignite.tekil(k,p.lon,false);
   return a.puan<=b.puan?a:b;
  }catch(e){ return null; }
 }
 /* saat yoksa Ay günde ~13° gider: burç sınırına yakınsa uyar */
 function aySinirda(){ var m=pl.moon; if(!m||!saatsiz) return false; var g=norm(m.lon)%30; return g<7||g>23; }
 return {pl:pl,saatsiz:saatsiz,gunduz:gunduz,evBurcu:evBurcu,evYoneticisi:evYoneticisi,evdekiler:evdekiler,dignite:dignite,aySinirda:aySinirda};
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
function nerede(k,H){ var p=H.pl[k]; return (!H.saatsiz&&p&&p.house)?SIRA[p.house]+' evde':''; }
function burc(k,H){ var p=H.pl[k]; return p?BURC[bs(p.lon)]:''; }
function evYok(ev,ad){ return 'Saat olmadan ev ve yükselen hesaplanamıyor; bu yüzden '+ad+' ('+ev+'. ev) katmanına bakamıyorum.'; }
function yonCumle(H,ev,rol){
 var y=H.evYoneticisi(ev); if(!y||!H.pl[y]) return null;
 return {c:rol+' evinin yöneticisi '+AD[y]+': '+durumCumlesi(y,H).replace(AD[y]+' ','')+(nerede(y,H)?', '+nerede(y,H):'')+'.', d:ev+'. ev yöneticisi '+AD[y], k:y};
}
function icCumle(H,ev,son){
 var i=H.evdekiler(ev); if(!i.length) return null;
 return {c:buyuk(SIRA[ev])+' evinde '+adlar(i)+' var; '+son, d:ev+'. evde '+adlar(i)};
}

/* --- konu bazlı cevaplar: ozet (1 cümle) + yorum (en fazla 2 dayanak cümlesi) --- */
var METIN={
 ask:function(H){
  var y=[], d=[], odak=['ven'];
  if(H.pl.ven){ y.push('Sevme dilin Venüs: '+durumCumlesi('ven',H)+(nerede('ven',H)?', '+nerede('ven',H):'')+'.'); d.push('Venüs '+burc('ven',H)); }
  if(H.saatsiz){ y.push(evYok(7,'ilişki')); }
  else {
   var r=yonCumle(H,7,'İlişki'); if(r){ y.push(r.c.replace(/\.$/,'; bağ kurma biçimin bu gezegenin rengini taşıyabilir.')); d.push(r.d); odak.push(r.k); }
   else { var i=icCumle(H,7,'ilişkiler hayatında sessiz bir alan olmayabilir.'); if(i){ y.push(i.c); d.push(i.d); } }
  }
  return {o:'İlişkide nasıl bağ kurduğun haritanda Venüs'+(H.saatsiz?'':' ve yedinci ev')+' üzerinden okunabilir.', y:y, d:d, odak:odak};
 },
 is:function(H){
  var y=[], d=[], odak=['sat'];
  if(H.saatsiz){
   y.push(evYok(10,'kariyer'));
   if(H.pl.sat){ y.push('Satürn yine de iş disiplinin hakkında fikir verebilir: '+durumCumlesi('sat',H)+'.'); d.push('Satürn '+burc('sat',H)); }
   return {o:'Kariyer evi doğum saatine bağlı; saatsiz haritada yalnız Satürn katmanına bakabiliyorum.', y:y, d:d, odak:odak};
  }
  var r=yonCumle(H,10,'Kariyer'); if(r){ y.push(r.c.replace(/\.$/,'; mesleki yönün bu gezegenin alanına kayabilir.')); d.push(r.d); odak.push(r.k); }
  var i=icCumle(H,10,'görünür olmak sana doğal gelebilir.'); if(i&&y.length<2){ y.push(i.c); d.push(i.d); }
  if(y.length<2&&H.pl.sat){ y.push('Satürn '+burc('sat',H)+': ustalaşman zaman isteyebilir ama kalıcı olabilir.'); d.push('Satürn '+burc('sat',H)); }
  return {o:'İşte nereye yöneldiğin onuncu evin yöneticisinden okunabilir.', y:y, d:d, odak:odak};
 },
 para:function(H){
  var y=[], d=[], odak=[];
  if(H.saatsiz) return {o:'Bu bir gelir tahmini değil; kaynak katmanı da doğum saatine bağlı.', y:[evYok(2,'kaynak')], d:d, odak:odak};
  var r=yonCumle(H,2,'Kaynak'); if(r){ y.push(r.c.replace(/\.$/,'; kazanma biçimin bu gezegenin doğasına yakın olabilir.')); d.push(r.d); odak.push(r.k); }
  var i=icCumle(H,2,'güvence bu alanlarla ilgili olabilir.'); if(i){ y.push(i.c); d.push(i.d); }
  return {o:'Bu bir gelir tahmini değil; harita hangi araçla güvence kurmaya eğilimli olduğunu gösterebilir.', y:y, d:d, odak:odak};
 },
 aile:function(H){
  var y=[], d=[], odak=['moon'];
  if(H.pl.moon){ y.push('Kökün ve iç güvenliğin Ay ile ölçülür: '+durumCumlesi('moon',H)+(nerede('moon',H)?', '+nerede('moon',H):'')+'.'); d.push('Ay '+burc('moon',H)); }
  if(H.saatsiz){ y.push(H.aySinirda()?'Saat olmadan Ay burcu sınırda kalabiliyor ve dördüncü ev hesaplanamıyor; bu katmana bakamıyorum.':evYok(4,'aile')); }
  else { var r=yonCumle(H,4,'Aile'); if(r){ y.push(r.c.replace(/\.$/,'; çocukluk zemininin tonu buradan okunabilir.')); d.push(r.d); odak.push(r.k); } }
  return {o:'Aile ve kök duygusu haritanda Ay'+(H.saatsiz?'':' ve dördüncü ev')+' üzerinden okunabilir.', y:y, d:d, odak:odak};
 },
 zihin:function(H){
  var y=[], d=[], odak=['mer'];
  if(H.pl.mer){ y.push('Zihnin Merkür ile ölçülür: '+durumCumlesi('mer',H)+(nerede('mer',H)?', '+nerede('mer',H):'')+'.'); d.push('Merkür '+burc('mer',H)); }
  if(H.pl.mer&&H.pl.mer.rx){ y.push('Doğduğunda Merkür geri gidiyordu; düşünceni dışa vermeden önce içeride birkaç kez kurmuş olabilirsin.'); d.push('Merkür retro'); }
  else if(H.saatsiz){ y.push(evYok(3,'iletişim')); }
  else { var r=yonCumle(H,3,'İletişim'); if(r){ y.push(r.c.replace(/\.$/,'; öğrenme biçimin bu gezegene benzeyebilir.')); d.push(r.d); odak.push(r.k); } }
  return {o:'Düşünme ve anlatma biçimin Merkür'+(H.saatsiz?'':' ve üçüncü ev')+' üzerinden okunabilir.', y:y, d:d, odak:odak};
 },
 ofke:function(H){
  var y=[], d=[], odak=['mar'];
  if(H.pl.mar){ y.push('Öfken ve itici gücün Mars: '+durumCumlesi('mar',H)+(nerede('mar',H)?', '+nerede('mar',H):'')+'.'); d.push('Mars '+burc('mar',H)); }
  if(H.gunduz===null){ y.push('Saat olmadan gündüz/gece doğumu bilinmiyor; Mars\'ın sect katmanına bakamıyorum.'); }
  else {
   y.push(H.gunduz?'Gündüz doğduğun için Mars sect dışı: tepkin gerekenden sert çıkabilir, soğuması zaman alabilir.':'Gece doğduğun için Mars senin tarafında: öfkeni işe çevirmek daha kolay gelebilir.');
   d.push(H.gunduz?'gündüz doğumu':'gece doğumu');
  }
  return {o:'Öfkenin nasıl çıktığı Mars\'ın burcu'+(H.gunduz===null?'':' ve sect durumu')+' üzerinden okunabilir.', y:y, d:d, odak:odak};
 },
 zor:function(H){
  var y=[], d=[], odak=['sat'];
  if(H.pl.sat){ y.push('Haritanın en çok emek isteyen yeri Satürn: '+durumCumlesi('sat',H)+(nerede('sat',H)?', '+nerede('sat',H):'')+'.'); d.push('Satürn '+burc('sat',H)); }
  if(H.gunduz===null){ y.push('Saat olmadan sect bilinmediği için hangi kötücülün daha zorladığına bakamıyorum.'); }
  else {
   var disi=H.gunduz?'mar':'sat';
   if(H.pl[disi]){ y.push((H.gunduz?'Gündüz':'Gece')+' doğmuşsun; işi zorlaştıran taraf '+AD[disi]+', '+durumCumlesi(disi,H).replace(AD[disi]+' ','')+'; burada erken yaşta fazla ciddiyet öğrenmiş olabilirsin.'); d.push('sect dışı kötücü: '+AD[disi]); if(odak.indexOf(disi)<0) odak.push(disi); }
  }
  return {o:'Zorluk kader değil; harita hangi kasını çalıştırmanı istediğini gösterebilir.', y:y, d:d, odak:odak};
 },
 guc:function(H){
  var en=null, enP=-99;
  ['sun','moon','mer','ven','mar','jup','sat'].forEach(function(k){
   var dg=H.dignite(k); if(dg && dg.puan>enP){ enP=dg.puan; en=k; }
  });
  var y=[], d=[], odak=[];
  if(en && enP>0){
   y.push('Haritanda en rahat çalışan gezegen '+AD[en]+': '+durumCumlesi(en,H)+(nerede(en,H)?', '+nerede(en,H):'')+'.');
   y.push('Bu alanda kendini zorlamadan iş görebilirsin; yorulduğunda buraya dönmek seni toparlayabilir.');
   d.push(AD[en]+' esansiyel puan +'+enP+(H.saatsiz?' (sect bilinmeden)':'')); odak.push(en);
  } else if(en){
   y.push('Klasik yedi gezegenin hiçbiri kendi evinde değil; gücün tek bir yerde toplanmak yerine dağılmış olabilir.');
   y.push('Bu bir eksiklik değil: yönü sen verdiğinde esneklik avantaja dönebilir.');
   d.push('hiçbiri güçlü konumda değil');
  } else {
   y.push('Dignite tablosu yüklenmediği için güç sıralaması yapamıyorum.');
  }
  return {o:'En güçlü yanın, esansiyel dignite tablosunda en yüksek puanlı gezegenden okunabilir.', y:y, d:d, odak:odak};
 },
 cevre:function(H){
  var y=[], d=[], odak=[];
  if(H.saatsiz) return {o:'Çevre okuması on birinci eve, o da doğum saatine bağlı.', y:[evYok(11,'çevre')], d:d, odak:odak};
  var r=yonCumle(H,11,'Çevre'); if(r){ y.push(r.c.replace(/\.$/,'; seni besleyen insan tipi bu gezegene benzeyebilir.')); d.push(r.d); odak.push(r.k); }
  var i=icCumle(H,11,'gruplar hayatında ağırlık taşıyabilir.'); if(i){ y.push(i.c); d.push(i.d); }
  return {o:'Çevrenin sana ne kattığı on birinci evin yöneticisinden okunabilir.', y:y, d:d, odak:odak};
 },
 ic:function(H){
  var y=[], d=[], odak=['nep'];
  if(H.saatsiz){
   y.push(evYok(12,'iç dünya'));
   if(H.pl.nep){ y.push('Neptün '+burc('nep',H)+' yine de sezgi ve kaçış biçimin hakkında fikir verebilir.'); d.push('Neptün '+burc('nep',H)); }
   return {o:'On ikinci ev doğum saatine bağlı; saatsiz haritada yalnız Neptün katmanına bakabiliyorum.', y:y, d:d, odak:odak};
  }
  var i=icCumle(H,12,'bu alanlar hayatının görünmeyen tarafında çalışıyor olabilir.'); if(i){ y.push(i.c); d.push(i.d); }
  var r=yonCumle(H,12,'On ikinci'); if(r&&y.length<2){ y.push(r.c.replace(/\.$/,'; geri çekildiğinde seni toparlayan şey buradan okunabilir.')); d.push(r.d); odak.push(r.k); }
  if(!y.length){ y.push('On ikinci evin boş; içe dönüş senin için sürekli bir tema olmayabilir, ihtiyaç duyduğunda uğradığın bir yer olabilir.'); d.push('12. ev boş'); }
  return {o:'İç dünyan ve geri çekilme biçimin on ikinci ev üzerinden okunabilir.', y:y, d:d, odak:odak};
 }
};

/* --- zamanlama: yalnız gerçekten hesaplanmış geçiş verisi varsa ---
 * Kaynak: ch.gecis (dışarıdan verilen [{k,lon}]) ya da SorbiAstro.now ile bugünün
 * gökyüzü (doğum yeri/saat dilimi ch.tam.o'dan). Yalnız Jüpiter/Satürn, orb ≤ 3°. */
var _gecisOnbellek=(typeof WeakMap==='function')?new WeakMap():null;
function gecisAl(ch){
 if(ch.gecis && ch.gecis.length) return ch.gecis;
 if(_gecisOnbellek && _gecisOnbellek.has(ch)) return _gecisOnbellek.get(ch);
 var g=null;
 try{
  var o=ch.tam&&ch.tam.o;
  if(window.SorbiAstro && o && isFinite(o.lat) && isFinite(o.lon)){
   var n=window.SorbiAstro.now({lat:o.lat,lon:o.lon,tz:o.tz||'Europe/Istanbul',house:'P'});
   g=(n.pls||[]).filter(function(p){ return p.k==='jup'||p.k==='sat'; }).map(function(p){ return {k:p.k,lon:p.lon}; });
  }
 }catch(e){ g=null; }
 if(_gecisOnbellek) _gecisOnbellek.set(ch,g);
 return g;
}
/* Türkçe ek: son ünlüye göre yönelme (-e) ve belirtme (-i) hali */
function sonUnlu(ad){ var v=anahtarla(ad).match(/[aeıioöuü]/g); return v?v[v.length-1]:'e'; }
function ekE(ad){ return ad+"'"+(/[aıou]/.test(sonUnlu(ad))?'a':'e'); }
function ekI(ad){ var u=sonUnlu(ad); return ad+"'"+(/[aı]/.test(u)?'ı':/[ou]/.test(u)?'u':/[öü]/.test(u)?'ü':'i'); }
var ACI=[{a:0,n:'kavuşum',sert:false},{a:180,n:'karşıt',sert:true},{a:90,n:'kare',sert:true},{a:120,n:'üçgen',sert:false}];
function zamanlama(ch,H,odak){
 var g=gecisAl(ch); if(!g||!g.length||!odak||!odak.length) return null;
 var en=null;
 g.forEach(function(t){
  odak.forEach(function(k){
   var p=H.pl[k]; if(!p) return;
   if(H.saatsiz && k==='moon') return; /* saatsiz Ay konumu ±7°: geçiş açısı güvenilmez */
   var d=Math.abs(norm(t.lon-p.lon)); if(d>180) d=360-d;
   ACI.forEach(function(A){ var orb=Math.abs(d-A.a); if(orb<=3 && (!en||orb<en.orb)) en={t:t.k,k:k,aci:A,orb:orb}; });
  });
 });
 if(!en) return null;
 var orbTxt=en.orb.toFixed(1).replace('.',',');
 var anlam = en.t==='sat'
  ? (en.aci.sert?'bu dönem burada sabır ve ölçü isteyebilir.':'bu dönem burada yavaş ama kalıcı bir yapı kurmaya elverişli olabilir.')
  : (en.aci.sert?'bu dönem burada abartıya kaçmamak gerekebilir.':'bu dönem burada genişleme ve kolaylık getirebilir.');
 return {c:'Şu sıralar geçiş '+ekI(AD[en.t])+' natal '+ekE(AD[en.k])+' '+en.aci.n+' açısında ('+orbTxt+'°); '+anlam,
         d:'geçiş '+AD[en.t]+' '+en.aci.n+' natal '+AD[en.k]+' ('+orbTxt+'°)'};
}

/* --- uzunluk disiplini: en fazla MAX_KELIME; sıra: zamanlama, sonra 2. yorum düşer --- */
function kisalt(B){
 function toplam(){ return kelimeSay([B.ozet].concat(B.yorum,[B.zamanlama||'',B.sinir||'']).join(' ')); }
 if(toplam()>MAX_KELIME && B.zamanlama) B.zamanlama='';
 while(toplam()>MAX_KELIME && B.yorum.length>1) B.yorum.pop();
 return B;
}

function cevapla(ch,soru){
 if(krizMi(soru)){
  return { konu:'kriz', baslik:'Önce sen', metin:KRIZ_METIN.slice(), dayanak:[], kriz:true,
           bolumler:{ozet:'',yorum:[],zamanlama:'',sinir:''} };
 }
 var K=konuBul(soru);
 if(!K) return null;
 var H=kur(ch), r;
 try{ r=METIN[K.k](H); }catch(e){ return null; }
 if(!r || !r.o) return null;
 var B={ ozet:kipSuz(r.o), yorum:suz(r.y).slice(0,2), zamanlama:'', sinir:'' };
 var z=null; try{ z=zamanlama(ch,H,r.odak); }catch(e){ z=null; }
 if(z){ B.zamanlama=kipSuz(z.c); if(B.zamanlama) r.d.push(z.d); }
 B.sinir=kipSuz(sinirCumlesi(hassasBul(soru,K.k)));
 kisalt(B);
 var metin=['Özet: '+B.ozet];
 if(B.yorum.length) metin.push('Yorum: '+B.yorum.join(' '));
 if(B.zamanlama) metin.push('Zamanlama: '+B.zamanlama);
 if(B.sinir) metin.push('Sınır: '+B.sinir);
 return { konu:K.k, baslik:K.et, metin:metin, dayanak:r.d, bolumler:B, kriz:false, kelime:kelimeSay(metin.join(' ')) };
}

/* --- öz test: yasak dil taraması (kip + ticari dil) --- */
var YASAK_RE=/olacak|kesinlikle|mutlaka|acaksın|eceksin|premium|abonelik|abone ol|danışmanlık|\bDM\b|bize yaz|satın al|ücretli|randevu|paket/i;
function ozTest(ch){
 var sonuc=[];
 KONULAR.forEach(function(K){
  var r=cevapla(ch,K.et); if(!r){ sonuc.push({konu:K.k,ok:false,neden:'cevap yok'}); return; }
  var t=r.metin.join(' '), m=t.match(YASAK_RE);
  sonuc.push({konu:K.k,ok:!m&&r.kelime<=MAX_KELIME,kelime:r.kelime,yasak:m?m[0]:null});
 });
 return sonuc;
}

window.SorbiSohbet={
 konular: KONULAR.map(function(K){ return {k:K.k, et:K.et}; }),
 cevapla: cevapla,
 konuBul: konuBul,
 krizMi: krizMi,
 kipSuz: kipSuz,
 ozTest: ozTest,
 YASAK_RE: YASAK_RE,
 MAX_KELIME: MAX_KELIME
};
})();
