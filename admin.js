import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// Firebase config
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
// 🚫 Redirect if not logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

const db = getFirestore(app);
const storage = getStorage(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("You must be logged in to access this page.");
    window.location.href = "login.html";
  } else {
    loadSiteConfig();
  }
});

async function loadSiteConfig() {
  const docRef = doc(db, "branding_config", "logo_banner");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.logo_mobile) {
      document.getElementById("logoPreview").src = data.logo_url;
    }
    if (data.primary_color) {
      document.getElementById("colorInput").value = data.primary_color;
    }
    if (data.font_family) {
      document.getElementById("fontInput").value = data.font_family;
    }
  }
}

window.updateSiteConfig = async () => {
  const logoFile = document.getElementById("logoInput").files[0];
  const color = document.getElementById("colorInput").value;
  const font = document.getElementById("fontInput").value;

  let logoURL = null;
  if (logoFile) {
    const logoRef = ref(storage, `assets/logo/${logoFile.name}`);
    await uploadBytes(logoRef, logoFile);
    logoURL = await getDownloadURL(logoRef);
  }

  const updateData = {
    ...(logoURL && { logo_url: logoURL }),
    primary_color: color,
    font_family: font,
  };

  await setDoc(doc(db, "site_config", "main"), updateData, { merge: true });
  alert("Configuration updated.");
};

window.uploadBannerImage = async () => {
  const file = document.getElementById("bannerInput").files[0];
  const device = document.getElementById("deviceType").value;
  if (!file) return alert("Please select a banner image");

  const storageRef = ref(storage, `assets/banner/banner_${device}.png`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  document.getElementById("bannerPreview").src = url;

  await setDoc(doc(db, "site_config", "main"), {
    [`banner_${device}_url`]: url,
  }, { merge: true });

  alert("Banner uploaded.");
};

window.logout = async () => {
  await signOut(auth);
  window.location.href = "login.html";
};
