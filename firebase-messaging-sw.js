importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCi4Za2BvqiZwAn3claI1DPb...",
  authDomain: "gamestore-f35a7.firebaseapp.com",
  projectId: "gamestore-f35a7",
  storageBucket: "gamestore-f35a7.firebasestorage.app",
  messagingSenderId: "446538446400",
  appId: "1:446538446400:web:9ee8b4638320e..."
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon-32x32.png',
    image: payload.notification.image,
    data: {
      link: payload.fcmOptions?.link || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
