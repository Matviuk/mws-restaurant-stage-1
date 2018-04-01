var staticCacheName = 'revrest-static-v3'; // Name for static cache
var contentImgsCache = 'revrest-content-imgs'; // Name for images cache
var allCaches = [staticCacheName, contentImgsCache];

var urlsToCache = [
  '/',
  'restaurant.html',
  'index.html',
  'js/app.js',
  'js/main.js',
  'js/dbhelper.js',
  'data/restaurants.json',
  'js/restaurant_info.js',
  'css/normalize.css',
  'css/styles.css'
];

self.addEventListener('install', function(event) {
  console.log('Installing SW');

  // Create a cache when Service Worker is installed
  event.waitUntil(caches.open(staticCacheName).then(function(cache) {
    return cache.addAll(urlsToCache);
  }));

});

self.addEventListener('activate', function(event) {
  console.log('Activated');

  // Delete old cache when new SW is active
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('revrest-') && !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );

});

self.addEventListener('fetch', function(event) {
  console.log('Request to server');
  var requestUrl = new URL(event.request.url);
  var strURL = event.request.url;

  // Don't take these requests
  if (strURL.startsWith('chrome-extension://')
      || strURL.startsWith('https://csi.gstatic.com')
      || strURL.startsWith('https://maps.gstatic.com')
      || strURL.startsWith('https://fonts.gstatic.com')
      || strURL.startsWith('https://fonts.googleapis.com')
      || strURL.startsWith('https://maps.googleapis.com')) {
    return fetch(event.request);
  }

  if (requestUrl.origin === location.origin) {
    // Responds for /img/ requests
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }

  // Other responds
  event.respondWith(
    caches.open(staticCacheName).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        return response || fetch(event.request).then(function(response) {
          // Add new request to the cache
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );

});

// Create a cache for images
function servePhoto(request) {
  return caches.open(contentImgsCache).then(function (cache) {
    return cache.match(request.url).then(function (response) {
      if (response) return response;

      return fetch(request).then(function (networkResponse) {
        cache.put(request.url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}