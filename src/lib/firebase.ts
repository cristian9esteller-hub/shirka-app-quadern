import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCLy0lOvgFw7GwXeBq8s7z0pSTgyVXHdds",
    authDomain: "shirka-quadern.firebaseapp.com",
    projectId: "shirka-quadern",
    storageBucket: "shirka-quadern.firebasestorage.app",
    messagingSenderId: "890930897860",
    appId: "1:890930897860:web:77a9acfdad8d22c0237a91",
    measurementId: "G-J2XHLJ7Q76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, analytics };
