var CACHE = "hitung-he-v9";
var FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(FILES.map(function (f) {
        return fetch(new Request(f, { cache: "reload" })).then(function (r) { if (r.ok) return c.put(f, r); });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Saat online: ambil versi terbaru dari internet (maksimal tunggu 3 detik).
// Saat offline atau sinyal lemah: pakai salinan yang tersimpan.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  var net = fetch(req, { cache: "no-cache" }).then(function (res) {
    if (res && res.ok) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  });
  var timeout = new Promise(function (_, rej) { setTimeout(rej, 3000); });
  e.waitUntil(net.catch(function () {}));
  e.respondWith(
    Promise.race([net, timeout]).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || net.catch(function () { return caches.match("index.html"); });
      });
    })
  );
});
