import { db } from "@/lib/firebase";
import { Vehicle } from "../entities/vehicle";
import { collection, query, where, doc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";

export class VehiclesDataSource {
  constructor() {}

  // Obtener vehículos del usuario en tiempo real
  async getUserVehicle(uid: string, callback: (vehicles: Vehicle[]) => void): Promise<() => void> {
    const vehiclesRef = collection(db, "vehicles");
    const q = query(vehiclesRef, where("userId", "==", uid));

    // Escuchar cambios en la colección
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: Vehicle[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        const item: Vehicle = {
          id: doc.id,
          brand: docData.brand,
          licence: docData.licence,
          model: docData.model,
          year: docData.year,
        };
        items.push(item);
      });
      callback(items);
    });

    return unsubscribe; // Retornar la función para dejar de escuchar cambios
  }

  // Eliminar un vehículo por su ID
  async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      const vehicleRef = doc(db, "vehicles", vehicleId);
      await deleteDoc(vehicleRef);
      console.log("Vehículo eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el vehículo:", error);
      throw error;
    }
  }

  // Actualizar un vehículo
  async updateVehicle(vehicle: Vehicle): Promise<void> {
    try {
      const vehicleRef = doc(db, "vehicles", vehicle.id);
      await updateDoc(vehicleRef, {
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        licence: vehicle.licence,
      });
      console.log("Vehículo actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar el vehículo:", error);
      throw error;
    }
  }
}