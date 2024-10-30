import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  Button,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase Storage funktioner
import { collection, addDoc, getDocs } from "firebase/firestore"; // Firestore funktioner
import { firestore, storage } from "./firebase"; // Importer Firestore og Storage fra firebase.js
import Chat from "./chat";

export default function App() {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null); // For at vise billedet af den valgte markør
  const [modalVisible, setModalVisible] = useState(false); // Styrer synligheden af modalen
  const [chat, setShowChat] = useState(false);

  // Håndter long-press for at tilføje en markør og vælge et billede
  const handleLongPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    if (!coordinate || !coordinate.latitude || !coordinate.longitude) {
      console.error("Coordinate is null or undefined", coordinate);
      Alert.alert("Fejl", "GPS-position kunne ikke hentes.");
      return;
    }

    // Vælg et billede fra Photos
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0]; // Få adgang til billedets URI

      // Upload billedet til Firebase Storage
      try {
        const imageName = `images/${Date.now()}.jpg`;
        const storageRef = ref(storage, imageName);

        // Hent billedets blob-data
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload billedet
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        // Gem GPS-lokation og billedets URL i Firestore
        await addDoc(collection(firestore, "markers"), {
          coordinate,
          imageUrl: downloadURL,
        });

        // Tilføj markøren til state
        const newMarker = {
          coordinate,
          imageUrl: downloadURL,
        };
        setMarkers([...markers, newMarker]);

        Alert.alert(
          "Succes",
          "Billedet blev uploadet, og markøren blev tilføjet!"
        );
      } catch (error) {
        console.error("Fejl ved upload:", error);
        Alert.alert("Fejl", "Kunne ikke uploade billedet.");
      }
    }
  };

  // Hent marker-data fra Firestore ved app start
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "markers"));
        const fetchedMarkers = [];
        querySnapshot.forEach((doc) => {
          fetchedMarkers.push(doc.data());
        });
        setMarkers(fetchedMarkers);
      } catch (error) {
        console.error("Fejl ved hentning af markører:", error);
      }
    };

    fetchMarkers();
  }, []);

  // Funktion til at håndtere markørtryk og åbne modalen
  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} onLongPress={handleLongPress}>
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker.coordinate}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>
      <Button title="Toggle Chat" onPress={() => setShowChat(!showChat)} />
      {showChat && (
        <View style={styles.chatContainer}>
          <Chat />
        </View>
      )}

      {/* Modal til at vise billede */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalView}>
          {selectedMarker && (
            <>
              <Image
                source={{ uri: selectedMarker.imageUrl }}
                style={styles.image}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.textStyle}>Luk</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  modalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  chatContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
});
