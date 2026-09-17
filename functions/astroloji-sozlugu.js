// 410 Gone - sayfa kaldirildi, konusu tutan canli karsiligi yok (2026-09-14).
export const onRequest = () => new Response('410 Gone', {
  status: 410,
  headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' }
});
