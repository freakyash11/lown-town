// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { getAuth } = require("firebase/auth");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUFzsdjtOCpEZyPIrD3_RvmBmA4Xee9OE",
  authDomain: "litamor-8ce39.firebaseapp.com",
  projectId: "litamor-8ce39",
  storageBucket: "litamor-8ce39.firebasestorage.app",
  messagingSenderId: "194822139322",
  appId: "1:194822139322:web:6aa10d71e51f36e4c7c183",
  measurementId: "G-5RXJZCR4DQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { app, db, auth };