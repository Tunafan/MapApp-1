// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA4pKXqLViJq0O4wl9Fd1Nji0vRYY_7PBo",
    authDomain: "mapapp-e3517.firebaseapp.com",
    projectId: "mapapp-e3517",
    storageBucket: "mapapp-e3517.appspot.com",
    messagingSenderId: "619415035851",
    appId: "1:619415035851:web:230e354dd1b048676fe04e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, db, storage };