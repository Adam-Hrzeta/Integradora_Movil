import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../lib/firebase";
import { updateProfile, updatePassword, User } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import PasswordModal from "./NewPasswordModal";
import NameModal from "./NewNameModal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { VehiclesDataSource } from "../../components/vehicles/dataSource/vehicles_dataSource";
import { Vehicle } from "../vehicles/entities/vehicle";
import VehicleCard from "../../components/vehicles/application/vehicleCard";
import EditVehicleModal from "../../components/vehicles/application/EditVehicleModal";
import RegisterVehicleModal from "../../components/vehicles/application/registerVehicleModal";

const ProfileScreen = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        setEmail(user.email || "");
        setProfileImage(user.photoURL || null);

        const dataSource = new VehiclesDataSource();
        const unsubscribeSnapshot = await dataSource.getUserVehicle(user.uid, (vehiclesData) => {
          setVehicles(vehiclesData);
        });

        return () => unsubscribeSnapshot();
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleUpdatePassword = async (newPassword: string) => {
    if (!newPassword) {
      Alert.alert("Error", "La nueva contraseña no puede estar vacía.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "No hay un usuario autenticado.");
      return;
    }

    try {
      setLoading(true);
      await updatePassword(user, newPassword);
      setNewPassword("");
      setPasswordModalVisible(false);
      Alert.alert("Éxito", "Contraseña actualizada correctamente.");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfileImage = async () => {
    if (!user) {
      Alert.alert("Error", "No hay un usuario autenticado.");
      return;
    }

    try {
      // Solicitar permisos de la galería
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitas permitir el acceso a la galería para cambiar la imagen.",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Configuración", 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
        return;
      }

      // Solicitar permisos de la cámara
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitas permitir el acceso a la cámara para tomar fotos.",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Configuración", 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
        return;
      }

      // Mostrar opciones para elegir imagen
      Alert.alert(
        "Cambiar foto de perfil",
        "¿Cómo deseas cambiar tu foto?",
        [
          {
            text: "Galería",
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                setLoading(true);
                try {
                  await updateProfile(user, { photoURL: result.assets[0].uri });
                  setProfileImage(result.assets[0].uri);
                  Alert.alert("Éxito", "Imagen de perfil actualizada correctamente.");
                } catch (error) {
                  if (error instanceof Error) {
                    Alert.alert("Error", error.message);
                  } else {
                    Alert.alert("Error", "Ocurrió un error al actualizar la imagen.");
                  }
                } finally {
                  setLoading(false);
                }
              }
            }
          },
          {
            text: "Cámara",
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                setLoading(true);
                try {
                  await updateProfile(user, { photoURL: result.assets[0].uri });
                  setProfileImage(result.assets[0].uri);
                  Alert.alert("Éxito", "Imagen de perfil actualizada correctamente.");
                } catch (error) {
                  if (error instanceof Error) {
                    Alert.alert("Error", error.message);
                  } else {
                    Alert.alert("Error", "Ocurrió un error al actualizar la imagen.");
                  }
                } finally {
                  setLoading(false);
                }
              }
            }
          },
          {
            text: "Cancelar",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "Ocurrió un error inesperado.");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "Ocurrió un error al cerrar la sesión.");
      }
    }
  };

  const handleUpdateName = async (newName: string) => {
    if (!user) {
      Alert.alert("Error", "No hay un usuario autenticado.");
      return;
    }

    try {
      setLoading(true);
      await updateProfile(user, { displayName: newName });
      Alert.alert("Éxito", "Nombre actualizado correctamente.");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      const dataSource = new VehiclesDataSource();
      await dataSource.deleteVehicle(vehicleId);
      Alert.alert("Vehículo eliminado", "El vehículo ha sido eliminado correctamente.");
      if (user) {
        dataSource.getUserVehicle(user.uid, (vehiclesData) => {
          setVehicles(vehiclesData);
        });
      }
    } catch (error) {
      console.error("Error al eliminar el vehículo:", error);
      Alert.alert("Error", "Hubo un problema al eliminar el vehículo. Inténtalo de nuevo.");
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalVisible(true);
  };

  const handleSaveVehicle = async (vehicle: Vehicle) => {
    try {
      const dataSource = new VehiclesDataSource();
      await dataSource.updateVehicle(vehicle);
      Alert.alert("Vehículo actualizado", "El vehículo ha sido actualizado correctamente.");
      if (user) {
        dataSource.getUserVehicle(user.uid, (vehiclesData) => {
          setVehicles(vehiclesData);
        });
      }
    } catch (error) {
      console.error("Error al actualizar el vehículo:", error);
      Alert.alert("Error", "Hubo un problema al actualizar el vehículo. Inténtalo de nuevo.");
    }
  };

  const handleVehicleAdded = () => {
    if (user) {
      const dataSource = new VehiclesDataSource();
      dataSource.getUserVehicle(user.uid, (vehiclesData) => {
        setVehicles(vehiclesData);
      });
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Inicie sesión para acceder a su perfil...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: "https://static.vecteezy.com/system/resources/previews/025/515/340/original/parking-top-view-garage-floor-with-cars-from-above-city-parking-lot-with-free-space-cartoon-street-carpark-with-various-vehicles-illustration-vector.jpg" }}
      style={styles.background}
      blurRadius={10}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={profileImage ? { uri: profileImage } : require("../../assets/images/defaultProfile.png")}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIcon} onPress={handleUpdateProfileImage}>
              <Ionicons name="camera" size={18} color="#FFF" />
            </TouchableOpacity>

            {/* Botón de Cerrar Sesión */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out" size={20} color="#FFF" />
              <Text style={styles.signOutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.title}>
                {user.displayName || "Sin nombre"}
              </Text>
              <TouchableOpacity style={styles.editName} onPress={() => setNameModalVisible(true)}>
                <Ionicons name="pencil" size={16} color="#FFF" />
                <Text style={styles.editNameText}>Editar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Correo electrónico:</Text>
            <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
              {email}
            </Text>

            <TouchableOpacity style={styles.changePasswordButton} onPress={() => setPasswordModalVisible(true)}>
              <Ionicons name="key" size={16} color="#FFF" />
              <Text style={styles.changePasswordText}>Cambiar contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicles Section */}
        <View style={styles.vehiclesContainer}>
          <View style={styles.vehiclesHeader}>
            <Text style={styles.vehiclesTitle}>Mis vehículos registrados</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setRegisterModalVisible(true)}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onDelete={handleDeleteVehicle}
                onEdit={handleEditVehicle}
              />
            ))
          ) : (
            <Text style={styles.noVehiclesText}>No tienes vehículos registrados.</Text>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <PasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onUpdatePassword={handleUpdatePassword}
      />
      <NameModal
        visible={nameModalVisible}
        onClose={() => setNameModalVisible(false)}
        onUpdateName={handleUpdateName}
        currentName={user.displayName || ""}
      />
      {editingVehicle && (
        <EditVehicleModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          vehicle={editingVehicle}
          onSave={handleSaveVehicle}
        />
      )}
      <RegisterVehicleModal
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        onVehicleAdded={handleVehicleAdded}
      />

      {loading && <ActivityIndicator size="large" color="#7E57C2" style={styles.loadingIndicator} />}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(46, 39, 57, 0.8)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  imageContainer: {
    marginRight: 15,
    position: "relative",
    alignItems: "center",
    marginBottom: 80,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  editIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#4CAF50",
    borderRadius: 6,
    padding: 1.5,
    borderWidth: 1.5,
    borderColor: "#FFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  signOutButton: {
    backgroundColor: "#BF360C",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    position: "absolute",
    bottom: -65,
    left: 0,
    right: 0,
  },
  signOutText: {
    color: "#FFF",
    fontSize: 12,
  },
  infoContainer: {
    flex: 1,
    marginBottom: 10,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    flex: 1,
    marginRight: 10,
  },
  editName: {
    backgroundColor: "#7E57C2",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editNameText: {
    color: "#FFF",
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    color: "#FFF",
    marginBottom: 5,
  },
  emailText: {
    fontSize: 14,
    color: "#B39DDB",
    marginBottom: 15,
    flexShrink: 1,
  },
  changePasswordButton: {
    backgroundColor: "#7E57C2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  changePasswordText: {
    color: "#FFF",
    fontSize: 12,
  },
  vehiclesContainer: {
    backgroundColor: "rgba(46, 39, 57, 0.8)",
    padding: 15,
    borderRadius: 10,
  },
  vehiclesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  vehiclesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  addButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 25,
    padding: 10,
  },
  noVehiclesText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
    marginTop: 10,
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfileScreen;