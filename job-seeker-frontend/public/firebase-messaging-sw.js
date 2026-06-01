importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDV_sTRvzW2niB-pFH7SQSGFQK32OgVVzk",
  projectId: "interview-platform-6c2d5",
  messagingSenderId: "481624099070",
  appId: "1:481624099070:web:aa692fb59e47551d2f7daf"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/window.svg",
  });
});