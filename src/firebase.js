// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYEWBH0wbEWhy8TH6eGSg6jSWHiBguI-c",
  authDomain: "year-over-year.firebaseapp.com",
  projectId: "year-over-year",
  storageBucket: "year-over-year.appspot.com",
  messagingSenderId: "728302736351",
  appId: "1:728302736351:web:69331f20165ad1c5172a6a",
  measurementId: "G-PYNKZW7ZRE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default db;