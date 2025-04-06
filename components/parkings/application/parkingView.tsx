import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ImageBackground,
  Alert,
  Dimensions,
} from "react-native";
import { Parking } from "../entities/parking";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ParkingDataSource } from "../dataSource/parkings_dataSource";
import { AntDesign, Entypo } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { getFirestore, collection, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { ref, onValue, get } from "firebase/database";
import { rtdb } from "../../../lib/firebase";

const { width } = Dimensions.get("window");

const ParkingScreen = () => {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isParkingInProgress, setIsParkingInProgress] = useState(false);
  const [notification, setNotification] = useState<string | null>("Esperando vehículo...");
  const [vehicleDetected, setVehicleDetected] = useState(false);

  const auth = getAuth();
  const firestore = getFirestore();

  useEffect(() => {
    console.log("=== INICIALIZANDO PARKING VIEW (FIRESTORE) ===");
    
    // IMPORTANTE: Un tiempo de espera para inicializar Firestore
    setTimeout(() => {
      try {
        // Comprobar conexión con Firestore
        const testRef = doc(firestore, "system", "test");
        setDoc(testRef, { 
          timestamp: new Date(),
          check: true 
        }).then(() => {
          console.log("✅ Conexión a Firestore OK");
        }).catch(err => {
          console.error("❌ Error en conexión a Firestore:", err);
        });
      } catch (err) {
        console.error("Error en verificación inicial:", err);
      }
    }, 1000);
    
    // Auth listener y carga de estacionamientos (sin cambios)
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const dataSource = new ParkingDataSource();
          const parkingsData = await dataSource.getFreeParking();
          setParkings(parkingsData);

          const unsubscribeSnapshot = dataSource.subscribeToParkingChanges((updatedParkings) => {
            setParkings(updatedParkings);

            const isOccupied = updatedParkings.some((parking) => parking.status === "ocupado");
            if (isOccupied && isParkingInProgress) {
              setIsParkingInProgress(false);
              setIsButtonDisabled(!vehicleDetected);
            }
          });

          return () => unsubscribeSnapshot();
        } catch (error) {
          console.error("Error fetching parkings:", error);
          setError("Error al cargar los estacionamientos");
        } finally {
          setLoading(false);
        }
      } else {
        console.error("El usuario no ha iniciado sesión");
        setLoading(false);
      }
    });

    // CORRECCIÓN CLAVE: Escuchar directamente de colección vehiculos
    console.log("Configurando listener prioritario en vehiculos/actual...");
    const vehicleDocRef = doc(firestore, "vehiculos", "actual");
    const unsubscribeVehicleDirect = onSnapshot(vehicleDocRef, (docSnap) => {
      try {
        if (docSnap.exists()) {
          // Loggear exactamente lo que se recibe
          const data = docSnap.data();
          console.log("⭐ vehiculos/actual datos:", JSON.stringify(data));
          
          // Interpretar el valor como booleano (true = detectado)
          const detected = data.detectado === true;
          
          console.log(`⭐ Estado de detección: ${detected ? "DETECTADO ✓" : "NO DETECTADO ✗"}`);
            
          // SIEMPRE actualizar el estado local si hay un cambio
          if (detected !== vehicleDetected) {
            console.log(`CAMBIO DETECTADO - Actualizando UI - Detectado: ${detected}`);
            
            // Actualizar estado interno
            setVehicleDetected(detected);
            
            // IMPORTANTE: El botón solo se habilita si no hay estacionamiento en curso
            if (!isParkingInProgress) {
              console.log(`Botón de QR ahora: ${detected ? "HABILITADO" : "DESHABILITADO"}`);
              setIsButtonDisabled(!detected);
            }
            
            // Notificación del cambio
            if (detected) {
              setNotification("¡Vehículo detectado! Puede generar su QR.");
            } else {
              setNotification("Esperando detección de vehículo...");
            }
          } else {
            console.log("Sin cambios en el estado de detección");
          }
        } else {
          console.log("Documento vehiculos/actual no existe");
        }
      } catch (err) {
        console.error("Error procesando evento de detección:", err);
      }
    }, (error) => {
      console.error("ERROR EN LISTENER vehiculos/actual:", error);
    });
    
    // RESPALDO: Escuchar estado del sistema como respaldo
    console.log("Configurando listener de respaldo en system/status...");
    const systemStatusRef = doc(firestore, "system", "status");
    const unsubscribeSystemStatus = onSnapshot(systemStatusRef, (docSnap) => {
      try {
        if (!docSnap.exists()) return;
        
        const data = docSnap.data();
        console.log("💡 Estado de sistema:", JSON.stringify(data));
        
        // Este listener es un respaldo para reforzar la actualización UI
        if ('vehiculo_detectado' in data) {
          const detected = data.vehiculo_detectado === true;
          
          // Revisar si también debemos actualizar puede_generar_qr
          const canGenerateQR = data.puede_generar_qr === true;
          console.log(`🔑 Sistema status - puede_generar_qr: ${canGenerateQR}`);
          
          if (detected !== vehicleDetected || (!isButtonDisabled !== canGenerateQR && !isParkingInProgress)) {
            console.log(`RESPALDO: Cambio por estado del sistema - Detectado: ${detected}, Puede generar QR: ${canGenerateQR}`);
            setVehicleDetected(detected);
            
            if (!isParkingInProgress) {
              // IMPORTANTE: Usar directamente el valor puede_generar_qr si está disponible
              if ('puede_generar_qr' in data) {
                setIsButtonDisabled(!canGenerateQR);
              } else {
                setIsButtonDisabled(!detected);
              }
            }
            
            if (detected) {
              setNotification(data.mensaje || "¡Vehículo detectado! Puede generar su QR.");
            } else {
              setNotification("Esperando detección de vehículo...");
            }
          }
        }
      } catch (err) {
        console.error("Error en listener de sistema:", err);
      }
    });
    
    // RESPALDO ADICIONAL: Ultrasonico deteccion
    console.log("Configurando listener adicional en ultrasonico/deteccion...");
    const ultrasonicRef = doc(firestore, "ultrasonico", "deteccion");
    const unsubscribeUltrasonic = onSnapshot(ultrasonicRef, (docSnap) => {
      try {
        if (!docSnap.exists()) return;
        
        const data = docSnap.data();
        console.log("📡 Ultrasónico detección:", JSON.stringify(data));
        
        // Este es el tercer respaldo
        if ('detectado' in data) {
          const detected = data.detectado === true;
          
          if (detected !== vehicleDetected) {
            console.log(`RESPALDO 2: Cambio por ultrasónico - Detectado: ${detected}`);
            setVehicleDetected(detected);
            
            if (!isParkingInProgress) {
              setIsButtonDisabled(!detected);
            }
            
            if (detected) {
              setNotification("¡Vehículo detectado! Puede generar su QR.");
            } else {
              setNotification("Esperando detección de vehículo...");
            }
          }
        }
      } catch (err) {
        console.error("Error en listener de ultrasónico:", err);
      }
    });
    
    // Escuchar notificaciones
    console.log("Configurando listener de notificaciones...");
    const notificationsRef = doc(firestore, "system", "notifications");
    const unsubscribeNotifications = onSnapshot(notificationsRef, (docSnap) => {
      try {
        if (!docSnap.exists()) return;
        
        const data = docSnap.data();
        if (data.mensaje) {
          // Actualizar el estado de notificación siempre
          setNotification(data.mensaje);
          
          // Verificar si es una notificación de solicitud de estacionamiento
          const esNotificacionEstacionamiento = data.mensaje.includes("solicitando estacionamiento");
          const usuarioActual = auth.currentUser?.uid;
          
          // Mostrar alerta solo si no es una solicitud de estacionamiento generada por el usuario actual
          if (!(esNotificacionEstacionamiento && data.solicitanteId === usuarioActual)) {
            Alert.alert("Notificación", data.mensaje);
          } else {
            console.log("Notificación propia de solicitud, no mostrando alerta");
          }
        }
      } catch (err) {
        console.error("Error en listener de notificaciones:", err);
      }
    });

    // Escuchar eventos de la barrera
    console.log("Configurando listener de barrera...");
    const barreraRef = doc(firestore, "barrera", "estado");
    const unsubscribeBarrera = onSnapshot(barreraRef, (docSnap) => {
      try {
        if (!docSnap.exists()) return;
        
        const barreraData = docSnap.data();
        if (barreraData && isParkingInProgress) {
          if (barreraData.status === "abierta" && barreraData.reason === "qr_valido") {
            setShowQRModal(false);
            Alert.alert("Acceso concedido", "La barrera se ha abierto. Puede ingresar al estacionamiento.");
            
            // Actualizar notificación
            setDoc(doc(firestore, "system", "notifications"), {
              mensaje: "Usuario en proceso de estacionamiento...",
              timestamp: new Date()
            });
          }
          
          if (barreraData.status === "cerrada" && barreraData.reason === "cajon_ocupado") {
            setIsParkingInProgress(false);
            setIsButtonDisabled(!vehicleDetected);
            Alert.alert("Estacionamiento completado", "Se ha registrado su entrada. ¡Bienvenido!");
            
            // Limpiar notificación
            setDoc(doc(firestore, "system", "notifications"), {
              mensaje: "",
              timestamp: new Date()
            });
          }
        }
      } catch (err) {
        console.error("Error en listener de barrera:", err);
      }
    });
    
    // DEPURACIÓN: Verificar estado periódicamente
    console.log("Configurando verificación periódica...");
    const verificacionInterval = setInterval(() => {
      console.log(`(NOBRIDGE) LOG  Estado actual - vehicleDetected: ${vehicleDetected}, isButtonDisabled: ${isButtonDisabled}`);
      
      // FORZAR CONSISTENCIA: Si tenemos vehicleDetected=true pero el botón sigue deshabilitado
      if (vehicleDetected === true && isButtonDisabled === true && isParkingInProgress === false) {
        console.log("⚠️ INCONSISTENCIA DETECTADA: Forzando habilitación del botón");
        setIsButtonDisabled(false);
      }
      
      // Verificar estado directo en RTDB (Realtime Database) - PRIORIDAD MÁXIMA
      try {
        // Consulta directa a RTDB para obtener datos actuales
        console.log("🔍 Realizando verificación directa en RTDB...");
        const statusRef = ref(rtdb, 'system/status');
        get(statusRef).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            // Forzar a booleanos con ===
            const rtdbDetected = data.vehiculo_detectado === true;
            const rtdbCanGenerateQR = data.puede_generar_qr === true;
            
            console.log(`🔍 RTDB directo: vehiculo_detectado=${rtdbDetected} (${typeof data.vehiculo_detectado}: ${data.vehiculo_detectado}), puede_generar_qr=${rtdbCanGenerateQR} (${typeof data.puede_generar_qr}: ${data.puede_generar_qr})`);
            
            // Si hay discrepancia con el estado local
            if (rtdbDetected !== vehicleDetected || (rtdbCanGenerateQR !== !isButtonDisabled && !isParkingInProgress)) {
              console.log("⚠️ DISCREPANCIA DETECTADA EN RTDB: Actualizando estado local");
              
              // Primero actualizamos la detección
              setVehicleDetected(rtdbDetected);
              
              // Luego, tras un pequeño retraso, actualizamos el estado del botón
              setTimeout(() => {
                if (!isParkingInProgress) {
                  const nuevoEstadoBoton = !rtdbCanGenerateQR;
                  console.log(`🔄 Corrigiendo estado del botón: ${nuevoEstadoBoton ? "DESHABILITADO" : "HABILITADO"}`);
                  setIsButtonDisabled(nuevoEstadoBoton);
                }
              }, 200);
            }
          } else {
            console.log("⚠️ No hay datos en RTDB system/status");
          }
        }).catch(err => {
          console.error("❌ Error consultando RTDB:", err);
        });
      
        // Revisar vehiculos/actual en Firestore como respaldo
        getDoc(doc(firestore, "vehiculos", "actual")).then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const firebaseValue = data.detectado === true;
            console.log(`📊 Verificación directa - Firestore vehiculos/actual.detectado = ${firebaseValue}`);
            
            // Si hay discrepancia entre lo que creemos y lo que tiene Firestore
            if (firebaseValue !== vehicleDetected) {
              console.log("⚠️ DISCREPANCIA: Estado local difiere de Firestore");
              // Corregir nuestro estado si hay discrepancia
              setVehicleDetected(firebaseValue);
              if (!isParkingInProgress) {
                setIsButtonDisabled(!firebaseValue);
              }
            }
          }
        }).catch(err => {
          console.error("Error en verificación directa de vehículos:", err);
        });
        
        // Revisar system/status para verificar puede_generar_qr
        getDoc(doc(firestore, "system", "status")).then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            if ('puede_generar_qr' in data) {
              const canGenerateQR = data.puede_generar_qr === true;
              console.log(`📊 Verificación directa - Firestore system/status.puede_generar_qr = ${canGenerateQR}`);
              
              // Si isButtonDisabled debe ser lo opuesto a canGenerateQR (y no hay estacionamiento en curso)
              if (!canGenerateQR !== isButtonDisabled && !isParkingInProgress) {
                console.log("⚠️ DISCREPANCIA EN ESTADO DE BOTÓN: Actualizando...");
                setIsButtonDisabled(!canGenerateQR);
              }
            }
          }
        }).catch(err => {
          console.error("Error en verificación directa de sistema:", err);
        });
      } catch (err) {
        console.error("Error en verificación:", err);
      }
    }, 5000); // Cada 5 segundos

    // Listener prioritario para RTDB
    console.log("🔥 PRIORITARIO: Configurando listener RTDB para system/status...");
    const rtdbVehicleStatusRef = ref(rtdb, 'system/status');
    const unsubscribeRtdb = onValue(rtdbVehicleStatusRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("🔥 RTDB system/status datos completos:", JSON.stringify(data));
          
          // IMPORTANTE: Extraer explícitamente estos valores y convertirlos a booleanos con triple igual
          const detected = data.vehiculo_detectado === true;
          const canGenerateQR = data.puede_generar_qr === true;
          
          console.log(`🔥 RTDB Estado: vehiculo_detectado=${detected} (${typeof data.vehiculo_detectado}: ${data.vehiculo_detectado}), puede_generar_qr=${canGenerateQR} (${typeof data.puede_generar_qr}: ${data.puede_generar_qr})`);
          
          // FORZAR actualizaciones separadas para evitar condiciones de carrera en el estado
          setTimeout(() => {
            console.log(`🔄 Actualizando estado de detección a: ${detected}`);
            setVehicleDetected(detected);
            
            setTimeout(() => {
              if (!isParkingInProgress) {
                const nuevoEstadoBoton = !canGenerateQR;
                console.log(`🔄 Actualizando estado de botón a: ${nuevoEstadoBoton ? "DESHABILITADO" : "HABILITADO"} (canGenerateQR=${canGenerateQR})`);
                setIsButtonDisabled(nuevoEstadoBoton);
              }
              
              if (detected) {
                setNotification(data.mensaje || "¡Vehículo detectado! Puede generar su QR.");
              } else {
                setNotification("Esperando detección de vehículo...");
              }
            }, 200); // Incrementar el tiempo de espera para asegurar que el primer estado se actualizó
          }, 200); // Incrementar el tiempo de espera para asegurar que el snapshot se procesa completamente
        }
      } catch (err) {
        console.error("🔥 Error en RTDB listener:", err);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeVehicleDirect();
      unsubscribeSystemStatus();
      unsubscribeUltrasonic();
      unsubscribeNotifications();
      unsubscribeBarrera();
      clearInterval(verificacionInterval);
      unsubscribeRtdb();
    };
  }, [isParkingInProgress, vehicleDetected, isButtonDisabled]);

  const handleParkingClick = async () => {
    setShowQRModal(true);
    setIsParkingInProgress(true);
    setIsButtonDisabled(true);

    const user = auth.currentUser;
    if (user) {
      setDoc(doc(firestore, "parkingRequest", user.uid), {
        userId: user.uid,
        timestamp: new Date(),
        status: "pending"
      });
      
      // Guardar la notificación con el ID del usuario solicitante
      setDoc(doc(firestore, "system", "notifications"), {
        mensaje: "Un usuario está solicitando estacionamiento. Por favor espere...",
        timestamp: new Date(),
        solicitanteId: user.uid  // Guardar el ID del usuario que generó la solicitud
      });
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setIsParkingInProgress(false);
    
    const user = auth.currentUser;
    if (user) {
      // Limpiar la notificación pero mantener el ID del solicitante
      setDoc(doc(firestore, "system", "notifications"), {
        mensaje: "",
        timestamp: new Date(),
        solicitanteId: user.uid
      });
      
      // También actualizar el estado de la solicitud
      setDoc(doc(firestore, "parkingRequest", user.uid), {
        userId: user.uid,
        timestamp: new Date(),
        status: "cancelled"
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const getIconByStatus = (status: string) => {
    switch (status) {
      case "servicio":
        return (
          <View>
            <Entypo style={styles.iconService} name="tools" size={24} color="orange" />
            <Text style={styles.serviceText}>En servicio</Text>
          </View>
        );
      default:
        return <Text style={styles.freeText}>Disponible</Text>;
    }
  };

  return (
    <ImageBackground
      source={{
        uri: "https://static.vecteezy.com/system/resources/previews/025/515/340/original/parking-top-view-garage-floor-with-cars-from-above-city-parking-lot-with-free-space-cartoon-street-carpark-with-various-vehicles-illustration-vector.jpg",
      }}
      style={styles.background}
      blurRadius={10}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Estacionamientos</Text>
        
        {notification && (
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationText}>{notification}</Text>
          </View>
        )}
        
        <FlatList
          data={parkings.filter((parking) => parking.status !== "ocupado")}
          keyExtractor={(item) => item?.id || Math.random().toString()}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={styles.parkingItem}>
              {getIconByStatus(item.status)}
              <Text style={styles.parkingText} numberOfLines={1} ellipsizeMode="tail">
                {item.label}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />

        <TouchableOpacity
          style={[styles.parkingButton, isButtonDisabled && styles.disabledButton]}
          onPress={handleParkingClick}
          disabled={isButtonDisabled}
        >
          <Text style={styles.buttonText}>
            {vehicleDetected && !isParkingInProgress && !isButtonDisabled
              ? "Generar QR para acceso" 
              : isParkingInProgress 
                ? "Proceso en curso..." 
                : vehicleDetected && isButtonDisabled
                  ? "Esperando activación..."
                  : "Espere vehículo..."}
          </Text>
        </TouchableOpacity>

        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Estado: {vehicleDetected ? "Vehículo detectado" : "Sin vehículo"} | 
            Botón: {isButtonDisabled ? "Deshabilitado" : "Habilitado"}
          </Text>
        </View>

        <Modal visible={showQRModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>QR para estacionarse</Text>
              <QRCode value="PARKING:ACCESO" size={200} color="black" backgroundColor="white" />
              <Text style={styles.modalSubtitle}>Escanee este código en la entrada</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeQRModal}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  iconService: {
    flexDirection: "row",
    alignItems: "center",
    left: 23,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#FFF",
  },
  serviceText: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
    color: "orange",
  },
  freeText: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
    color: "green",
  },
  listContainer: {
    justifyContent: "flex-start",
    paddingLeft: 10,
  },
  parkingItem: {
    width: 100,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  parkingText: {
    marginTop: 5,
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    width: "100%",
  },
  parkingButton: {
    marginTop: 20,
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#6C63FF",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
  notificationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 14,
    color: '#333',
  },
});

export default ParkingScreen;