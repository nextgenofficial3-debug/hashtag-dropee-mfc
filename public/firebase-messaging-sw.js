importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const searchParams = new URL(self.location.href).searchParams;
const firebaseConfig = {
  apiKey: searchParams.get('apiKey'),
  authDomain: searchParams.get('authDomain'),
  projectId: searchParams.get('projectId'),
  storageBucket: searchParams.get('storageBucket'),
  messagingSenderId: searchParams.get('messagingSenderId'),
  appId: searchParams.get('appId'),
  measurementId: searchParams.get('measurementId'),
};

if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.apps.length ? firebase.messaging() : null;

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification || {};
    const notificationTitle = title || 'MFC Order Update';
    const notificationOptions = {
      body: body || 'Your order status has been updated!',
      icon: icon || '/icon-512.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      actions: [
        { action: 'track', title: 'Track Order' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
