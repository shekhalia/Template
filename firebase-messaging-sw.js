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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const title = payload.data?.title || "New Game";
  const options = {
    body: payload.data?.body || "",
    icon: '/favicon.ico',
    image: payload.data?.image || ''
  };

  self.registration.showNotification(title, options);
});
