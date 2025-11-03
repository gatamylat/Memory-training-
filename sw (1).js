// Service Worker for Memory Training PWA
// Version 1.0.0

const CACHE_NAME = 'memory-training-pro-v2';
const urlsToCache = [
  '/memory_training_extended.html',
  '/manifest.json',
  // Add any additional resources here
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        return caches.match('/memory_training_extended.html');
      })
  );
});

// Background sync for data persistence
self.addEventListener('sync', event => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Sync local data with server when online
    // This would connect to your backend API
    console.log('Syncing progress data...');
    
    return Promise.resolve();
  } catch (error) {
    console.error('Sync failed:', error);
    return Promise.reject(error);
  }
}

// Push notifications for reminders
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Time for your daily brain training!',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" rx="24" fill="%23FF6B35"/%3E%3Ctext x="96" y="130" font-family="-apple-system" font-size="100" fill="white" text-anchor="middle"%3E🧠%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Ccircle cx="48" cy="48" r="48" fill="%23FF6B35"/%3E%3C/svg%3E',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'start',
        title: 'Start Training',
        icon: '⚡'
      },
      {
        action: 'later',
        title: 'Remind Later',
        icon: '⏰'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Memory Training', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'start') {
    // Open the app and start training
    event.waitUntil(
      clients.openWindow('/memory_training_extended.html?quick=true')
    );
  } else if (event.action === 'later') {
    // Schedule another reminder in 1 hour
    // This would typically interact with your notification scheduling system
    console.log('Rescheduling reminder...');
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/memory_training_extended.html')
    );
  }
});