/* sorbi-geri-bildirim.js — her sayfada duran geri bildirim düğmesi.
 * Tek script etiketiyle giriyor, sayfanın kendi CSS'ine dokunmuyor.
 * Kimlik istemiyor: zorunlu olsa gerçek geri bildirimin çoğu hiç gelmez.
 */
(function(){
"use strict";
if (window.__sorbiGB) return; window.__sorbiGB = true;

var CSS = [
'.gb-ac{position:fixed;right:16px;bottom:16px;z-index:9000;font-family:Inter,system-ui,sans-serif;',
' font-size:.82rem;font-weight:500;color:#F2EFE9;background:rgba(20,14,24,.92);',
' border:1px solid rgba(227,166,146,.35);border-radius:99px;padding:.5rem 1rem;cursor:pointer;',
' backdrop-filter:blur(12px);box-shadow:0 8px 28px rgba(0,0,0,.4);transition:.16s}',
'.gb-ac:hover{border-color:rgba(227,166,146,.7);color:#F2D3B8}',
'@media(max-width:560px){.gb-ac{right:12px;bottom:12px;padding:.45rem .85rem;font-size:.78rem}}',
'.gb-ort{position:fixed;inset:0;z-index:9001;background:rgba(6,4,8,.72);backdrop-filter:blur(4px);',
' display:flex;align-items:flex-end;justify-content:center;padding:16px}',
'@media(min-width:640px){.gb-ort{align-items:center}}',
'.gb-kutu{width:100%;max-width:460px;background:#12101A;border:1px solid rgba(255,255,255,.12);',
' border-radius:18px;padding:1.2rem 1.15rem 1.1rem;font-family:Inter,system-ui,sans-serif;color:#F2EFE9;',
' box-shadow:0 24px 60px rgba(0,0,0,.6);max-height:92vh;overflow-y:auto}',
'.gb-kutu h3{font-family:"Space Grotesk",Inter,sans-serif;font-size:1.05rem;font-weight:600;margin:0 0 .2rem}',
'.gb-kutu p.gb-ac2{font-size:.83rem;color:#9BA0AB;font-weight:300;margin:0 0 .9rem;line-height:1.55}',
'.gb-tur{display:flex;gap:.35rem;margin-bottom:.7rem;flex-wrap:wrap}',
'.gb-tur button{flex:1 1 auto;font-family:inherit;font-size:.79rem;font-weight:500;color:#9BA0AB;',
' background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:.42rem .6rem;cursor:pointer;transition:.15s}',
'.gb-tur button.on{color:#180F14;background:#F2D3B8;border-color:#F2D3B8}',
'.gb-kutu textarea,.gb-kutu input{width:100%;font-family:inherit;font-size:.88rem;color:#F2EFE9;',
' background:rgba(0,0,0,.34);border:1px solid rgba(255,255,255,.12);border-radius:11px;',
' padding:.6rem .75rem;outline:none;color-scheme:dark;box-sizing:border-box}',
'.gb-kutu textarea{min-height:110px;resize:vertical;line-height:1.55;margin-bottom:.5rem}',
'.gb-kutu textarea:focus,.gb-kutu input:focus{border-color:rgba(227,166,146,.55)}',
'.gb-kutu ::placeholder{color:#7A8090}',
'.gb-alt{display:flex;gap:.5rem;align-items:center;margin-top:.7rem;flex-wrap:wrap}',
'.gb-gonder{font-family:inherit;font-size:.86rem;font-weight:600;color:#180F14;background:#F2D3B8;',
' border:none;border-radius:11px;padding:.55rem 1.1rem;cursor:pointer}',
'.gb-gonder:hover{background:#E3A692}.gb-gonder:disabled{opacity:.5;cursor:default}',
'.gb-vazgec{font-family:inherit;font-size:.82rem;color:#9BA0AB;background:none;border:none;cursor:pointer;padding:.5rem}',
'.gb-vazgec:hover{color:#F2EFE9}',
'.gb-st{font-size:.8rem;color:#7A8090;min-height:1.1em;margin-left:auto}',
'.gb-st.iyi{color:#7FB3A8}.gb-st.hata{color:#C4744E}',
'.gb-gizli{position:absolute;left:-9999px}',
'@media(prefers-reduced-motion:reduce){.gb-ac{transition:none}}'
].join('');

var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

var dugme = document.createElement('button');
dugme.className = 'gb-ac';
dugme.type = 'button';
dugme.textContent = '✦ Geri bildirim';
dugme.setAttribute('aria-haspopup', 'dialog');
document.body.appendChild(dugme);

var TURLER = [['ozellik','Şunu ekleyin'],['hata','Bir hata var'],['oneri','Görüşüm var']];
var secili = 'ozellik', ortu = null, sonOdak = null;

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

function kapat(){
  if(!ortu) return;
  ortu.remove(); ortu = null;
  document.removeEventListener('keydown', esc_);
  if(sonOdak) sonOdak.focus();
}
function esc_(e){ if(e.key === 'Escape') kapat(); }

function ac(){
  if(ortu) return;
  sonOdak = document.activeElement;
  ortu = document.createElement('div');
  ortu.className = 'gb-ort';
  ortu.innerHTML =
    '<div class="gb-kutu" role="dialog" aria-modal="true" aria-label="Geri bildirim">' +
      '<h3>Ne eklememizi istersin?</h3>' +
      '<p class="gb-ac2">Sorbi’yi kullananların söyledikleriyle büyüyor. Eksik bulduğun, ' +
      'yanlış çalıştığını düşündüğün ya da olmasını istediğin ne varsa yaz — hepsi okunuyor.</p>' +
      '<div class="gb-tur">' + TURLER.map(function(t,i){
        return '<button type="button" data-tur="'+t[0]+'"'+(i===0?' class="on"':'')+'>'+t[1]+'</button>';
      }).join('') + '</div>' +
      '<textarea id="gbMetin" maxlength="4000" placeholder="Örnek: sinastri ekranında iki haritanın ortak noktalarını ayrı bir tabloda görmek isterdim."></textarea>' +
      '<input id="gbIletisim" type="text" maxlength="140" placeholder="Cevap istersen e-posta ya da Instagram (isteğe bağlı)">' +
      '<input class="gb-gizli" id="gbHp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="gb-alt">' +
        '<button type="button" class="gb-gonder" id="gbGonder">Gönder</button>' +
        '<button type="button" class="gb-vazgec" id="gbVazgec">Vazgeç</button>' +
        '<span class="gb-st" id="gbSt"></span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ortu);
  document.addEventListener('keydown', esc_);

  ortu.addEventListener('click', function(e){ if(e.target === ortu) kapat(); });
  ortu.querySelector('#gbVazgec').addEventListener('click', kapat);
  Array.prototype.forEach.call(ortu.querySelectorAll('.gb-tur button'), function(b){
    b.addEventListener('click', function(){
      Array.prototype.forEach.call(ortu.querySelectorAll('.gb-tur button'), function(x){ x.classList.remove('on'); });
      b.classList.add('on'); secili = b.dataset.tur;
    });
  });
  ortu.querySelector('#gbMetin').focus();

  ortu.querySelector('#gbGonder').addEventListener('click', function(){
    var btn = this, sat = ortu.querySelector('#gbSt');
    var metin = ortu.querySelector('#gbMetin').value.trim();
    if(metin.length < 5){ sat.className = 'gb-st hata'; sat.textContent = 'Birkaç kelime daha yaz.'; return; }
    btn.disabled = true; sat.className = 'gb-st'; sat.textContent = 'Gönderiliyor…';
    var rol = null;
    try { rol = localStorage.getItem('sorbiAstrolog') === '1' ? 'astrolog'
              : (localStorage.getItem('sorbiTopluluk') ? 'topluluk' : null); } catch(e){}
    fetch('/api/geri-bildirim', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tur: secili, metin: metin, sayfa: location.pathname,
        iletisim: ortu.querySelector('#gbIletisim').value.trim(), rol: rol,
        hp: ortu.querySelector('#gbHp').value })
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
      .then(function(r){
        if(!r.ok){ btn.disabled = false; sat.className = 'gb-st hata';
          sat.textContent = (r.j && r.j.error) || 'Gönderilemedi'; return; }
        sat.className = 'gb-st iyi'; sat.textContent = 'Ulaştı, teşekkürler.';
        setTimeout(kapat, 1100);
      }).catch(function(){ btn.disabled = false; sat.className = 'gb-st hata'; sat.textContent = 'Bağlantı hatası.'; });
  });
}
dugme.addEventListener('click', ac);
})();
