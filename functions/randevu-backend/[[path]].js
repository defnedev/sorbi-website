// Ücretli hizmet/randevu backend'i 2026-07-30'da söküldü.
// Dosyalar canlıda statik olarak servis ediliyordu (uyum denetimi 2026-09-04).
// Fonksiyonlar asset'lerden önce çalışır — bu kapı kesin.
export const onRequest = () =>
  new Response('Gone', { status: 410, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' } });
