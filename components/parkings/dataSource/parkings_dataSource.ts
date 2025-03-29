import { collection, doc, onSnapshot, updateDoc, query, where, getDocs } from "firebase/firestore";
import { Parking } from "../entities/parking";
import { db } from "@/lib/firebase";

export class ParkingDataSource {
    constructor() {}

    /**
     * Obtiene todos los estacionamientos disponibles en la base de datos.
     * @returns {Promise<Parking[]>} Una promesa que resuelve en un arreglo de objetos `Parking`.
     */
    async getParking(): Promise<Parking[]> {
        const items: Parking[] = [];
        // Obtiene todos los documentos de la colección "parkings".
        const docSnap = await getDocs(query(collection(db, "parkings")));

        // Itera sobre cada documento y lo convierte en un objeto `Parking`.
        docSnap.forEach((doc) => {
            const docData = doc.data();
            const item: Parking = {
                id: doc.id, // Usa el ID del documento de Firestore.
                label: docData.label, // Obtiene la etiqueta del estacionamiento.
                status: docData.status, // Obtiene el estado del estacionamiento.
            };
            items.push(item); // Agrega el objeto `Parking` al arreglo.
        });

        return items; // Retorna el arreglo de estacionamientos.
    }

    /**
     * Obtiene solo los estacionamientos con estado "libre".
     * @returns {Promise<Parking[]>} Una promesa que resuelve en un arreglo de objetos `Parking` con estado "libre".
     */
    async getFreeParking(): Promise<Parking[]> {
        const items: Parking[] = [];
        // Crea una consulta para obtener solo los estacionamientos con estado "libre".
        const q = query(collection(db, "parkings"), where("status", "==", "libre"));
        const docSnap = await getDocs(q);

        // Itera sobre cada documento y lo convierte en un objeto `Parking`.
        docSnap.forEach((doc) => {
            const docData = doc.data();
            const item: Parking = {
                id: doc.id, // Usa el ID del documento de Firestore.
                label: docData.label, // Obtiene la etiqueta del estacionamiento.
                status: docData.status, // Obtiene el estado del estacionamiento.
            };
            items.push(item); // Agrega el objeto `Parking` al arreglo.
        });

        return items; // Retorna el arreglo de estacionamientos libres.
    }

    /**
     * Suscribe a cambios en tiempo real en la colección "parkings".
     * @param {function} callback - Una función que se ejecutará cada vez que haya cambios en la colección.
     * @returns {function} Una función para cancelar la suscripción.
     */
    subscribeToParkingChanges(callback: (parkings: Parking[]) => void) {
        // Suscribe a cambios en la colección "parkings".
        const unsubscribe = onSnapshot(collection(db, "parkings"), (snapshot) => {
            // Mapea cada documento a un objeto `Parking`.
            const updatedParkings = snapshot.docs.map((doc) => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    label: docData.label,
                    status: docData.status,
                };
            });
            callback(updatedParkings); // Ejecuta el callback con los estacionamientos actualizados.
        });

        return unsubscribe; // Retorna la función para cancelar la suscripción.
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