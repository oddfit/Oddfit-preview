// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Elements
const productDropdown = document.getElementById("productDropdown");
const nameInput = document.getElementById("productName");
const categoryInput = document.getElementById("category");
const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");
const priceInput = document.getElementById("price");
const availableInput = document.getElementById("available");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const addBtn = document.getElementById("addProductBtn");
const saveBtn = document.getElementById("saveProductBtn");

// Auth check
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadProducts();
  }
});

function logout() {
  signOut(auth).then(() => window.location.href = "login.html");
}
window.logout = logout;

// Load products for dropdown
async function loadProducts() {
  productDropdown.innerHTML = "<option value=''>-- Select Product --</option>";
  const snapshot = await getDocs(collection(db, "products"));
  snapshot.forEach(docSnap => {
    const p = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = p.product_name;
    productDropdown.appendChild(option);
  });
}
window.loadProducts = loadProducts;

// Add product
addBtn.addEventListener("click", async () => {
  const imageFiles = imageInput.files;
  const imageUrls = [];

  for (const file of imageFiles) {
    const imageRef = ref(storage, `assets/images/products/${file.name}`);
    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);
    imageUrls.push(url);
  }

  const sizes = Array.from(sizeInput.selectedOptions).map(opt => opt.value);

  await addDoc(collection(db, "products"), {
    product_name: nameInput.value,
    category: categoryInput.value,
    color: colorInput.value,
    size: sizes,
    price: parseFloat(priceInput.value),
    image_url: imageUrls,
    available: availableInput.checked
  });

  alert("Product added!");
  loadProducts();
  clearForm();
});

productDropdown.addEventListener("change", async () => {
  const id = productDropdown.value;
  if (!id) return clearForm();

  await loadProductDetails(id);
});

// Save updates to product
saveBtn.addEventListener("click", async () => {
  const id = productDropdown.value;
  if (!id) return alert("Select a product to edit");

  const imageFiles = imageInput.files;
  let imageUrls = [];

  if (imageFiles.length > 0) {
    for (const file of imageFiles) {
      const imageRef = ref(storage, `assets/images/products/${file.name}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      imageUrls.push(url);
    }
  }

  const sizes = Array.from(sizeInput.selectedOptions).map(opt => opt.value);

  const update = {
    product_name: nameInput.value,
    category: categoryInput.value,
    color: colorInput.value,
    size: sizes,
    price: parseFloat(priceInput.value),
    available: availableInput.checked
  };

  if (imageUrls.length > 0) update.image_url = imageUrls;

  await updateDoc(doc(db, "products", id), update);
  alert("Product updated!");
  loadProducts();
  clearForm();
});

function clearForm() {
  nameInput.value = "";
  categoryInput.value = "";
  colorInput.value = "";
  priceInput.value = "";
  sizeInput.selectedIndex = -1;
  imageInput.value = "";
  availableInput.checked = false;
  imagePreview.innerHTML = "";
  productDropdown.value = "";
}

async function loadProductDetails(productId) {
  if (!productId) {
    clearForm();
    return;
  }

  const productDoc = doc(db, "products", productId);
  const docSnap = await getDoc(productDoc);
  if (docSnap.exists()) {
    const data = docSnap.data();
    nameInput.value = data.product_name || "";
    categoryInput.value = data.category || "";
    colorInput.value = data.color || "";
    priceInput.value = data.price || "";
    availableInput.checked = data.available || false;

    // Set selected sizes
    Array.from(sizeInput.options).forEach(opt => {
      opt.selected = data.size?.includes(opt.value);
    });

    // Preview image URLs
    imagePreview.innerHTML = (data.image_url || [])
      .map(url => `<img src="${url}" alt="product" style="width:80px;height:auto;margin:5px;" />`)
      .join("");
  } else {
    alert("Product not found.");
  }
}
