importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

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

// Yeh function check karega ki notification data kahan se aa raha hai
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Agar notification object ya data object dono mein se kuch bhi ho, 
  // yeh code sirf EK hi notification banayega.
  const notificationTitle = payload.notification?.title || payload.data?.title || "New Alert";
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: '/favicon.ico',
    image: payload.notification?.image || payload.notification?.icon || payload.data?.image || ''
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
