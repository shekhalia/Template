// 1. Firebase ke compat scripts import karein (Service worker me yeh zaroori hain)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// 2. Apni Firebase configuration initialize karein
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

// 3. Messaging instance banayein
const messaging = firebase.messaging();

// 4. Jab app background me ho aur notification aaye (Double notification se bachne ke liye data payload use kiya hai)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  // Backend se bhejte waqt data object me title, body aur url bhejna hai
  const notificationTitle = payload.data?.title || "New Notification";
  const notificationOptions = {
    body: payload.data?.body || "Aapke liye ek naya update hai.",
    icon: payload.data?.icon || '/android-chrome-192x192.png',
    data: { 
      url: payload.data?.url || 'https://gamestore-f35a7.firebaseapp.com/' 
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 5. Jab user notification par click karega, tab yeh code chalega aur redirect karega
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Notification box ko band kar do

  const clickURL = event.notification.data?.url || 'https://gamestore-f35a7.firebaseapp.com/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check karo agar website ka koi tab pehle se khula hai toh usko focus karke wahan navigate kar do
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === clickURL && 'focus' in client) {
          return client.focus();
        }
      }
      // Agar koi tab nahi khula, toh naya browser tab khol kar link par redirect kar do
      if (clients.openWindow) {
        return clients.openWindow(clickURL);
      }
    })
  );
});
