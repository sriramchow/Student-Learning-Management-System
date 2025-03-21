// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCo4aAPoOIg20r-jPq4nEXQZJpUBOhWmxg",
    authDomain: "questor-lms.firebaseapp.com",
    projectId: "questor-lms",
    storageBucket: "questor-lms.firebasestorage.app",
    messagingSenderId: "278123531382",
    appId: "1:278123531382:web:4fc4c8954895d7ea306357",
    measurementId: "G-5SM972WP3K"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };
export default app;