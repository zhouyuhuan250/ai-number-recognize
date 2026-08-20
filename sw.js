/* 离线缓存：所有成功加载过的资源写入 Cache，之后无网络也能完整运行 */
const CACHE = 'digit-ocr-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return; // 跳过 blob: 等
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    // 有网时后台静默更新缓存
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    }).catch(() => null);
    if (cached) return cached;      // 缓存优先 → 保证离线可用
    const res = await fresh;        // 无缓存则等网络
    if (res) return res;
    return new Response('Offline', { status: 503, statusText: 'offline' });
  })());
});