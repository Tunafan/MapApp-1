import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage funktioner
import { collection, addDoc, getDocs } from 'firebase/firestore'; // Firestore funktioner
import { firestore, storage } from './firebase';  // Importer Firestore og Storage fra firebase.js

export default function App() {
  const [markers, setMarkers] = useState([]);

  // Håndter long-press for at tilføje en markør og vælge et billede
  const handleLongPress = async (event) => {
    event.persist(); // Bevar event-objektet
    const coordinate = event.nativeEvent.coordinate; // Hent GPS-lokationen

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
        await addDoc(collection(firestore, 'markers'), {
          coordinate,
          imageUrl: downloadURL,
        });

        // Tilføj markøren til state
        const newMarker = {
          coordinate,
          imageUrl: downloadURL,
        };
        setMarkers([...markers, newMarker]);

        Alert.alert('Succes', 'Billedet blev uploadet, og markøren blev tilføjet!');
      } catch (error) {
        console.error('Fejl ved upload:', error);
        Alert.alert('Fejl', 'Kunne ikke uploade billedet.');
      }
    }
  };

  // Hent marker-data fra Firestore ved app start
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'markers'));
        const fetchedMarkers = [];
        querySnapshot.forEach((doc) => {
          fetchedMarkers.push(doc.data());
        });
        setMarkers(fetchedMarkers);
      } catch (error) {
        console.error('Fejl ved hentning af markører:', error);
      }
    };

    fetchMarkers();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        onLongPress={handleLongPress}
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker.coordinate}
            onPress={() => Alert.alert('Billede', marker.imageUrl)} // Midlertidig handling ved tryk
          />
        ))}
      </MapView>
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
});
