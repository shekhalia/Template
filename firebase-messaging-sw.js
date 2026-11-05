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

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Agar notification payload maujud hai, toh hum khud notification show karenge 
  // aur browser ke default automatic display ko rokne ki koshish karenge.
  const notificationTitle = payload.notification?.title || payload.data?.title || "New Game";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: '/favicon.ico',
    image: payload.notification?.image || payload.data?.image || ''
  };

  // Agar payload mein 'notification' object hai, toh kuch browser khud notification dikhate hain.
  // Lekin agar hum fcm_options ya data-only payload use karein toh ye ekdam fix ho jata hai.
});
