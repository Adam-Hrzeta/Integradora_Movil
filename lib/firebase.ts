import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCM-edYKqmH3ZJVYGbD0uEColY9d4LmTIo",
  authDomain: "integradora-d5795.firebaseapp.com",
  projectId: "integradora-d5795",
  storageBucket: "integradora-d5795.appspot.com",
  messagingSenderId: "654552369448",
  appId: "1:654552369448:web:4cd98c0e772753993ee81d",
  measurementId: "G-1XZG50BE57"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };