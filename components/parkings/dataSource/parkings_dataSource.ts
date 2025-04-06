import { getDocs, query, where, collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db, rtdb } from "@/lib/firebase";
import { Parking } from "../entities/parking";
import { ref, onValue, get } from "firebase/database";

export class ParkingDataSource {
    constructor() {}

    /**
     * Obtiene todos los estacionamientos disponibles ahora desde RTDB.
     * @returns {Promise<Parking[]>} Una promesa que resuelve en un arreglo de objetos `Parking`.
     */
    async getParking(): Promise<Parking[]> {
        console.log("Obteniendo parkings desde RTDB...");
        try {
            // Usar RTDB en lugar de Firestore
            const parkingsRef = ref(rtdb, 'parkings');
            const snapshot = await get(parkingsRef);
            
            if (!snapshot.exists()) {
                console.log("No hay datos en RTDB/parkings");
                return [];
            }
            
            const parkingsData = snapshot.val();
            console.log("Datos recibidos de RTDB:", JSON.stringify(parkingsData));
            
            // Convertir objeto a array
            const items: Parking[] = Object.entries(parkingsData).map(([key, value]: [string, any]) => ({
                id: key,
                label: value.label || "Sin nombre",
                status: value.status || "libre"
            }));
            
            console.log(`Total de parkings obtenidos: ${items.length}`);
            return items;
        } catch (error) {
            console.error("Error al obtener parkings desde RTDB:", error);
            return [];
        }
    }

    /**
     * Obtiene solo los estacionamientos con estado "libre" desde RTDB.
     * @returns {Promise<Parking[]>} Una promesa que resuelve en un arreglo de objetos `Parking` con estado "libre".
     */
    async getFreeParking(): Promise<Parking[]> {
        console.log("Obteniendo parkings libres desde RTDB...");
        try {
            // Usar RTDB en lugar de Firestore
            const parkingsRef = ref(rtdb, 'parkings');
            const snapshot = await get(parkingsRef);
            
            if (!snapshot.exists()) {
                console.log("No hay datos en RTDB/parkings");
                return [];
            }
            
            const parkingsData = snapshot.val();
            
            // Filtrar por status "libre" y convertir a array
            const items: Parking[] = Object.entries(parkingsData)
                .filter(([_, value]: [string, any]) => value.status === "libre")
                .map(([key, value]: [string, any]) => ({
                    id: key,
                    label: value.label || "Sin nombre",
                    status: value.status || "libre"
                }));
            
            console.log(`Total de parkings libres: ${items.length}`);
            return items;
        } catch (error) {
            console.error("Error al obtener parkings libres desde RTDB:", error);
            return [];
        }
    }

    /**
     * Suscribe a cambios en tiempo real en la colección "parkings" desde RTDB.
     * @param {function} callback - Una función que se ejecutará cada vez que haya cambios en la colección.
     * @returns {function} Una función para cancelar la suscripción.
     */
    subscribeToParkingChanges(callback: (parkings: Parking[]) => void) {
        console.log("Suscribiendo a cambios en parkings (RTDB)...");
        // Suscribe a cambios en RTDB en 'parkings'
        const parkingsRef = ref(rtdb, 'parkings');
        
        const unsubscribe = onValue(parkingsRef, (snapshot) => {
            if (!snapshot.exists()) {
                console.log("No hay datos en snapshot de parkings");
                callback([]);
                return;
            }
            
            const parkingsData = snapshot.val();
            console.log("Datos actualizados recibidos:", JSON.stringify(parkingsData));
            
            // Convertir objeto a array
            const updatedParkings: Parking[] = Object.entries(parkingsData).map(([key, value]: [string, any]) => ({
                id: key,
                label: value.label || "Sin nombre",
                status: value.status || "libre"
            }));
            
            console.log(`Notificando ${updatedParkings.length} parkings actualizados`);
            callback(updatedParkings);
        }, (error) => {
            console.error("Error en la suscripción a parkings:", error);
            callback([]);
        });

        return unsubscribe;
    }

    /**
     * Actualiza el estado de un estacionamiento en la base de datos.
     * @param {string} parkingId - El ID del estacionamiento a actualizar.
     * @param {string} status - El nuevo estado del estacionamiento.
     * @returns {Promise<void>} Una promesa que resuelve cuando la actualización se completa.
     */
    async updateParkingStatus(parkingId: string, status: string) {
        // Obtiene una referencia al documento del estacionamiento.
        const parkingRef = doc(db, "parkings", parkingId);
        // Actualiza el campo "status" del documento.
        await updateDoc(parkingRef, { status });
    }
}