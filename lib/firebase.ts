import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDb_ku8kOZgdmwvXhymO6FkLCAY5nEiZE0",
  authDomain: "parkingtech-99936.firebaseapp.com",
  projectId: "parkingtech-99936",
  storageBucket: "parkingtech-99936.firebasestorage.app",
  messagingSenderId: "964197580459",
  appId: "1:964197580459:web:6ec8e3127f0543ade341ee",
  measurementId: "G-KZJLNGH0WY",
  databaseURL: "https://parkingtech-99936-default-rtdb.firebaseio.com"
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
const rtdb = getDatabase(app);

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

export { auth, db, rtdb };