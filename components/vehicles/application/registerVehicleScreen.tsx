import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import RNPickerSelect from "react-native-picker-select";

const RegisterVehicleScreen = () => {
  const [licensePlate, setLicensePlate] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carBrand, setCarBrand] = useState("");
  const [year, setYear] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();

  const handleRegisterVehicle = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "No hay un usuario autenticado.");
      return;
    }

    if (!licensePlate || !carModel || !carBrand) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    try {
      await addDoc(collection(db, "vehicles"), {
        licence: licensePlate,
        model: carModel,
        brand: carBrand,
        year: year,
        userId: user.uid,
      });

      Alert.alert("Vehículo registrado", "Tu vehículo ha sido registrado correctamente.");
      router.push("/(vehicles)/vehicles");
    } catch (error) {
      console.error("Error al registrar el vehículo:", error);
      Alert.alert("Error", "Hubo un problema al registrar el vehículo. Inténtalo de nuevo.");
    }
  };

  const years = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => ({
    label: `${1950 + i}`,
    value: `${1950 + i}`,
  }));

  return (
    <ImageBackground
      source={{
        uri: "https://static.vecteezy.com/system/resources/previews/025/515/340/original/parking-top-view-garage-floor-with-cars-from-above-city-parking-lot-with-free-space-cartoon-street-carpark-with-various-vehicles-illustration-vector.jpg",
      }}
      style={styles.background}
      blurRadius={10}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Registro de Vehículo</Text>

          {/* Campo Placa */}
          <TextInput
            style={[styles.input, focusedInput === "licensePlate" && styles.inputFocused]}
            placeholder="Placa (máx. 9 caracteres)"
            value={licensePlate}
            onChangeText={(text) => setLicensePlate(text.slice(0, 9))}
            autoCapitalize="characters"
            placeholderTextColor="#B39DDB"
            onFocus={() => setFocusedInput("licensePlate")}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Campo Modelo */}
          <TextInput
            style={[styles.input, focusedInput === "carModel" && styles.inputFocused]}
            placeholder="Modelo del vehículo"
            value={carModel}
            onChangeText={setCarModel}
            autoCapitalize="words"
            placeholderTextColor="#B39DDB"
            onFocus={() => setFocusedInput("carModel")}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Campo Marca */}
          <TextInput
            style={[styles.input, focusedInput === "carBrand" && styles.inputFocused]}
            placeholder="Marca del vehículo"
            value={carBrand}
            onChangeText={setCarBrand}
            autoCapitalize="words"
            placeholderTextColor="#B39DDB"
            onFocus={() => setFocusedInput("carBrand")}
            onBlur={() => setFocusedInput(null)}
          />

          {/* Selector de Año */}
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => setYear(value)}
              items={years}
              placeholder={{ label: "Selecciona el año", value: null }}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
            />
          </View>

          {/* Botón Registrar Vehículo */}
          <TouchableOpacity style={styles.button} onPress={handleRegisterVehicle}>
            <Text style={styles.buttonText}>Registrar Vehículo</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "80%",
    backgroundColor: "rgba(46, 39, 57, 0.8)",
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#FFF",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderBottomColor: "#7E57C2",
    borderBottomWidth: 1,
    marginBottom: 20,
    paddingLeft: 8,
    color: "#FFF",
  },
  inputFocused: {
    borderBottomColor: "#B39DDB", 
  },
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)", 
    borderRadius: 5,
    marginBottom: 20,
    overflow: "hidden",
  },
  button: {
    backgroundColor: "#7E57C2",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#7E57C2",
    borderRadius: 4,
    color: "#FFF",
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#7E57C2",
    borderRadius: 8,
    color: "#FFF",
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});

export default RegisterVehicleScreen;



// import React, { useState } from "react";
// import {
//   View,
//   TextInput,
//   Text,
//   Alert,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ImageBackground,
//   TouchableOpacity,
//   Modal,
//   FlatList,
//   TouchableWithoutFeedback,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { db } from "@/lib/firebase";
// import { collection, addDoc } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

// const RegisterVehicleScreen = () => {
//   const [licensePlate, setLicensePlate] = useState("");
//   const [carModel, setCarModel] = useState("");
//   const [carBrand, setCarBrand] = useState("");
//   const [year, setYear] = useState("");
//   const [focusedInput, setFocusedInput] = useState<string | null>(null);
//   const [showYearPicker, setShowYearPicker] = useState(false); // Estado para mostrar/ocultar el selector
//   const router = useRouter();

//   const years = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => `${1950 + i}`);

//   const handleRegisterVehicle = async () => {
//     const auth = getAuth();
//     const user = auth.currentUser;

//     if (!user) {
//       Alert.alert("Error", "No hay un usuario autenticado.");
//       return;
//     }

//     if (!licensePlate || !carModel || !carBrand) {
//       Alert.alert("Error", "Por favor, completa todos los campos.");
//       return;
//     }

//     try {
//       await addDoc(collection(db, "vehicles"), {
//         licence: licensePlate,
//         model: carModel,
//         brand: carBrand,
//         year: year,
//         userId: user.uid,
//       });

//       Alert.alert("Vehículo registrado", "Tu vehículo ha sido registrado correctamente.");
//       router.push("/(vehicles)/vehicles");
//     } catch (error) {
//       console.error("Error al registrar el vehículo:", error);
//       Alert.alert("Error", "Hubo un problema al registrar el vehículo. Inténtalo de nuevo.");
//     }
//   };

//   const renderYearItem = ({ item }: { item: string }) => (
//     <TouchableOpacity
//       style={styles.yearItem}
//       onPress={() => {
//         setYear(item);
//         setShowYearPicker(false);
//       }}
//     >
//       <Text style={styles.yearText}>{item}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <ImageBackground
//       source={{
//         uri: "https://static.vecteezy.com/system/resources/previews/025/515/340/original/parking-top-view-garage-floor-with-cars-from-above-city-parking-lot-with-free-space-cartoon-street-carpark-with-various-vehicles-illustration-vector.jpg",
//       }}
//       style={styles.background}
//       blurRadius={10}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.container}
//       >
//         <View style={styles.formContainer}>
//           <Text style={styles.title}>Registro de Vehículo</Text>

//           {/* Campo Placa */}
//           <TextInput
//             style={[styles.input, focusedInput === "licensePlate" && styles.inputFocused]}
//             placeholder="Placa (máx. 9 caracteres)"
//             value={licensePlate}
//             onChangeText={(text) => setLicensePlate(text.slice(0, 9))}
//             autoCapitalize="characters"
//             placeholderTextColor="#B39DDB"
//             onFocus={() => setFocusedInput("licensePlate")}
//             onBlur={() => setFocusedInput(null)}
//           />

//           {/* Campo Modelo */}
//           <TextInput
//             style={[styles.input, focusedInput === "carModel" && styles.inputFocused]}
//             placeholder="Modelo del vehículo"
//             value={carModel}
//             onChangeText={setCarModel}
//             autoCapitalize="words"
//             placeholderTextColor="#B39DDB"
//             onFocus={() => setFocusedInput("carModel")}
//             onBlur={() => setFocusedInput(null)}
//           />

//           {/* Campo Marca */}
//           <TextInput
//             style={[styles.input, focusedInput === "carBrand" && styles.inputFocused]}
//             placeholder="Marca del vehículo"
//             value={carBrand}
//             onChangeText={setCarBrand}
//             autoCapitalize="words"
//             placeholderTextColor="#B39DDB"
//             onFocus={() => setFocusedInput("carBrand")}
//             onBlur={() => setFocusedInput(null)}
//           />

//           {/* Selector de Año */}
//           <TouchableOpacity
//             style={styles.yearPickerButton}
//             onPress={() => setShowYearPicker(true)}
//           >
//             <Text style={styles.yearPickerButtonText}>
//               {year || "Selecciona el año"}
//             </Text>
//           </TouchableOpacity>

//           {/* Modal para el selector de años */}
//           <Modal
//             visible={showYearPicker}
//             transparent={true}
//             animationType="slide"
//             onRequestClose={() => setShowYearPicker(false)}
//           >
//             <TouchableWithoutFeedback onPress={() => setShowYearPicker(false)}>
//               <View style={styles.modalOverlay}>
//                 <View style={styles.modalContent}>
//                   <FlatList
//                     data={years}
//                     renderItem={renderYearItem}
//                     keyExtractor={(item) => item}
//                     showsVerticalScrollIndicator={false}
//                     style={styles.yearList}
//                   />
//                 </View>
//               </View>
//             </TouchableWithoutFeedback>
//           </Modal>

//           {/* Botón Registrar Vehículo */}
//           <TouchableOpacity style={styles.button} onPress={handleRegisterVehicle}>
//             <Text style={styles.buttonText}>Registrar Vehículo</Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </ImageBackground>
//   );
// };

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     resizeMode: "cover",
//     justifyContent: "center",
//   },
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   formContainer: {
//     width: "80%",
//     backgroundColor: "rgba(46, 39, 57, 0.8)",
//     padding: 25,
//     borderRadius: 15,
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.2)",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     textAlign: "center",
//     color: "#FFF",
//     marginBottom: 20,
//   },
//   input: {
//     height: 40,
//     borderBottomColor: "#7E57C2",
//     borderBottomWidth: 1,
//     marginBottom: 20,
//     paddingLeft: 8,
//     color: "#FFF",
//   },
//   inputFocused: {
//     borderBottomColor: "#B39DDB", 
//   },
//   yearPickerButton: {
//     height: 40,
//     justifyContent: "center",
//     borderBottomColor: "#7E57C2",
//     borderBottomWidth: 1,
//     marginBottom: 20,
//     paddingLeft: 8,
//   },
//   yearPickerButtonText: {
//     color: "#FFF",
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     width: "80%",
//     maxHeight: 200, // Limita la altura del modal
//     backgroundColor: "#FFF",
//     borderRadius: 10,
//     padding: 10,
//   },
//   yearList: {
//     flexGrow: 0, // Evita que la lista ocupe todo el espacio
//   },
//   yearItem: {
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#CCC",
//   },
//   yearText: {
//     fontSize: 16,
//     color: "#000",
//   },
//   button: {
//     backgroundColor: "#7E57C2",
//     paddingVertical: 12,
//     borderRadius: 25,
//     alignItems: "center",
//     marginBottom: 15,
//   },
//   buttonText: {
//     color: "#FFF",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
// });

// export default RegisterVehicleScreen;