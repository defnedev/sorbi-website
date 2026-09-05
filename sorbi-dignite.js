/* SorbiDignite — Ptolemaik esansiyel dignite + sect.
 * window.SorbiDignite.tablo(chart) -> [{k,ad,konum,burc,derece,etiketler[],puan,peregrin}]
 * window.SorbiDignite.sect(chart)  -> {gunduz, isik, iyiciler[], kotuculer[]}
 * Tablolar sorbi-astro.js ile aynı kaynaktan; ikisi birlikte güncellenmeli.
 */
(function(){
"use strict";
var SIGNS=['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
var RULER=['mar','ven','mer','moon','sun','mer','ven','mar','jup','sat','sat','jup'];
var EXALT={sun:[0,19],moon:[1,3],mer:[5,15],ven:[11,27],mar:[9,28],jup:[3,15],sat:[6,21]};
var FALLS={sun:6,moon:7,mer:11,ven:5,mar:3,jup:9,sat:0};
var TRIP=[['sun','jup','sat'],['ven','moon','mar'],['sat','mer','jup'],['ven','mar','moon']];
var TERMS=[
 [['jup',6],['ven',12],['mer',20],['mar',25],['sat',30]],
 [['ven',8],['mer',14],['jup',22],['sat',27],['mar',30]],
 [['mer',6],['jup',12],['ven',17],['mar',24],['sat',30]],
 [['mar',7],['ven',13],['mer',19],['jup',26],['sat',30]],
 [['jup',6],['ven',11],['sat',18],['mer',24],['mar',30]],
 [['mer',7],['ven',17],['jup',21],['mar',28],['sat',30]],
 [['sat',6],['mer',14],['jup',21],['ven',28],['mar',30]],
 [['mar',7],['ven',11],['mer',19],['jup',24],['sat',30]],
 [['jup',12],['ven',17],['mer',21],['sat',26],['mar',30]],
 [['mer',7],['jup',14],['ven',22],['sat',26],['mar',30]],
 [['mer',7],['ven',13],['jup',20],['mar',25],['sat',30]],
 [['ven',12],['jup',16],['mer',19],['mar',28],['sat',30]]
];
var FACES=[
 ['mar','sun','ven'],['mer','moon','sat'],['jup','mar','sun'],['ven','mer','moon'],
 ['sat','jup','mar'],['sun','ven','mer'],['moon','sat','jup'],['mar','sun','ven'],
 ['mer','moon','sat'],['jup','mar','sun'],['ven','mer','moon'],['sat','jup','mar']
];
var KLASIK=['sun','moon','mer','ven','mar','jup','sat'];
var AD={sun:'Güneş',moon:'Ay',mer:'Merkür',ven:'Venüs',mar:'Mars',jup:'Jüpiter',sat:'Satürn'};

function norm(x){return ((x%360)+360)%360;}
function karsit(s){return (s+6)%12;}

function tekil(k, lon, gunduz){
  var L=norm(lon), s=Math.floor(L/30), g=L-s*30;
  var et=[], puan=0;
  if(RULER[s]===k){ et.push({t:'Yönetici',p:5}); puan+=5; }
  if(RULER[karsit(s)]===k){ et.push({t:'Zarar',p:-5}); puan-=5; }
  if(EXALT[k] && EXALT[k][0]===s){ et.push({t:'Yücelme',p:4}); puan+=4; }
  if(FALLS[k]===s){ et.push({t:'Düşüş',p:-4}); puan-=4; }
  var t3=TRIP[s%4], ucluYonetici = gunduz ? t3[0] : t3[1];
  if(ucluYonetici===k){ et.push({t:'Üçlü yönetici',p:3}); puan+=3; }
  else if(t3[2]===k){ et.push({t:'Ortak üçlü',p:3}); puan+=3; }
  var T=TERMS[s];
  for(var i=0;i<T.length;i++){ if(g < T[i][1]){ if(T[i][0]===k){ et.push({t:'Sınır (term)',p:2}); puan+=2; } break; } }
  var yuz=FACES[s][Math.min(2,Math.floor(g/10))];
  if(yuz===k){ et.push({t:'Dekan (yüz)',p:1}); puan+=1; }
  return { etiketler:et, puan:puan, peregrin: et.length===0, burc:SIGNS[s], derece:g };
}

function tablo(ch){
  if(!ch || !ch.pls) return [];
  var gunduz = !!ch.day;
  var harita={};
  ch.pls.forEach(function(p){ harita[p.k]=p; });
  return KLASIK.filter(function(k){ return harita[k]; }).map(function(k){
    var p=harita[k], d=tekil(k, p.lon, gunduz);
    return {
      k:k, ad:AD[k]||p.n, lon:p.lon, burc:d.burc, derece:d.derece,
      ev:p.house, rx:!!p.rx, etiketler:d.etiketler, puan:d.puan, peregrin:d.peregrin
    };
  }).sort(function(a,b){ return b.puan-a.puan; });
}

function sect(ch){
  if(!ch) return null;
  var gunduz=!!ch.day;
  return {
    gunduz: gunduz,
    isik: gunduz ? 'Güneş' : 'Ay',
    iyiciler: gunduz ? ['Jüpiter (sect içi)','Venüs'] : ['Venüs (sect içi)','Jüpiter'],
    kotuculer: gunduz ? ['Mars (sect dışı — daha zorlayıcı)','Satürn'] : ['Satürn (sect dışı — daha zorlayıcı)','Mars']
  };
}

window.SorbiDignite={ tablo:tablo, sect:sect, tekil:tekil, SIGNS:SIGNS };
})();
