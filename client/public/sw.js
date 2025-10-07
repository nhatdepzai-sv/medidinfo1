const CACHE_NAME = 'drugscan-v1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  '/src/pages/home.tsx',
  '/src/pages/history.tsx',
  '/src/pages/profile.tsx',
  '/src/pages/translator.tsx',
  '/src/components/camera-interface.tsx',
  '/src/components/drug-results.tsx',
  '/src/components/bottom-navigation.tsx',
  '/src/components/language-switcher.tsx',
  '/src/contexts/language-context.tsx',
  '/src/hooks/use-network.ts',
  '/tessdata/eng.traineddata',
  // Add critical assets
  '/assets/',
  '/fonts/',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        // Cache assets individually to avoid failure on missing files
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .catch((err) => {
        console.error('[SW] Failed to cache:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip chrome-extension and other non-http(s) schemes
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }

  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/health') {
      // Always try network first for health checks
      event.respondWith(
        fetch(request)
          .catch(() => {
            // Return offline status if network fails
            return new Response(JSON.stringify({
              status: 'offline',
              timestamp: new Date().toISOString(),
              offline: true
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          })
      );
      return;
    }

    if (url.pathname === '/api/search-medications') {
      // For search requests, try network first, then fallback to offline search
      event.respondWith(
        fetch(request)
          .then(response => {
            // Cache successful search responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Try to serve from cache first
            return caches.match(request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }

              // Fallback to offline search
              const query = url.searchParams.get('query');
              return performOfflineSearch(query);
            });
          })
      );
      return;
    }

    // For other API requests, try network first, then cache
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || new Response(JSON.stringify({
              success: false,
              message: 'Offline - feature not available'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // For HTML requests, try network first for updates
          if (request.destination === 'document') {
            fetch(request)
              .then(response => {
                if (response.ok) {
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, response.clone());
                  });
                }
              })
              .catch(() => {
                // Network failed, but we have cache
              });
          }
          return cachedResponse;
        }

        // Not in cache, try network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses or non-http(s) schemes
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache (only if http/https)
            if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                })
                .catch((err) => {
                  console.log('[SW] Failed to cache:', err);
                });
            }

            return response;
          })
          .catch(() => {
            // Network failed and not in cache
            if (request.destination === 'document') {
              // Return offline page for navigation requests
              return caches.match('/') || new Response('App offline', {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
              });
            }

            // For other requests, return a generic offline response
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Offline search functionality
async function performOfflineSearch(query) {
  if (!query || query.trim().length < 2) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Query too short for offline search'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Built-in offline medication database
  const offlineMedications = [
    {
      id: 'offline-1',
      name: 'Paracetamol',
      nameVi: 'Paracetamol',
      genericName: 'Acetaminophen',
      category: 'Pain Reliever',
      categoryVi: 'Thuốc giảm đau',
      primaryUse: 'Pain relief and fever reduction',
      primaryUseVi: 'Giảm đau và hạ sốt',
      adultDosage: '500-1000mg every 4-6 hours',
      adultDosageVi: '500-1000mg mỗi 4-6 giờ',
      warnings: ['Do not exceed 4000mg daily', 'Avoid alcohol'],
      warningsVi: ['Không vượt quá 4000mg mỗi ngày', 'Tránh rượu bia'],
      aliases: ['para', 'paracet', 'acetaminophen', 'tylenol', 'panadol']
    },
    {
      id: 'offline-2',
      name: 'Ibuprofen',
      nameVi: 'Ibuprofen',
      genericName: 'Ibuprofen',
      category: 'NSAID',
      categoryVi: 'Thuốc chống viêm',
      primaryUse: 'Pain, inflammation, and fever reduction',
      primaryUseVi: 'Giảm đau, chống viêm và hạ sốt',
      adultDosage: '200-400mg every 4-6 hours',
      adultDosageVi: '200-400mg mỗi 4-6 giờ',
      warnings: ['Take with food', 'Not for children under 6 months'],
      warningsVi: ['Dùng cùng thức ăn', 'Không dành cho trẻ dưới 6 tháng'],
      aliases: ['ibu', 'advil', 'motrin', 'brufen']
    },
    {
      id: 'offline-3',
      name: 'Aspirin',
      nameVi: 'Aspirin',
      genericName: 'Acetylsalicylic Acid',
      category: 'NSAID',
      categoryVi: 'Thuốc chống viêm',
      primaryUse: 'Pain relief, anti-inflammatory, blood thinner',
      primaryUseVi: 'Giảm đau, chống viêm, làm loãng máu',
      adultDosage: '325-650mg every 4 hours',
      adultDosageVi: '325-650mg mỗi 4 giờ',
      warnings: ['Risk of bleeding', 'Not for children under 16'],
      warningsVi: ['Nguy cơ chảy máu', 'Không dành cho trẻ dưới 16 tuổi'],
      aliases: ['asp', 'asa', 'bayer']
    },
    {
      id: 'offline-4',
      name: 'Amoxicillin',
      nameVi: 'Amoxicillin',
      genericName: 'Amoxicillin',
      category: 'Antibiotic',
      categoryVi: 'Kháng sinh',
      primaryUse: 'Bacterial infections',
      primaryUseVi: 'Nhiễm trùng do vi khuẩn',
      adultDosage: '250-500mg every 8 hours',
      adultDosageVi: '250-500mg mỗi 8 giờ',
      warnings: ['Complete full course', 'May cause allergic reactions'],
      warningsVi: ['Dùng hết liệu trình', 'Có thể gây dị ứng'],
      aliases: ['amox', 'amoxil']
    },
    {
      id: 'offline-5',
      name: 'Ginkgo Biloba',
      nameVi: 'Bạch Quả',
      genericName: 'Ginkgo Biloba Extract',
      category: 'Herbal Supplement',
      categoryVi: 'Thực phẩm chức năng thảo dược',
      primaryUse: 'Memory enhancement, circulation improvement',
      primaryUseVi: 'Cải thiện trí nhớ, tuần hoàn máu',
      adultDosage: '40-80mg two to three times daily',
      adultDosageVi: '40-80mg hai đến ba lần mỗi ngày',
      warnings: ['May interact with blood thinners', 'Consult doctor if pregnant'],
      warningsVi: ['Có thể tương tác với thuốc chống đông máu', 'Tham khảo ý kiến bác sĩ nếu mang thai'],
      aliases: ['ginkgo', 'biloba', 'memory herb', 'gink']
    }
  ];

  const searchTerm = query.toLowerCase().trim();

  // Enhanced scoring for partial matches
  const scoredResults = offlineMedications.map(med => {
    let score = 0;

    // Check aliases first (highest priority for partial matches)
    if (med.aliases && med.aliases.some(alias => alias.includes(searchTerm))) {
      score = 100;
    }
    // Exact matches
    else if (med.name.toLowerCase() === searchTerm ||
             med.nameVi.toLowerCase() === searchTerm ||
             med.genericName?.toLowerCase() === searchTerm) {
      score = 95;
    }
    // Starts with search term
    else if (med.name.toLowerCase().startsWith(searchTerm) ||
             med.nameVi.toLowerCase().startsWith(searchTerm) ||
             med.genericName?.toLowerCase().startsWith(searchTerm)) {
      score = 90;
    }
    // Contains search term
    else if (med.name.toLowerCase().includes(searchTerm) ||
             med.nameVi.toLowerCase().includes(searchTerm) ||
             med.genericName?.toLowerCase().includes(searchTerm)) {
      score = 80;
    }
    // Category match
    else if (med.category.toLowerCase().includes(searchTerm) ||
             med.categoryVi.toLowerCase().includes(searchTerm)) {
      score = 70;
    }

    return { med, score };
  }).filter(result => result.score > 0);

  const results = scoredResults
    .sort((a, b) => b.score - a.score)
    .map(result => ({
      ...result.med,
      score: result.score,
      createdAt: new Date().toISOString()
    }));

  return new Response(JSON.stringify({
    success: results.length > 0,
    message: results.length > 0 
      ? `Found ${results.length} medication(s) (Offline Mode)`
      : 'No medications found in offline database',
    medications: results,
    searchTerm: query,
    totalResults: results.length
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sync any cached data when connection is restored
  try {
    const cache = await caches.open(CACHE_NAME);
    // You can implement data synchronization logic here
    console.log('[SW] Data sync completed');
  } catch (error) {
    console.error('[SW] Data sync failed:', error);
  }
}

// Push notification support for updates
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'DrugScan update available',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'drugscan-update'
  };

  event.waitUntil(
    self.registration.showNotification('DrugScan', options)
  );
});