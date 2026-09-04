/* Sorbi Kart — paylaşılabilir sonuç görseli (1080x1350).
   window.SorbiKart.uret({ustEt, buyuk, alt, satirlar:[{ad,oran}], dipnot})
   -> PNG indirir. Dış bağımlılık yok, sunucuya hiçbir şey gitmez. */
(function () {
  var G = '#E3A692', GL = '#F2CDBB', BG = '#0B0F14', KART = '#11161D', MUT = '#8E97A6', AK = '#F4F1EC';

  function yuvarlak(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function sigdir(c, metin, maxG, buyukPx, kucukPx, font) {
    var p = buyukPx;
    while (p > kucukPx) { c.font = '700 ' + p + 'px ' + font; if (c.measureText(metin).width <= maxG) break; p -= 4; }
    return p;
  }

  function uret(o) {
    var W = 1080, H = 1350, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    var F = "'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif";
    var FI = "'Inter', system-ui, -apple-system, sans-serif";

    x.fillStyle = BG; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(W / 2, 260, 40, W / 2, 260, 720);
    g.addColorStop(0, 'rgba(227,166,146,.16)'); g.addColorStop(1, 'rgba(227,166,146,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, 900);

    // başlık
    x.fillStyle = G; x.font = '600 34px ' + F; x.textAlign = 'left';
    x.fillText('✦ Sorbi', 84, 108);
    x.fillStyle = MUT; x.font = '400 26px ' + FI; x.textAlign = 'right';
    x.fillText('Nadirlik Raporu', W - 84, 108);

    // manşet
    x.textAlign = 'center';
    x.fillStyle = MUT; x.font = '500 28px ' + FI;
    x.fillText((o.ustEt || 'EN NADİR YANIN').toUpperCase(), W / 2, 268);

    var p = sigdir(x, o.buyuk || '', W - 200, 104, 52, F);
    x.fillStyle = AK; x.font = '700 ' + p + 'px ' + F;
    x.fillText(o.buyuk || '', W / 2, 268 + 40 + p * 0.78);

    var altY = 268 + 40 + p * 0.78 + 66;
    x.fillStyle = GL; x.font = '400 34px ' + FI;
    (o.alt || '').split('\n').slice(0, 2).forEach(function (s, i) { x.fillText(s, W / 2, altY + i * 46); });

    // satırlar
    var y = altY + 110, sat = (o.satirlar || []).slice(0, 4);
    x.textAlign = 'left';
    sat.forEach(function (s) {
      x.fillStyle = KART; yuvarlak(x, 84, y, W - 168, 96, 22); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 2; x.stroke();
      x.fillStyle = AK; x.font = '500 34px ' + FI;
      x.fillText(s.ad, 124, y + 60);
      x.fillStyle = G; x.font = '600 32px ' + F; x.textAlign = 'right';
      x.fillText(s.oran, W - 124, y + 60);
      x.textAlign = 'left';
      y += 116;
    });

    // dipnot + imza
    x.textAlign = 'center';
    x.fillStyle = MUT; x.font = '400 26px ' + FI;
    x.fillText(o.dipnot || '24.000 haritalık örneklem · 1950–2009', W / 2, H - 150);
    x.fillStyle = G; x.font = '600 30px ' + F;
    x.fillText('sorbiapp.com/nadirlik', W / 2, H - 100);
    if (o.imza) { x.fillStyle = MUT; x.font = '400 24px ' + FI; x.fillText(o.imza, W / 2, H - 58); }

    return c;
  }

  function indir(o, dosya) {
    var c = uret(o);
    return new Promise(function (ok, hata) {
      try {
        c.toBlob(function (b) {
          if (!b) return hata(new Error('gorsel-uretilemedi'));
          var u = URL.createObjectURL(b), a = document.createElement('a');
          a.href = u; a.download = dosya || 'sorbi-nadirlik.png';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
          ok(true);
        }, 'image/png');
      } catch (e) { hata(e); }
    });
  }

  window.SorbiKart = { uret: uret, indir: indir };
})();
