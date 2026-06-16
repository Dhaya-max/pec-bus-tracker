self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'PEC Bus Tracker', {
      body: data.body || '',
      icon: '/pnm.jpg',
      badge: '/pnm.jpg',
      vibrate: [200, 100, 200]
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(clients.openWindow('/student'))
})