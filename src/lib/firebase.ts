import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

export const firebaseConfigDebug = {
  apiKey: "AIzaSyBTqZ2E9HtVJBEw1J0wW6SzE6aheI6vYOY",
  authDomain: "homebrew-dev-c5bf9.firebaseapp.com",
  projectId: "homebrew-dev-c5bf9",
  storageBucket: "homebrew-dev-c5bf9.appspot.com",
  messagingSenderId: "1062158639239",
  appId: "1:1062158639239:web:9f158d7593732c5a425822",
  measurementId: "G-FNPB3Y55P0",
};

const firebaseConfigStaging = {
  apiKey: "AIzaSyD_aCnUd4FPd2vXVE8t70xwX6P-aqNBJOA",
  authDomain: "homebrew-staging.firebaseapp.com",
  projectId: "homebrew-staging",
  storageBucket: "homebrew-staging.appspot.com",
  messagingSenderId: "111095636040",
  appId: "1:111095636040:web:3ae90c903bc00d4859f87d",
  measurementId: "G-WDN9XFD71P",
};

const firebaseConfigRelease = {
  apiKey: "AIzaSyCURzkzsWk_MdSZ60F1cZwAJE3o1yrBFsw",
  authDomain: "homebrew-prod.firebaseapp.com",
  projectId: "homebrew-prod",
  storageBucket: "homebrew-prod.appspot.com",
  messagingSenderId: "200821047765",
  appId: "1:200821047765:web:bb217e67dd1ad56d4b7d5c",
  measurementId: "G-7XWHYZYGHD",
};

let firebaseConfig = {};
console.log(process.env.REACT_APP_ENV);

if (process.env.REACT_APP_ENV === "release") {
  console.log("firebaseConfig Release !!");
  firebaseConfig = firebaseConfigRelease;
} else if (process.env.REACT_APP_ENV === "staging") {
  console.log("firebaseConfig Staging !!");
  firebaseConfig = firebaseConfigStaging;
} else if (process.env.REACT_APP_ENV === "debug") {
  console.log("firebaseConfig Debug !!");
  firebaseConfig = firebaseConfigDebug;
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

const analytics = getAnalytics(app);
