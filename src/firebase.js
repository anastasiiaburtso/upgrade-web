import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Унікальний конфіг Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCQEMphPeHiDlH4Jhe3oo8SRzETCKvm0vM",
  authDomain: "upgrade-app-6bc0c.firebaseapp.com",
  projectId: "upgrade-app-6bc0c",
  storageBucket: "upgrade-app-6bc0c.firebasestorage.app",
  messagingSenderId: "662753054158",
  appId: "1:662753054158:web:d044d3d17baed356012f9f",
  measurementId: "G-WTY074YFK1"
};

// Ініціалізація Firebase, Авторизації та Бази даних
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);