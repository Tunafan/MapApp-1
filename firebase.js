// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";  // Firestore
import { getStorage } from "firebase/storage";      // Firebase Storage

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCT76SMXpmQU7G2R-tMPSD-sZKc71ek7XE",
    authDomain: "photomapapp-3c561.firebaseapp.com",
    projectId: "photomapapp-3c561",
    storageBucket: "photomapapp-3c561.appspot.com",
    messagingSenderId: "875309153023",
    appId: "1:875309153023:web:69e2e4b3d6fa8727866aca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const firestore = getFirestore(app);  // Firestore initialization
const storage = getStorage(app);      // Storage initialization

export { app, firestore, storage };