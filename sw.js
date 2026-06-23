// lager-v3.89
// Versionssträngen ovan bumpas av deploy.mjs så sw.js byter bytes vid varje deploy.
// Det får browsern att se SW:n som ändrad → install-eventet körs → caches rensas.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});
