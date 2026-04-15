// Firebase Messaging Service Worker — MFC App
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCExdszDcQzhJHoUvOqVlRwyfqfKkoA3kY",
  authDomain: "webapp-af75d.firebaseapp.com",
  projectId: "webapp-af75d",
  storageBucket: "webapp-af75d.firebasestorage.app",
  messagingSenderId: "52507263282",
  appId: "1:52507263282:web:da4df9b6e02b2d23e8d72b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] MFC background message:', payload);

  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || '🍗 MFC Order Update';
  const notificationOptions = {
    body: body || 'Your order status has been updated!',
    icon: icon || '/icon-512.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: 'track', title: '📦 Track Order' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
