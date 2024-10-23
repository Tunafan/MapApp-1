// App.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Image, Modal, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function App() {
  const [markers, setMarkers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Hent alle markers fra Firestore ved komponentens mounting
  useEffect(() => {
    fetchMarkers();
  }, []);

  const fetchMarkers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "markers"));
      const fetchedMarkers = [];
      querySnapshot.forEach((doc) => {
        fetchedMarkers.push({ id: doc.id, ...doc.data() });
      });
      setMarkers(fetchedMarkers);
    } catch (error) {
      console.error("Fejl ved hentning af markerss: ", error);
    }

  };

  const handleLongPress = async (event) => {
    const { coordinate } = event.nativeEvent;

    // Bed om tilladelse til at få adgang til billeder
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Tilladelse krævet", "Du skal give tilladelse til at vælge billeder.");
      return;
    }

    // Åbn billedvælgeren
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!pickerResult.cancelled) {
      // Upload billede til Firebase Storage
      const response = await fetch(pickerResult.uri);
      const blob = await response.blob();
      const filename = pickerResult.uri.substring(pickerResult.uri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `images/${filename}`);

      try {
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        // Gem marker i Firestore
        const docRef = await addDoc(collection(db, "markers"), {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          imageURL: downloadURL,
        });

        // Opdater markers state
        setMarkers([...markers, { id: docRef.id, latitude: coordinate.latitude, longitude: coordinate.longitude, imageURL: downloadURL }]);
      } catch (error) {
        console.error("Fejl ved upload: ", error);
      }
    }
  };

  const handleMarkerPress = (marker) => {
    setSelectedImage(marker.imageURL);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        onLongPress={handleLongPress}
        initialRegion={{
          latitude: 55.6761, // For eksempel København
          longitude: 12.5683,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>

      {/* Modal til at vise billedet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalView}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.image} />
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(!modalVisible)}
          >
            <Text style={styles.textStyle}>Luk</Text>
          </TouchableOpacity>
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
    width: '100%',
    height: '100%',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    top: '20%',
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: "#2196F3",
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
});
