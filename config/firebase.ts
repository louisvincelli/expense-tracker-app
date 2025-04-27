// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {initializeAuth, getReactNativePersistence} from 'firebase/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZepysoYF_7-IJBqg2HnjJjXMGwlJlgxU",
  authDomain: "expense-tracker-de517.firebaseapp.com",
  projectId: "expense-tracker-de517",
  storageBucket: "expense-tracker-de517.firebasestorage.app",
  messagingSenderId: "166180547183",
  appId: "1:166180547183:web:e0e64f34ec164925097b9a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//auth
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

//db
export const firestore = getFirestore(app);