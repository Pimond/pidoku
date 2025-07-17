// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAASnZ6ZMT9yzSa4nxf0awJbBpvcEXuy50",
  authDomain: "pidoku-5ed9c.firebaseapp.com",
  projectId: "pidoku-5ed9c",
  storageBucket: "pidoku-5ed9c.firebasestorage.app",
  messagingSenderId: "356007589143",
  appId: "1:356007589143:web:40692d9e4b3c1be8987352",
  measurementId: "G-68DZYZLFZ2"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
