import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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

// Configurar autenticación
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: ReactNativeAsyncStorage ? 
      require('firebase/auth').getReactNativePersistence(ReactNativeAsyncStorage) : 
      require('firebase/auth').inMemoryPersistence
  });
}

const db = getFirestore(app);

// Manejar sesión en SecureStore para móviles
auth.onAuthStateChanged(async (user: any) => {
  if (Platform.OS !== "web") {
    if (user) {
      await SecureStore.setItemAsync("userToken", JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync("userToken");
    }
  }
});

export { auth, db };