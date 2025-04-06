import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './components/auth/login/LoginScreen';
import RegisterScreen from './components/auth/register/RegisterScreen';
import HomeScreen from './components/home/HomeScreen';
import ParkingScreen from './components/parkings/application/parkingView';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from './firebase/config';
import { ref, onValue, set } from 'firebase/database';

const Stack = createNativeStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Verificar y forzar conexión a Firebase
  useEffect(() => {
    console.log("Inicializando Firebase...");

    // Verificar conexión a Realtime Database
    const connectedRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;
      console.log("Estado de conexión a Firebase:", connected ? "CONECTADO" : "DESCONECTADO");
      setFirebaseReady(connected);
      setConnectionError(!connected);
      
      if (connected) {
        // Enviar ping para verificar escritura
        const pingRef = ref(database, 'system/ping');
        set(pingRef, {
          timestamp: Date.now(),
          client: 'mobile_app'
        }).then(() => {
          console.log("Ping a Firebase exitoso - escritura verificada");
        }).catch(err => {
          console.error("Error al escribir en Firebase:", err);
          setConnectionError(true);
        });
      }
    }, (error) => {
      console.error("Error de conexión a Firebase:", error);
      setConnectionError(true);
    });

    // Intentar forzar reconexión si hay problemas
    const forceReconnect = setTimeout(() => {
      if (!firebaseReady) {
        console.log("Forzando reconexión a Firebase...");
        // Activar un pequeño cambio para forzar reconexión
        const forceRef = ref(database, 'system/reconnect');
        set(forceRef, Date.now())
          .catch(err => console.log("Intento de reconexión:", err));
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(forceReconnect);
    };
  }, []);

  // Monitor de estado de autenticación
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  // Mostrar pantalla de carga mientras se inicializa Firebase
  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando aplicación...</Text>
      </View>
    );
  }

  // Mostrar error de conexión si es necesario
  if (connectionError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error de conexión</Text>
        <Text style={styles.errorText}>
          No se pudo conectar a Firebase. Por favor, verifica tu conexión a internet
          y reinicia la aplicación.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Parking"
              component={ParkingScreen}
              options={{ title: 'Estacionamiento' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  }
});

export default App; 