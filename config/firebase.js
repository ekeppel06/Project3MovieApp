import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence, signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,

  authDomain: "project3movieapp.firebaseapp.com",

  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,

  storageBucket: "project3movieapp.firebasestorage.app",

  messagingSenderId: "496968865503",

  appId: "1:496968865503:web:3f5598b9402941b2d23b6a",

  measurementId: "G-L7B2280KZV"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

// Firestore database instance
export const db = getFirestore(app);
 
// Auth with AsyncStorage persistence (keeps users logged in)
// Depends on platform (works differently on web than iOS)
const getAuth = () => {
  if (Platform.OS === 'web') {
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  }
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default;
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
};

export const auth = getAuth();

export async function ensureAuth() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        const result = await signInAnonymously(auth);
        resolve(result.user);
      }
    });
  });
}
