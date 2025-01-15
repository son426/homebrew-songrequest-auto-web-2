// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTZ0fw2tj0-CE8iaScxX7VaAyRwLF-sVs",
  authDomain: "homebrew-prod.firebaseapp.com",
  projectId: "homebrew-prod",
  storageBucket: "homebrew-prod.appspot.com",
  messagingSenderId: "200821047765",
  appId: "1:200821047765:web:fd02a03c58ad41984b7d5c",
  measurementId: "G-6B6V1447Z7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);