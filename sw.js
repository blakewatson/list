const cacheName = 'v1';
console.log(`Worker ${cacheName} downloaded.`);

const assets = [
  '/index.html',
  '/css/app.css',
  '/css/pure-grids-min.css',
  '/css/pure-nr-min.css',
  '/css/spacing.css',
  '/images/icon-512.png',
  '/images/icon-192.png',
  '/js/libs/vue.global.min.js',
  '/js/libs/vue.global.js',
  '/js/app.js',
  '/js/data.js',
  '/js/idHelpers.js',
  '/js/storage.js'
];

// install event happens if this file is new to the browser
self.addEventListener('install', (event) => {
  console.log('Installing worker: ' + cacheName);

  // ensure this is the active worker; triggers activate
  self.skipWaiting();

  // cache all the app assets
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

// activate event happens when a worker moves from "worker in waiting" to the
// current active worker (see `skipWaiting()` above)
self.addEventListener('activate', (event) => {
  console.log('Activating worker: ' + cacheName);

  // activation function - cleans cache and takes over existing pages
  const activating = () =>
    new Promise((resolve, reject) => {
      // take over existing pages
      const claimingPromise = clients
        .claim()
        .then(() => console.log('page claimed'));

      // clean caches
      caches.keys().then((names) => {
        const deletingPromises = names
          .filter((n) => n !== cacheName)
          .map((n) => caches.delete(n));

        // resolve when everything is done
        Promise.all([...deletingPromises, claimingPromise])
          .then(() => resolve())
          .then(() => console.log('activated successfully'));
      });
    });

  event.waitUntil(activating());
});

// intercept fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // if we have a cached version, use it
    caches.match(event.request).then((resp) => {
      if (resp) {
        return resp;
      }

      // if not, go to the network
      return fetch(event.request);
    })
  );
});
