/* Sorbi ölçüm — sayfa görüntüleme sayacı.
   Çerez yok, kimlik yok, parmak izi yok: sadece hangi sayfanın kaç kez
   açıldığını sayar. Aynı sekmede aynı sayfa bir kez sayılır. */
(function () {
  try {
    var yol = location.pathname.replace(/\/+$/, '') || '/';
    if (yol.length > 120) yol = yol.slice(0, 120);
    var anahtar = 'sorbi_olcum:' + yol;
    try { if (sessionStorage.getItem(anahtar)) return; sessionStorage.setItem(anahtar, '1'); } catch (e) {}
    var gonder = function () {
      var govde = JSON.stringify({ type: 'sayfa', meta: yol });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([govde], { type: 'application/json' }));
      } else {
        fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: govde, keepalive: true }).catch(function () {});
      }
    };
    if (document.readyState === 'complete') setTimeout(gonder, 800);
    else window.addEventListener('load', function () { setTimeout(gonder, 800); });
  } catch (e) {}
})();
