// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

import { getFirestore } from 'firebase/firestore';

import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';


// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: "AIzaSyBsKT7MwBao3gOnp8DeWXhMsSB19vFyhHs",

  authDomain: "project3movieapp.firebaseapp.com",

  projectId: "project3movieapp",

  storageBucket: "project3movieapp.firebasestorage.app",

  messagingSenderId: "496968865503",

  appId: "1:496968865503:web:3f5598b9402941b2d23b6a",

  measurementId: "G-L7B2280KZV"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);

// Firestore database instance
export const db = getFirestore(app);
 
// Auth with AsyncStorage persistence (keeps users logged in)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
