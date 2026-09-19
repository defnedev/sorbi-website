/* sorbi-yildiz.js — nadir yerleşimler
   Doğum haritasındaki, herkeste bulunmayan yapıları bulur.
   Nadirlik oranları 1.367.496 gerçek gökyüzü anından sayıldı (1960-2012, İstanbul).
   Hiçbir cümle kişinin geleceğini söylemez; gökyüzü olgusu + olasılık dili. */
(function(){
'use strict';
var RAD=Math.PI/180, DEG=180/Math.PI;
function norm(x){return ((x%360)+360)%360;}
function ayr(a,b){var d=Math.abs(norm(a-b));return d>180?360-d:d;}
function dk(x){ // derece -> "3°12′"
  var d=Math.floor(x), m=Math.round((x-d)*60); if(m===60){d++;m=0;}
  return d+'°'+(m<10?'0':'')+m+'′';
}
var BURC=['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
/* bulunma hali: unlu uyumu + sert unsuz benzesmesi — elle yazildi, uretilmedi */
var BURCDA=["Koç'ta","Boğa'da","İkizler'de","Yengeç'te","Aslan'da","Başak'ta","Terazi'de","Akrep'te","Yay'da","Oğlak'ta","Kova'da","Balık'ta"];
function konum(l){var s=Math.floor(norm(l)/30), d=norm(l)%30, dd=Math.floor(d), m=Math.round((d-dd)*60);
  if(m===60){dd++;m=0;} return dd+'°'+(m<10?'0':'')+m+'′ '+BURC[s];}

/* ── sabit yıldızlar: ad, J2000 ekliptik boylam, ekliptik enlem, tema ── */
var YIL=[
 ['Algol',56.17,22.4,'yoğunluk','Algol yoğunlukla anılır.'],
 ['Alcyone',60.00,4.1,'keskin görüş','Alcyone görmekle anılır.'],
 ['Aldebaran',69.78,-5.5,'dürüstlük','Aldebaran dürüstlükle anılır.'],
 ['Rigel',76.83,-31.1,'yol gösterme','Rigel öğretmekle anılır.'],
 ['Betelgeuse',88.75,-16.0,'dayanıklılık','Betelgeuse dayanmakla anılır.'],
 ['Sirius',104.08,-39.6,'görünürlük','Sirius görünmekle anılır.'],
 ['Castor',110.23,10.1,'söz','Castor sözle anılır.'],
 ['Pollux',113.22,6.7,'kararlılık','Pollux kararlılıkla anılır.'],
 ['Procyon',115.78,-16.0,'hız','Procyon hızla anılır.'],
 ['Regulus',149.83,0.5,'göz önünde olmak','Regulus görünürlükle anılır.'],
 ['Spica',203.83,-2.1,'yetenek','Spica yetenekle anılır.'],
 ['Arcturus',204.23,30.7,'yol açmak','Arcturus yeni yol açmakla anılır.'],
 ['Antares',249.77,-4.6,'cesaret','Antares cesaretle anılır.'],
 ['Vega',285.32,61.7,'estetik','Vega estetikle anılır.'],
 ['Altair',301.78,29.3,'cüret','Altair cürete anılır.'],
 ['Deneb Algedi',323.55,-2.6,'sorumluluk','Deneb Algedi adaletle anılır.'],
 ['Fomalhaut',333.87,-21.1,'hayal','Fomalhaut hayalle anılır.'],
 ['Achernar',345.32,-59.4,'risk','Achernar riskle anılır.']
];
var YKEY={}; YIL.forEach(function(s){YKEY[s[0]]=s;});

/* ── nadirlik tablosu: sayım sonucu buraya gömülür ── */
var SAY = window.SORBI_YILDIZ_SAY || {n:0};
function ppm(c){ return (!SAY.n||!c) ? null : Math.round(c/SAY.n*1e6); }
function kacta(p){ if(!p) return null; return Math.round(1e6/p); }

var TAKIP=['sun','moon','mer','ven','mar','jup','sat','ura','nep','plu'];
var ADI={sun:'Güneş',moon:'Ay',mer:'Merkür',ven:'Venüs',mar:'Mars',jup:'Jüpiter',
 sat:'Satürn',ura:'Uranüs',nep:'Neptün',plu:'Plüton',asc:'Yükselen',mc:'MC'};
var SAYAD={sun:'Sun',moon:'Moon',mer:'Mercury',ven:'Venus',mar:'Mars',jup:'Jupiter',
 sat:'Saturn',ura:'Uranus',nep:'Neptune',plu:'Pluto',asc:'ASC',mc:'MC'};
var ACILAR=[[0,8,'kavuşum'],[60,4,'altmışlık'],[90,6,'kare'],[120,7,'üçgen'],[180,8,'karşıt']];

function bul(ch, opt){
  opt=opt||{};
  var saatsiz = !!opt.noTime || ch.asc===null || ch.asc===undefined;
  var yil = (ch.o && ch.o.y) ? ch.o.y : 2000;
  var prec = (yil-2000)*0.0139691;
  var P={}, sira=[];
  (ch.pls||[]).forEach(function(p){ if(TAKIP.indexOf(p.k)>=0){P[p.k]=p; sira.push(p.k);} });
  var nesne = sira.slice();
  if(!saatsiz){ P.asc={k:'asc',lon:ch.asc,blat:0}; P.mc={k:'mc',lon:ch.mc,blat:0}; nesne=nesne.concat(['asc','mc']); }
  var B=[];

  /* 1 — sabit yıldız kavuşumu */
  for(var s=0;s<YIL.length;s++){
    var sl=norm(YIL[s][1]+prec);
    for(var i=0;i<nesne.length;i++){
      var k=nesne[i], p=P[k]; if(!p) continue;
      var d=ayr(p.lon,sl); if(d>1) continue;
      var uzak = Math.abs(YIL[s][2])>10;
      B.push({tur:'yildiz', anahtar:YIL[s][0].replace(/\s/g,'')+'|'+SAYAD[k],
        baslik:ADI[k]+', '+YIL[s][0]+' yıldızıyla kavuşumda',
        olcu:dk(d)+' fark',
        kanit:ADI[k]+' '+konum(p.lon)+' · '+YIL[s][0]+' '+yil+' yılında '+konum(sl)
              +' · fark '+dk(d)+' · boylam üzerinden'+(uzak?' (yıldız ekliptiğin '+Math.round(Math.abs(YIL[s][2]))+'° dışında)':''),
        metin:YIL[s][4],
        gez:k, sayac:(SAY.cift||{})[YIL[s][0].replace(/\s/g,'')+'|'+SAYAD[k]]});
    }
  }

  /* 2 — son derece (29°) */
  sira.forEach(function(k){ var p=P[k], d=norm(p.lon)%30; if(d<29) return;
    B.push({tur:'son', anahtar:'son|'+SAYAD[k],
      baslik:ADI[k]+', '+BURC[Math.floor(norm(p.lon)/30)]+' burcunun son derecesinde',
      olcu:konum(p.lon),
      kanit:ADI[k]+' '+konum(p.lon)+' · burcun 29. derecesi, bir sonraki burca 1°\'den az kalmış',
      metin:'Burcun son derecesi geçiş yeridir.',
      gez:k, sayac:(SAY.sonBur||{})[SAYAD[k]+'|'+Math.floor(norm(p.lon)/30)]});
  });

  /* 3 — ilk derece (0°) */
  sira.forEach(function(k){ var p=P[k], d=norm(p.lon)%30; if(d>=1) return;
    B.push({tur:'ilk', anahtar:'ilk|'+SAYAD[k],
      baslik:ADI[k]+', '+BURC[Math.floor(norm(p.lon)/30)]+' burcunun ilk derecesinde',
      olcu:konum(p.lon),
      kanit:ADI[k]+' '+konum(p.lon)+' · burcun 0. derecesi, burca yeni girmiş',
      metin:'Burcun ilk derecesi ham haldir.',
      gez:k, sayac:(SAY.ilkBur||{})[SAYAD[k]+'|'+Math.floor(norm(p.lon)/30)]});
  });

  /* 4 — yığın (aynı burçta 4+ gezegen) */
  (function(){ var c={}; sira.forEach(function(k){ var b=Math.floor(norm(P[k].lon)/30); (c[b]=c[b]||[]).push(k); });
    Object.keys(c).forEach(function(b){ var g=c[b]; if(g.length<4) return;
      var say=(SAY.yiginB||{})[String(Math.min(g.length,6))];
      B.push({tur:'yigin', anahtar:'yigin|'+g.length,
        baslik:BURC[b]+' burcunda '+({4:'dört',5:'beş',6:'altı',7:'yedi'}[g.length]||g.length)+' gezegen',
        olcu:g.map(function(k){return ADI[k];}).join(', '),
        kanit:g.map(function(k){return ADI[k]+' '+konum(P[k].lon);}).join(' · '),
        metin:'Bir burçta bu kadar gezegen toplanınca ağırlık tek yere biner.',
        sayac:say});
    });
  })();

  /* 5 — bağsız gezegen (hiçbir büyük açı yok) */
  sira.forEach(function(k){ var p=P[k], bagli=false;
    for(var i=0;i<sira.length && !bagli;i++){ if(sira[i]===k) continue;
      var a=ayr(p.lon,P[sira[i]].lon);
      for(var j=0;j<ACILAR.length;j++) if(Math.abs(a-ACILAR[j][0])<=ACILAR[j][1]){bagli=true;break;} }
    if(bagli) return;
    B.push({tur:'bagsiz', anahtar:'bagsiz|'+SAYAD[k],
      baslik:ADI[k]+', haritanın geri kalanına bağlı değil',
      olcu:'büyük açı yok',
      kanit:ADI[k]+' '+konum(p.lon)+' · diğer dokuz gezegenin hiçbiriyle kavuşum, altmışlık, kare, üçgen veya karşıtlık kurmuyor',
      metin:'Bağsız gezegen kendi başına çalışır.',
      sayac:(SAY.bagsizGez||{})[SAYAD[k]]});
  });

  /* 6 — sınır dışı deklinasyon */
  sira.forEach(function(k){ if(k==='sun') return; var p=P[k];
    if(p.dec===undefined || p.dec===null) return;
    if(Math.abs(p.dec)<=23.436) return;
    B.push({tur:'oob', anahtar:'oob|'+SAYAD[k],
      baslik:ADI[k]+', Güneş\'in sınırının dışında',
      olcu:dk(Math.abs(p.dec))+' deklinasyon',
      kanit:ADI[k]+' deklinasyonu '+(p.dec>0?'+':'-')+dk(Math.abs(p.dec))+' · Güneş\'in ulaşabildiği en uç değer 23°26′ · bu gezegen o sınırın dışında',
      metin:'Sınır dışı bir gezegen kuralın dışından çalışır.',
      sayac:(SAY.oobGez||{})[SAYAD[k]]});
  });

  /* 7 — tam açı (10 dakikadan yakın) */
  for(var i=0;i<sira.length;i++) for(var j=i+1;j<sira.length;j++){
    var a=ayr(P[sira[i]].lon,P[sira[j]].lon);
    for(var q=0;q<ACILAR.length;q++){ var f=Math.abs(a-ACILAR[q][0]); if(f>0.1667) continue;
      B.push({tur:'tam', anahtar:'tam|'+ACILAR[q][0],
        baslik:ADI[sira[i]]+' ve '+ADI[sira[j]]+', tam '+ACILAR[q][2],
        olcu:dk(f)+' sapma',
        kanit:ADI[sira[i]]+' '+konum(P[sira[i]].lon)+' · '+ADI[sira[j]]+' '+konum(P[sira[j]].lon)
             +' · aradaki açı '+dk(a)+', tam '+ACILAR[q][0]+'°\'den '+dk(f)+' sapıyor',
        metin:'Açı tam olduğunda iki gezegen tek parça gibi çalışır.',
        sayac:(SAY.tamAci||{})[String(ACILAR[q][0])]});
    }
  }


  /* 8 — esansiyel asalet: yonetici, yucelme, dusus, zarar */
  (function(){
    var D=window.SorbiDignite; if(!D||!D.tekil) return;
    var KLS=['sun','moon','mer','ven','mar','jup','sat'];
    var TANIM={
     'Yönetici':{ad:'kendi burcunda',metin:'Kendi burcundaki gezegen kendi evinde gibi çalışır.'},
     'Yücelme':{ad:'yüceldiği burçta',metin:'Yüceldiği burçtaki gezegen olduğundan büyük görünür.'},
     'Düşüş':{ad:'düştüğü burçta',metin:'Düştüğü burçtaki gezegen kendini küçük görür.'},
     'Zarar':{ad:'zarar gördüğü burçta',metin:'Zarar gördüğü burçtaki gezegen kendi diliyle konuşamaz.'}
    };
    var OZEL={"sun":{"Yönetici":"Güneş kendi burcunda — kim olduğunu anlatmak için çabalaman gerekmeyebilir, odaya girdiğinde zaten belli oluyor.","Yücelme":"Güneş yüceldiği burçta — bir işi ilk başlatan sen olmak sana doğal gelebilir, sıranı beklemek zor gelebilir.","Düşüş":"Güneş düştüğü burçta — kendini anlatırken karşındakine göre ayar yapmak ve kendi istediğini en sona bırakmak sana tanıdık gelebilir.","Zarar":"Güneş zarar gördüğü burçta — \"ben\" demenin bencillik sayılacağını düşünmek, kalabalığın içinde erimek sana tanıdık gelebilir."},"moon":{"Yönetici":"Ay kendi burcunda — neye ihtiyacın olduğunu bilmek ve bunu kendine sağlamak sana doğal gelebilir.","Yücelme":"Ay yüceldiği burçta — huzurun somut şeylerden gelebilir: aynı fincan, aynı yürüyüş, tanıdık bir mutfak.","Düşüş":"Ay düştüğü burçta — rahatlamak için önce güvende olduğundan emin olman gerekebilir, bu da rahatlamayı geciktirebilir.","Zarar":"Ay zarar gördüğü burçta — ihtiyaç duymayı zayıflık saymak, yardım istemek yerine tek başına halletmek sana tanıdık gelebilir."},"mer":{"Yönetici":"Merkür kendi burcunda — anlatmak ve anlamak senin doğal aracın olabilir.","Yücelme":"Merkür yüceldiği burçta — ayrıntıyı görmek ve düzeltmek sana kolay gelebilir, hatayı hep bulmanın yorucu tarafı da olabilir.","Düşüş":"Merkür düştüğü burçta — hissettiğini kelimeye çevirmek zaman alabilir, sustuğunda anlaşılmadığını düşünmek sana tanıdık gelebilir.","Zarar":"Merkür zarar gördüğü burçta — büyük resmi görüp ayrıntıyı atlamak, sonra o ayrıntının geri gelmesi sana tanıdık gelebilir."},"ven":{"Yönetici":"Venüs kendi burcunda — neyi sevdiğini bilmek ve o şeyin yanında durmak sana doğal gelebilir.","Yücelme":"Venüs yüceldiği burçta — sevmek sana kolay gelebilir, nerede duracağını bilmek zor gelebilir.","Düşüş":"Venüs düştüğü burçta — sevgiyi hak edilmesi gereken bir şey gibi görmek ve kusur aramak sana tanıdık gelebilir.","Zarar":"Venüs zarar gördüğü burçta — yakınlığı yumuşaklıkla değil yoğunlukla kurmak sana tanıdık gelebilir."},"mar":{"Yönetici":"Mars kendi burcunda — istediğini almak için harekete geçmek sana doğal gelebilir.","Yücelme":"Mars yüceldiği burçta — uzun soluklu iş çıkarmak ve dayanmak senin alanın olabilir.","Düşüş":"Mars düştüğü burçta — öfkeni doğrudan göstermek yerine içine atmak, sonra beklenmedik bir anda taşmak sana tanıdık gelebilir.","Zarar":"Mars zarar gördüğü burçta — çatışmayı ertelemek, kırmamak için istediğini söylememek sana tanıdık gelebilir."},"jup":{"Yönetici":"Jüpiter kendi burcunda — inandığın şeyi büyütmek sana doğal gelebilir.","Yücelme":"Jüpiter yüceldiği burçta — cömertliğin önce yakınlarına dönük olabilir, evin kalabalıklaşabilir.","Düşüş":"Jüpiter düştüğü burçta — iyimser olmayı gerçekçi olmamak saymak ve kendine az yer açmak sana tanıdık gelebilir.","Zarar":"Jüpiter zarar gördüğü burçta — büyük resme inanmak için önce bütün ayrıntıların tutmasını beklemek sana tanıdık gelebilir."},"sat":{"Yönetici":"Satürn kendi burcunda — sorumluluk almak ve sınır koymak sana doğal gelebilir.","Yücelme":"Satürn yüceldiği burçta — adil olmayı önemsemek, kimin ne kadar taşıdığını hesaplamak sana tanıdık gelebilir.","Düşüş":"Satürn düştüğü burçta — kendi başına başlamak zor gelebilir, izin bekler gibi hissetmek sana tanıdık gelebilir.","Zarar":"Satürn zarar gördüğü burçta — yakınlık kurarken ölçüp biçmek ve sevgiyi de bir görev gibi taşımak sana tanıdık gelebilir."}};
    var SIRA={'Yücelme':0,'Düşüş':1,'Zarar':2,'Yönetici':3};
    KLS.forEach(function(k){
      var p=P[k]; if(!p) return;
      var d=D.tekil(k,p.lon,!!ch.day); if(!d||!d.etiketler) return;
      d.etiketler.forEach(function(e){
        var T=TANIM[e.t]; if(!T) return;
        var bi=Math.floor(norm(p.lon)/30);
        B.push({tur:'asalet', anahtar:'asalet|'+SAYAD[k]+'|'+bi, oncelik:SIRA[e.t],
          baslik:ADI[k]+', '+BURCDA[bi]+' — '+T.ad,
          olcu:konum(p.lon),
          kanit:ADI[k]+' '+konum(p.lon)+' \u00b7 '+e.t+' ('+(e.p>0?'+':'')+e.p+' puan, Ptolemaik tablo)',
          metin:(OZEL[k]&&OZEL[k][e.t])||T.metin,
          sayac:(SAY.burc||{})[SAYAD[k]+'|'+bi]});
      });
    });
  })();

  /* nadirlik + sıralama */
  B.forEach(function(b){ b.ppm=ppm(b.sayac); b.biriKac=kacta(b.ppm);
    b.yuzbinde = b.ppm===null?null:Math.round(b.ppm/10); });
  /* Nadirlik eşiği. 20 kişide birden sık görülen bir yerleşim nadir değildir;
     ölçülen sayım bunu söylüyorsa sayfa da öyle demelidir. Eşiği geçenler
     elenir ve kaç tanesinin elendiği dönüşte bildirilir. */
  var ESIK = 50000;
  var elenen = 0;
  B = B.filter(function(b){
    if(b.ppm!==null && b.ppm>ESIK){ elenen++; return false; }
    return true; });
  B.sort(function(x,y){
    if(x.ppm===null) return 1; if(y.ppm===null) return -1; return x.ppm-y.ppm; });
  return {bulgular:B, ornek:SAY.n||0, saatsiz:saatsiz, esik:ESIK, elenen:elenen};
}

function ozet(b){
  if(!b) return '';
  if(b.ppm===null) return b.baslik+'.';
  if(b.yuzbinde<1) return b.baslik+' — yüz binde birden az.';
  return b.baslik+' — her yüz bin kişiden '+b.yuzbinde.toLocaleString('tr-TR')+' kişide.';
}

window.SorbiYildiz={ bul:bul, ozet:ozet, yildizlar:YIL, konum:konum, dk:dk };
})();
