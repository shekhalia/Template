importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AAPKA_API_KEY",
  authDomain: "AAPKA_AUTH_DOMAIN",
  projectId: "AAPKA_PROJECT_ID",
  storageBucket: "AAPKA_STORAGE_BUCKET",
  messagingSenderId: "AAPKA_MESSAGING_SENDER_ID",
  appId: "1:446538446400:web:9ee8b4638320e30c7211a5"
});

const messaging = firebase.messaging();
