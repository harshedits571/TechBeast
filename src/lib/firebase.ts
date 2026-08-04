import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDo75HH4IzpMjN9gif-vMwfgi_WGEU0i8k",
  authDomain: "tech-beast-57ad6.firebaseapp.com",
  projectId: "tech-beast-57ad6",
  storageBucket: "tech-beast-57ad6.firebasestorage.app",
  messagingSenderId: "389822247404",
  appId: "1:389822247404:web:14f2059cb3e284689d50c9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
