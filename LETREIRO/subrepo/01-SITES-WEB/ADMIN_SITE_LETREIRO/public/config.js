import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDHLRbC_nF8VH1c9ASphLEX1e-fZVY14aI",
  authDomain: "letreirodigital-88f8e.firebaseapp.com",
  databaseURL: "https://letreirodigital-88f8e-default-rtdb.firebaseio.com",
  projectId: "letreirodigital-88f8e",
  storageBucket: "letreirodigital-88f8e.firebasestorage.app",
  messagingSenderId: "566621041979",
  appId: "1:566621041979:web:ddeb6b3c53596ad474b31e",
  measurementId: "G-TBLEE2GEK7"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);