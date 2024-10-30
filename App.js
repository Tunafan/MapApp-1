import React, { useState, useCallback, useEffect } from "react";
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

import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase Storage functions
import { collection, addDoc, getDocs } from "firebase/firestore"; // Firestore functions
import { firestore, storage } from "./firebase"; // Import Firestore and Storage from firebase.js
import { GiftedChat } from "react-native-gifted-chat";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null); // For displaying the selected marker's image
  const [modalVisible, setModalVisible] = useState(false); // Controls the modal's visibility
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);

  // Initial chat message setup
  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: "Hello from your v good friend.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "Din ven",
          avatar: "https://placeimg.com/140/140/any",
        },
      },
    ]);
  }, []);

  // Send message handler
  const onSend = useCallback((newMessages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );
  }, []);

  // Handle long-press to add a marker and select an image
  const handleLongPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    if (!coordinate || !coordinate.latitude || !coordinate.longitude) {
      console.error("Coordinate is null or undefined", coordinate);
      Alert.alert("Error", "Unable to retrieve GPS location.");
      return;
    }

    // Select an image from Photos
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0]; // Access the image URI

      // Upload the image to Firebase Storage
      try {
        const imageName = `images/${Date.now()}.jpg`;
        const storageRef = ref(storage, imageName);

        // Get the image's blob data
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload the image
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        // Save GPS location and image URL in Firestore
        await addDoc(collection(firestore, "markers"), {
          coordinate,
          imageUrl: downloadURL,
        });

        // Add the marker to state
        const newMarker = {
          coordinate,
          imageUrl: downloadURL,
        };
        setMarkers([...markers, newMarker]);

        Alert.alert("Success", "The image was uploaded and marker added!");
      } catch (error) {
        console.error("Upload error:", error);
        Alert.alert("Error", "Unable to upload the image.");
      }
    }
  };

  // Fetch marker data from Firestore on app start
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
        console.error("Error fetching markers:", error);
      }
    };

    fetchMarkers();
  }, []);

  // Function to handle marker press and open the modal
  const handleMarkerPress = (marker) => {
    setSelectedMarker(marker);
    setModalVisible(true);
  };

  return (
    <SafeAreaProvider>
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

        <View style={styles.buttonContainer}>
          <Button title="Toggle Chat" onPress={() => setShowChat(!showChat)} />
        </View>

        {showChat && (
          <View style={styles.chatContainer}>
            <GiftedChat
              messages={messages}
              showAvatarForEveryMessage={true}
              onSend={(messages) => onSend(messages)}
              user={{
                _id: 1,
                name: "Guest User",
                avatar: "https://placeimg.com/140/140/any",
              }}
            />
          </View>
        )}

        {/* Modal for displaying selected marker's image */}
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
                  <Text style={styles.textStyle}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
    zIndex: 0, // Ensure map is below other components
  },
  buttonContainer: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    zIndex: 1, // Position above the map
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
    zIndex: 2, // Ensure chat appears above the map
  },
});
