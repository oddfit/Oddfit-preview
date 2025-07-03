import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCnunf_kT-rRqgYJyRUKzPKT1O1AgwCXRo",
    authDomain: "oddfit-2cce7.firebaseapp.com",
    projectId: "oddfit-2cce7",
    storageBucket: "oddfit-2cce7.firebasestorage.app",
    messagingSenderId: "769787842608",
    appId: "1:769787842608:web:7395782b9a0ca0b9d51df5"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "admin.html";
  } catch (err) {
    document.getElementById("errorMsg").innerText = err.message;
  }
});
