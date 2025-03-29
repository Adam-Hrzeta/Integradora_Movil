import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // Para el degradado del botón
import { Vehicle } from "../entities/vehicle";

interface VehicleCardProps {
  vehicle: Vehicle;
  onDelete: (vehicleId: string) => void;
  onEdit: (vehicle: Vehicle) => void; // Nueva prop para editar
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onDelete, onEdit }) => {
  return (
    <View style={styles.vehicleItem}>
      {/* Botón de editar con degradado (esquina superior derecha) */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => onEdit(vehicle)} // Llama a la función onEdit con el vehículo
      >
        <LinearGradient
          colors={["#6C63FF", "#8E85FF"]} // Degradado morado
          style={styles.gradient}
        >
          <MaterialIcons name="edit" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Botón de eliminar con degradado (parte superior derecha, dentro de la tarjeta) */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(vehicle.id)}
      >
        <LinearGradient
          colors={["#FF416C", "#FF4B2B"]}
          style={styles.gradient}
        >
          <MaterialIcons name="delete" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Contenedor principal de dos columnas */}
      <View style={styles.columnsContainer}>
        {/* Columna izquierda */}
        <View style={styles.column}>
          {/* Marca */}
          <View style={styles.fieldContainer}>
            <MaterialIcons name="directions-car" size={24} color="#6C63FF" />
            <Text style={styles.vehicleFieldText}>Marca</Text>
          </View>
          <Text style={styles.vehicleInfoText}>{vehicle.brand}</Text>

          {/* Modelo */}
          <View style={styles.fieldContainer}>
            <MaterialIcons name="build" size={24} color="#6C63FF" />
            <Text style={styles.vehicleFieldText}>Modelo</Text>
          </View>
          <Text style={styles.vehicleInfoText}>{vehicle.model}</Text>
        </View>

        {/* Columna derecha */}
        <View style={styles.column}>
          {/* Placa */}
          <View style={styles.fieldContainer}>
            <MaterialIcons name="confirmation-number" size={24} color="#6C63FF" />
            <Text style={styles.vehicleFieldText}>Placa</Text>
          </View>
          <Text style={styles.vehicleInfoText}>{vehicle.licence}</Text>

          {/* Año */}
          <View style={styles.fieldContainer}>
            <MaterialIcons name="calendar-today" size={24} color="#6C63FF" />
            <Text style={styles.vehicleFieldText}>Año</Text>
          </View>
          <Text style={styles.vehicleInfoText}>{vehicle.year}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  vehicleItem: {
    padding: 16, // Padding interno
    marginBottom: 10,
    marginHorizontal: 15, // Margen horizontal
    backgroundColor: "rgba(46, 39, 57, 0.8)", // Color del contenedor del perfil
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)", // Borde sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  columnsContainer: {
    flexDirection: "row", // Dos columnas
    justifyContent: "space-between",
  },
  column: {
    flex: 1, // Cada columna ocupa la mitad del espacio
  },
  fieldContainer: {
    flexDirection: "row", // Ícono y texto en la misma fila
    alignItems: "center", // Alinear ícono y texto verticalmente
    marginBottom: 5, // Espacio entre el campo y su valor
  },
  vehicleFieldText: {
    fontSize: 16,
    color: "#6C63FF", // Color morado para los campos
    fontWeight: "bold",
    marginLeft: 8, // Espacio entre el ícono y el texto
  },
  vehicleInfoText: {
    fontSize: 16,
    color: "#FFF", // Color blanco para la información del usuario
    fontWeight: "500",
    marginBottom: 10, // Espacio entre cada campo y su valor
    marginLeft: 32, // Ajuste para alinear con los íconos
  },
  deleteButton: {
    position: "absolute",
    top: 110, // Posición del botón de eliminar (no se mueve)
    right: 10, // Posición del botón de eliminar (no se mueve)
    width: 40,
    height: 40,
    borderRadius: 70,
    overflow: "hidden",
  },
  editButton: {
    position: "absolute",
    top: -10, // Posición del botón de editar (no se mueve)
    right: -10, // Posición del botón de editar (no se mueve)
    width: 30,
    height: 30,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default VehicleCard;