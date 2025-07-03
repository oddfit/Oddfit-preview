// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCnunf_kT-rRqgYJyRUKzPKT1O1AgwCXRo",
    authDomain: "oddfit-2cce7.firebaseapp.com",
    projectId: "oddfit-2cce7",
    storageBucket: "oddfit-2cce7.firebasestorage.app",
    messagingSenderId: "769787842608",
    appId: "1:769787842608:web:7395782b9a0ca0b9d51df5"
  };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      loadSettings();
      document.getElementById("login-section").style.display = "none";
      document.getElementById("admin-panel").style.display = "block";
    })
    .catch(err => {
      document.getElementById("login-error").innerText = err.message;
    });
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("admin-panel").style.display = "none";
  });
}

function loadSettings() {
  db.collection("site_settings").doc("banners").get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById("banner_mobile").value = data.mobile || "";
      document.getElementById("banner_tablet").value = data.tablet || "";
      document.getElementById("banner_desktop").value = data.desktop || "";
    }
  });

  db.collection("site_settings").doc("logo").get().then(doc => {
    if (doc.exists) {
      document.getElementById("logo_url").value = doc.data().url || "";
    }
  });
}

function saveSettings() {
  const mobile = document.getElementById("banner_mobile").value;
  const tablet = document.getElementById("banner_tablet").value;
  const desktop = document.getElementById("banner_desktop").value;
  const logo = document.getElementById("logo_url").value;

  db.collection("site_settings").doc("banners").set({
    mobile,
    tablet,
    desktop
  });

  db.collection("site_settings").doc("logo").set({
    url: logo
  });

  document.getElementById("save-msg").innerText = "Settings saved!";
}
