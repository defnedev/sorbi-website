/* sorbi-sozluk.js — harita terimlerine dokununca sade açıklama (U1).
 * Yalnız data-sz="anahtar" taşıyan öğelerde çalışır; metni kendisi taramaz.
 * Olay devri belgeye bağlı: innerHTML ile sonradan çizilen sonuçlarda da çalışır.
 */
(function(){
"use strict";
if (window.SorbiSozluk) return;

var S = {
 kavusum:  ['Kavuşum · 0°', 'İki gezegen gökyüzünde neredeyse aynı noktada. Enerjileri birbirinden ayrılmaz, biri çalışınca öteki de devreye girer. Hangi gezegenler olduğuna göre uyumlu da olabilir, zorlayıcı da.'],
 altmislik:['Altmışlık · 60°', 'Yardımlaşan iki gezegen. Kendiliğinden olmaz ama biraz çabayla kolayca işe yarayan bir fırsat gibi çalışır.'],
 kare:     ['Kare · 90°', 'Birbirini zorlayan iki gezegen. Sürtünme yaratır, rahat bırakmaz ama harekete geçiren de odur. Haritadaki gelişim noktalarının çoğu karelerde saklıdır.'],
 ucgen:    ['Üçgen · 120°', 'Kolay akan bir bağ. Bu iki gezegenin konuları sende doğal bir yetenek gibi çalışır. Kolaylık bazen fark edilmediği için boşa da gidebilir.'],
 karsit:   ['Karşıt · 180°', 'Gökyüzünün iki ucundaki gezegenler. İki ihtiyaç arasında denge kurmayı ister ve bu gerilim çoğu zaman başka insanlar üzerinden yaşanır.'],
 orb:      ['Orb', 'Açının tam dereceden ne kadar saptığı. Sayı küçüldükçe açı daha sıkı ve daha güçlü hissedilir. 1° altındaki açılar haritanın en belirgin temalarıdır.'],
 retro:    ['℞ Retro', 'Dünya\'dan bakınca gezegen gökyüzünde geri gidiyormuş gibi görünür. Doğum haritasında bu gezegenin konuları daha içe dönük, düşünülerek ve zamanla yaşanır diye yorumlanır.'],
 yukselen: ['Yükselen', 'Doğduğun an doğu ufkunda yükselen burç. İlk izlenimi ve dışa yansıyan tarzı anlatır. Birinci ev buradan başlar, bu yüzden doğru yükselen için doğum saati gerekir.'],
 mc:       ['MC · Gökyüzü Tepesi', 'Doğduğun an gökyüzünün en tepesindeki nokta. Kariyer, hedefler ve toplumda nasıl görünmek istediğin burada okunur. Onuncu evin başlangıcıdır.'],
 ev:       ['Evler', 'Harita on iki bölüme ayrılır, her biri hayatın bir alanını anlatır. Bir gezegen hangi evdeyse enerjisini en çok o alanda gösterir. Evler yükselenden başlayarak sayılır.'],
 ev1: ['1. ev · Kendin', 'Görünüşün, ilk izlenim ve hayata nasıl başladığın. Bu evdeki gezegen kişiliğinde hemen fark edilir.'],
 ev2: ['2. ev · Para ve değerler', 'Kazandığın, sahip olduğun ve değer verdiğin şeyler. Kendine duyduğun güven de burada okunur.'],
 ev3: ['3. ev · İletişim', 'Konuşma, yazma, öğrenme, kardeşler ve yakın çevre. Günlük kısa yolculuklar da bu eve aittir.'],
 ev4: ['4. ev · Yuva ve kökler', 'Ev, aile, geçmiş ve kendini güvende hissettiğin yer. Haritanın en özel köşesidir.'],
 ev5: ['5. ev · Kalp', 'Aşk, keyif, yaratıcılık, oyun ve çocuklar. Neyle eğlendiğin ve kendini nasıl ifade ettiğin.'],
 ev6: ['6. ev · İş ve sağlık', 'Günlük düzen, çalışma alışkanlıkları, beden ve bakım. Hayatın rutini burada kurulur.'],
 ev7: ['7. ev · İlişkiler', 'Evlilik, ortaklıklar ve karşındaki insan. Başkalarında neyi aradığın da burada görünür.'],
 ev8: ['8. ev · Ortaklaşılan', 'Ortak para, borç, miras, derin yakınlık ve dönüşüm. Paylaşmanın ve bırakmanın evi.'],
 ev9: ['9. ev · Ufuk', 'Uzak yolculuklar, inanç, felsefe ve yüksek öğrenim. Hayata anlam kattığın yer.'],
 ev10:['10. ev · Kariyer', 'Meslek, statü, hedefler ve toplumdaki yerin. MC bu evin başlangıcıdır.'],
 ev11:['11. ev · Topluluk', 'Arkadaşlar, gruplar, sosyal çevre ve gelecekten umduğun şeyler.'],
 ev12:['12. ev · Bilinçaltı', 'Yalnızlık, dinlenme, gizli kalan ve içeride taşıdığın şeyler. Geri çekilip toparlandığın yer.']
};

var CSS = '[data-sz]{text-decoration:underline dotted;text-decoration-thickness:1px;text-underline-offset:3px;cursor:help;outline-offset:2px}' +
 '[data-sz]:focus-visible{outline:1px solid var(--acc,currentColor);border-radius:3px}' +
 '.sz-kutu{position:absolute;z-index:9500;max-width:280px;background:var(--bg,#111);color:var(--ink,#eee);' +
 'border:1px solid rgba(var(--ink-rgb,230,230,230),.18);border-radius:12px;padding:.7rem .85rem;' +
 'font:400 .84rem/1.55 Inter,system-ui,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.28)}' +
 '.sz-kutu b{display:block;font-weight:600;margin-bottom:.25rem;color:var(--ink,#eee)}' +
 '.sz-kutu span{color:var(--mut,#aaa)}';
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

var kutu = null, acik = null;
function kapat(){ if(kutu){ kutu.remove(); kutu = null; } if(acik){ acik.setAttribute('aria-expanded','false'); acik = null; } }
function goster(el){
 var k = S[el.getAttribute('data-sz')]; if(!k) return;
 if(acik === el){ kapat(); return; }
 kapat();
 kutu = document.createElement('div'); kutu.className = 'sz-kutu'; kutu.setAttribute('role','tooltip'); kutu.id = 'szKutu';
 var b = document.createElement('b'); b.textContent = k[0];
 var t = document.createElement('span'); t.textContent = k[1];
 kutu.appendChild(b); kutu.appendChild(t); document.body.appendChild(kutu);
 var r = el.getBoundingClientRect(), w = kutu.offsetWidth, sx = window.scrollX, sy = window.scrollY;
 var x = Math.max(8, Math.min(r.left + sx, sx + document.documentElement.clientWidth - w - 8));
 var y = r.bottom + sy + 6;
 if (r.bottom + kutu.offsetHeight + 12 > window.innerHeight && r.top > kutu.offsetHeight + 12) y = r.top + sy - kutu.offsetHeight - 6;
 kutu.style.left = x + 'px'; kutu.style.top = y + 'px';
 el.setAttribute('aria-expanded','true'); el.setAttribute('aria-describedby','szKutu'); acik = el;
}
function hazirla(el){ if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0'); el.setAttribute('role','button'); }

document.addEventListener('click', function(e){
 var el = e.target.closest && e.target.closest('[data-sz]');
 if(el){ e.preventDefault(); e.stopPropagation(); hazirla(el); goster(el); return; }
 if(kutu && !e.target.closest('.sz-kutu')) kapat();
}, true);
document.addEventListener('keydown', function(e){
 if(e.key === 'Escape') kapat();
 var el = e.target.closest && e.target.closest('[data-sz]');
 if(el && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); goster(el); }
});
document.addEventListener('focusin', function(e){ var el = e.target.closest && e.target.closest('[data-sz]'); if(el) hazirla(el); });
window.addEventListener('resize', kapat);
/* sonradan çizilen terimleri klavyeyle ulaşılır yap */
new MutationObserver(function(){ document.querySelectorAll('[data-sz]:not([tabindex])').forEach(hazirla); })
 .observe(document.body, { childList: true, subtree: true });

window.SorbiSozluk = { S: S, kapat: kapat };
})();
