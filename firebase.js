// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔧 FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyA08bgep35PiHcNQrn-tIkVbUxVL3VA3nE",
  authDomain: "operacao-lua-mel-jhon-reh.firebaseapp.com",
  projectId: "operacao-lua-mel-jhon-reh",
  storageBucket: "operacao-lua-mel-jhon-reh.firebasestorage.app",
  messagingSenderId: "739425528500",
  appId: "1:739425528500:web:7214536c2715d63b7945e1",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };
