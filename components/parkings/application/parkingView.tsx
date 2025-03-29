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
import { getDatabase, ref, set, onValue } from "firebase/database";

const { width } = Dimensions.get("window");

const ParkingScreen = () => {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isParkingInProgress, setIsParkingInProgress] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const auth = getAuth();
  const database = getDatabase();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const dataSource = new ParkingDataSource();
          const parkingsData = await dataSource.getFreeParking();
          setParkings(parkingsData);

          const unsubscribeSnapshot = dataSource.subscribeToParkingChanges((updatedParkings) => {
            setParkings(updatedParkings);

            const isOccupied = updatedParkings.some((parking) => parking.status === "ocupado");
            if (isOccupied) {
              setIsParkingInProgress(false);
              setIsButtonDisabled(false);
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

    const notificationRef = ref(database, "notifications/waiting");
    onValue(notificationRef, (snapshot) => {
      const message = snapshot.val();
      if (message) {
        setNotification(message);
        Alert.alert("Notificación", message);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleParkingClick = async () => {
    setShowQRModal(true);
    setIsParkingInProgress(true);
    setIsButtonDisabled(true);

    const notificationRef = ref(database, "notifications/waiting");
    set(notificationRef, "Espere hasta que el automóvil anterior se estacione...");
  };

  const closeQRModal = () => {
    setShowQRModal(false);

    const notificationRef = ref(database, "notifications/waiting");
    set(notificationRef, null);
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
      // case "ocupado":
      //   return <AntDesign name="closecircle" size={24} color="red" />;
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
          <Text style={styles.buttonText}>Quiero estacionarme</Text>
        </TouchableOpacity>

        <Modal visible={showQRModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>QR para estacionarse</Text>
              <QRCode value="parking:reservado" size={200} color="black" backgroundColor="white" />
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
    width: 100, // Ajusta el ancho dinámicamente
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    padding: 10, // Añade padding interno
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
    width: "100%", // Asegura que el texto no desborde
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
    marginBottom: 10,
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
});

export default ParkingScreen;