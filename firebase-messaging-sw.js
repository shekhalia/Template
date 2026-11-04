importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCi4Za2BvqiZwAn3claI1DPbYA2d2IABwY",
  authDomain: "gamestore-f35a7.firebaseapp.com",
  databaseURL: "https://gamestore-f35a7-default-rtdb.firebaseio.com",
  projectId: "gamestore-f35a7",
  storageBucket: "gamestore-f35a7.firebasestorage.app",
  messagingSenderId: "446538446400",
  appId: "1:446538446400:web:9ee8b4638320e30c7211a5",
  measurementId: "G-4Y6R9XFF9E"
});

const messaging = firebase.messaging();

// Background message handle karne ke liye (Favicon aur Bada Banner set karne ke liye)
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.data?.title || "New Notification";
  
  const notificationOptions = {
    body: payload.data?.body || "",
    
    icon: 'https://gamestore-200.pages.dev/android-chrome-192x192.png', 
    
    image: payload.data?.image, 
    
    data: { link: payload.data?.link || '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
