import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { AntDesign, FontAwesome5, Fontisto, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Layout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    // Verificar si hay una sesión guardada
    checkStoredSession();

    // Suscribirse a cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Guardar la sesión
        await AsyncStorage.setItem('userSession', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
        setIsLoggedIn(true);
      } else {
        // Eliminar la sesión guardada
        await AsyncStorage.removeItem('userSession');
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkStoredSession = async () => {
    try {
      const session = await AsyncStorage.getItem('userSession');
      if (session) {
        const userData = JSON.parse(session);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error al verificar la sesión guardada:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerStyle: {
            width: "60%",
            height: "23%",
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Inicio",
            title: "Inició de sesión",
            drawerIcon: ({ color, size }) => (
              <AntDesign name="home" size={24} color="black" />
            ),
          }}
        />

        <Drawer.Screen
          name="(profile)"
          options={{
            drawerLabel: "Mi Perfil",
            title: "Mi Perfil de usuario",
            drawerIcon: ({ color, size }) => (
              <Fontisto name="person" size={24} color="#000000" />
            ),
            drawerItemStyle: isLoggedIn ? {} : { display: "none" },
          }}
        />

        <Drawer.Screen
          name="(parkings)"
          options={{
            drawerLabel: "Lotes disponibles",
            title: "Lotes disponibles",
            drawerIcon: ({ color, size }) => (
              <FontAwesome5 name="parking" size={24} color="#000000" />
            ),
            drawerItemStyle: isLoggedIn ? {} : { display: "none" },
          }}
        />

        <Drawer.Screen
          name="(messages)"
          options={{
            drawerLabel: "Mensajes",
            title: "Mensajes",
            drawerIcon: ({ color, size }) => (
              <MaterialIcons name="message" size={24} color="#000000" />
            ),
            drawerItemStyle: isLoggedIn ? {} : { display: "none" },
          }}
        />

        <Drawer.Screen
          name="(auth)"
          options={{
            title: "Credenciales de usuario",
            drawerItemStyle: { display: "none" },
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}