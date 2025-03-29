import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword, signOut } from "firebase/auth";
import { useRouter } from "expo-router"; // Importa useRouter de Expo Router

interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdatePassword: (newPassword: string) => Promise<void>; 
}

const PasswordModal: React.FC<PasswordModalProps> = ({ visible, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState(""); // Contraseña actual
  const [newPassword, setNewPassword] = useState(""); // Nueva contraseña
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirmar contraseña
  const [showPassword, setShowPassword] = useState(false); // Mostrar/ocultar contraseña
  const [error, setError] = useState(""); // Mensaje de error

  const auth = getAuth();
  const router = useRouter(); // Hook para redirigir al usuario

  const handleReauthenticate = async () => {
    const user = auth.currentUser;

    if (!user || !user.email) {
      setError("No se pudo obtener la información del usuario.");
      return false;
    }

    // Crear las credenciales para reautenticar
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
      // Reautenticar al usuario
      await reauthenticateWithCredential(user, credential);
      return true; // Reautenticación exitosa
    } catch (error) {
      setError("Contraseña actual incorrecta.");
      return false; // Reautenticación fallida
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    // Reautenticar al usuario antes de cambiar la contraseña
    const isReauthenticated = await handleReauthenticate();
    if (!isReauthenticated) return;

    // Cambiar la contraseña
    const user = auth.currentUser;
    if (user) {
      try {
        await updatePassword(user, newPassword);

        // Cerrar sesión después de actualizar la contraseña
        await signOut(auth);

        // Mostrar notificación
        Alert.alert(
          "Contraseña actualizada",
          "Vuelva a iniciar sesión con su nueva contraseña.",
          [
            {
              text: "OK",
              onPress: () => {
                onClose(); // Cerrar el modal
                router.push("/"); // Redirigir al usuario a la pantalla de inicio de sesión (index)
              },
            },
          ]
        );
      } catch (error) {
        setError("Error al actualizar la contraseña.");
      }
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

          {/* Campo para la contraseña actual */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña Actual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#7E57C2"
              />
            </TouchableOpacity>
          </View>

          {/* Campo para la nueva contraseña */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nueva Contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#7E57C2"
              />
            </TouchableOpacity>
          </View>

          {/* Campo para confirmar la nueva contraseña */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#7E57C2"
              />
            </TouchableOpacity>
          </View>

          {/* Mensaje de error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePassword}>
              <Text style={styles.updateButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#7E57C2",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  iconButton: {
    padding: 10,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  updateButton: {
    backgroundColor: "#7E57C2",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 10,
  },
  updateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default PasswordModal;