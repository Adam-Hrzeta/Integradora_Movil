import React, { useState } from "react";
import { View, Text, TextInput, Button, Modal, StyleSheet, Alert } from "react-native";

interface NameModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdateName: (newName: string) => void;
  currentName: string;
}

const NameModal: React.FC<NameModalProps> = ({ visible, onClose, onUpdateName, currentName }) => {
  const [newName, setNewName] = useState(currentName);

  const handleUpdateName = () => {
    if (!newName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío.");
      return;
    }
    onUpdateName(newName);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cambiar Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nuevo nombre"
            value={newName}
            onChangeText={setNewName}
          />
          <View style={styles.buttonRow}>
            <Button title="Cancelar" onPress={onClose} color="#7E57C2" />
            <Button title="Guardar" onPress={handleUpdateName} color="#7E57C2" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#7E57C2",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default NameModal;