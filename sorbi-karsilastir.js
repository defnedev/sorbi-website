/* SorbiKarsilastir — paylaşım bağlantısıyla gelen üçlü ile ekrandaki kişinin üçlüsünü
 * yan yana koyar. Amaç: viral huniyi kapatmak — paylaşan kişinin sonucu, bağlantıyı
 * açan kişide de görünsün.
 *
 * Veri kaynağı: window.SorbiNadir (gökyüzünün kendi dağılımı, doğum istatistiği değil).
 * Burada uydurma yok — her sayı sorbi-nadir.js tablosundan geliyor.
 *
 * DİL NOTU: sayıya Türkçe ek getiren kalıp KURULMAZ (36'sı / 33'ü / 40'ı düzensizdir).
 * Bunun yerine eksiz kalıplar kullanılır: "N kişide bir", "N. sırada", "yaklaşık N kat".
 * Ondalık ayıraç virgül, binlik ayıraç nokta.
 */
(function(){
'use strict';

var BURC=['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
var AYRAC='-';
var ENUZUN=64; /* bağlantı parametresi bundan uzunsa bakmadan reddet */

/* --- sayı biçimleme: tr-TR (1.234 / 2,3). Ortam desteklemezse elle biçimle. --- */
var TRVAR=(function(){
 try{
  return (1234.5).toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1})==='1.234,5';
 }catch(e){ return false; }
})();

function tamSayi(n){
 n=Math.round(Number(n)||0);
 if(TRVAR){ try{ return n.toLocaleString('tr-TR'); }catch(e){} }
 var s=String(Math.abs(n)), o='', c=0, i;
 for(i=s.length-1;i>=0;i--){ o=s.charAt(i)+o; c++; if(c%3===0&&i>0) o='.'+o; }
 return (n<0?'-':'')+o;
}

function ondalik(x,basamak){
 basamak=(basamak==null)?1:basamak;
 var n=Number(x); if(!isFinite(n)) return '0';
 var kat=Math.pow(10,basamak), y=Math.round(n*kat)/kat;
 if(y===Math.round(y)) return tamSayi(y); /* 2,0 yerine 2 */
 if(TRVAR){ try{ return y.toLocaleString('tr-TR',{minimumFractionDigits:basamak,maximumFractionDigits:basamak}); }catch(e){} }
 var tam=Math.floor(Math.abs(y)), kesir=Math.round((Math.abs(y)-tam)*kat);
 var ks=String(kesir); while(ks.length<basamak) ks='0'+ks;
 return (y<0?'-':'')+tamSayi(tam)+','+ks;
}

/* --- doğrulama --- */
function burcMu(v){ return typeof v==='number' && isFinite(v) && v===Math.floor(v) && v>=0 && v<=11; }

/* Serbest girdiyi {su,mo,as} biçimine indirger. Geçersizse null. */
function temizle(o){
 if(!o || typeof o!=='object') return null;
 var su=o.su, mo=o.mo, as=o.as;
 if(typeof su==='string' && /^\d{1,2}$/.test(su)) su=parseInt(su,10);
 if(typeof mo==='string' && /^\d{1,2}$/.test(mo)) mo=parseInt(mo,10);
 if(typeof as==='string' && /^\d{1,2}$/.test(as)) as=parseInt(as,10);
 if(!burcMu(su)||!burcMu(mo)) return null;
 if(as==null||as==='') return {su:su,mo:mo};
 if(!burcMu(as)) return null;
 return {su:su,mo:mo,as:as};
}

/* --- bağlantı parametresi --- */
function baglantiParam(su,mo,as){
 var t=temizle({su:su,mo:mo,as:as});
 if(!t) return null;
 return (t.as==null) ? (t.su+AYRAC+t.mo) : (t.su+AYRAC+t.mo+AYRAC+t.as);
}

function degerAyikla(d){
 /* "?k=6-4-11", "k=6-4-11", "6-4-11" — hepsini kabul et */
 if(d.indexOf('=')<0) return d;
 var s=d.charAt(0)==='?' ? d.slice(1) : d;
 var parcalar=s.split('&'), i, p, ad;
 for(i=0;i<parcalar.length;i++){
  p=parcalar[i].split('=');
  ad=p[0];
  if(ad==='k'||ad==='karsi') return p.length>1 ? p[1] : '';
 }
 return null;
}

function paramOku(aramaDizesi){
 if(typeof aramaDizesi!=='string') return null;
 var d=aramaDizesi;
 if(d.length>512) return null; /* aşırı uzun girdi: hiç uğraşma */
 var ham=degerAyikla(d);
 if(ham==null) return null;
 try{ ham=decodeURIComponent(ham); }catch(e){ /* bozuk yüzde kodlaması: ham haliyle dene */ }
 ham=ham.replace(/^\s+|\s+$/g,'');
 if(!ham || ham.length>ENUZUN) return null;
 var m=/^(\d{1,2})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(ham);
 if(!m) return null;
 var o={su:parseInt(m[1],10), mo:parseInt(m[2],10)};
 if(m[3]!=null) o.as=parseInt(m[3],10);
 return temizle(o);
}

/* --- tek tarafın nadirlik verisi --- */
function taraf(t,olcek){
 var N=(typeof window!=='undefined')?window.SorbiNadir:null;
 if(!N) return null;
 var d, sonuc={su:t.su, mo:t.mo, yukselenVar:(t.as!=null),
  burcSu:BURC[t.su], burcMo:BURC[t.mo], burcAs:(t.as!=null?BURC[t.as]:null)};
 if(t.as!=null) sonuc.as=t.as;
 if(olcek==='uclu'){
  d=N.uclu(t.su,t.mo,t.as);
  if(!d) return null;
  sonuc.olcek='uclu'; sonuc.ppm=d.ppm; sonuc.biriKac=d.biriKac;
  sonuc.yuzbinde=d.yuzbinde; sonuc.sira=d.sira; sonuc.toplam=d.toplam; sonuc.yuzdelik=d.yuzdelik;
 }else{
  d=N.ikili(t.su,t.mo);
  if(!d) return null;
  sonuc.olcek='ikili'; sonuc.ppm=d.ppm; sonuc.biriKac=d.biriKac; sonuc.binde=d.binde;
 }
 sonuc.anahtar=baglantiParam(t.su,t.mo,(t.as==null?null:t.as));
 return sonuc;
}

/* --- karşılaştırma --- */
function karsilastir(benim,gelen){
 var a=temizle(benim), b=temizle(gelen);
 if(!a||!b) return null;
 /* iki taraf aynı ölçekte kıyaslanmalı: biri yükselensizse ikisi de Güneş+Ay üzerinden */
 var olcek=(a.as!=null && b.as!=null) ? 'uclu' : 'ikili';
 var A=taraf(a,olcek), B=taraf(b,olcek);
 if(!A||!B) return null;

 /* aynılık, karşılaştırmanın yapıldığı ölçekte tanımlanır */
 var ayni = (a.su===b.su && a.mo===b.mo) && (olcek==='ikili' || a.as===b.as);
 var buyukP=Math.max(A.ppm,B.ppm), kucukP=Math.min(A.ppm,B.ppm);
 var kat=(kucukP>0)? (buyukP/kucukP) : 1;
 var katYuvarli=Math.round(kat*10)/10;
 var dahaNadir;
 if(A.ppm<B.ppm) dahaNadir='benim';
 else if(B.ppm<A.ppm) dahaNadir='gelen';
 else dahaNadir='esit';

 return {
  gecerli:true,
  olcek:olcek,                 /* 'uclu' | 'ikili' */
  yukselenEksik:(olcek==='ikili'),
  ayni:ayni,
  benim:A,
  gelen:B,
  dahaNadir:dahaNadir,         /* 'benim' | 'gelen' | 'esit' */
  kat:katYuvarli,
  katMetin:ondalik(katYuvarli,1),
  yakin:(katYuvarli<1.15)      /* fark anlamlı değilse metin "fark var" demesin */
 };
}

/* --- ekrana basılacak Türkçe metin --- */
/* Güneş+Ay ölçeğinde kıyas yapılıyorsa yükselen yazılmaz — kıyasa girmeyen veri
   ekranda görünmesin, yanıltmasın. */
function uclMetin(T,olcek){
 var s=T.burcSu+' ☉ · '+T.burcMo+' ☽';
 if(T.burcAs && olcek==='uclu') s+=' · '+T.burcAs+' ↑';
 return s;
}

function metinKur(sonuc){
 if(!sonuc || !sonuc.gecerli) return null;
 var A=sonuc.benim, B=sonuc.gelen, L=[];
 var baslik;

 if(sonuc.ayni){
  baslik='Aynı üçlü';
  if(sonuc.olcek==='ikili') baslik='Aynı Güneş ve Ay';
  L.push('İkiniz de aynı yerleşimi taşıyorsunuz.');
  L.push(uclMetin(A,sonuc.olcek));
  L.push('Bu yerleşim yaklaşık '+tamSayi(A.biriKac)+' kişide bir oluşuyor.');
  L.push('Aynı yerleşimde karşılaşmak da kendi başına seyrek bir durum.');
 }else{
  baslik=(sonuc.olcek==='uclu') ? 'İki üçlü yan yana' : 'Güneş ve Ay yan yana';
  L.push('Senin yerleşimin: '+uclMetin(A,sonuc.olcek));
  L.push('Yaklaşık '+tamSayi(A.biriKac)+' kişide bir oluşuyor.');
  L.push('Paylaşan kişinin yerleşimi: '+uclMetin(B,sonuc.olcek));
  L.push('Yaklaşık '+tamSayi(B.biriKac)+' kişide bir oluşuyor.');
  if(sonuc.yakin){
   L.push('İki yerleşimin gökyüzündeki sıklığı birbirine çok yakın.');
  }else{
   L.push('Aradaki fark yaklaşık '+sonuc.katMetin+' kat.');
   if(sonuc.dahaNadir==='benim') L.push('Gökyüzünde daha seyrek görülen taraf seninki.');
   else if(sonuc.dahaNadir==='gelen') L.push('Gökyüzünde daha seyrek görülen taraf paylaşan kişininki.');
  }
 }

 if(sonuc.olcek==='uclu'){
  if(sonuc.ayni){
   L.push('Seyreklik sıralamasında 1728 üçlü arasında bu üçlünün yeri '+A.sira+'. sırada.');
  }else{
   L.push('Seyreklik sıralamasında 1728 üçlü arasında senin yerin '+A.sira+'. sırada, paylaşan kişininki '+B.sira+'. sırada.');
  }
 }else if(sonuc.yukselenEksik){
  L.push('Taraflardan birinin doğum saati bilinmediği için karşılaştırma Güneş ve Ay üzerinden yapıldı.');
 }

 L.push('Nadir olmak daha iyi olmak demek değil, yalnızca gökyüzünde daha az rastlanmak demek.');

 return { baslik:baslik, satirlar:L };
}

window.SorbiKarsilastir={
 baglantiParam:baglantiParam,
 paramOku:paramOku,
 karsilastir:karsilastir,
 metinKur:metinKur,
 burclar:BURC
};
})();
