import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDr0d18dtCJxBuy2eeoAm9TzWu9OxlPfRk",
  authDomain: "task-manager-519c4.firebaseapp.com",
  projectId: "task-manager-519c4",
  storageBucket: "task-manager-519c4.firebasestorage.app",
  messagingSenderId: "79352699157",
  appId: "1:79352699157:web:a623aa965115a2815cb11c",
};

const VAPID_KEY = "BI9JjnLZ1iTxE6yOV3NnPKuN0hLeAg0OG2JKr7-hnOx4HGZU2qT9hpuh9de91DzfIdlV-LIWOUlKK1OCimoD8PE";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function enableNotifications() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  return getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}