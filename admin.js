import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, getDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCnunf_kT-rRqgYJyRUKzPKT1O1AgwCXRo",
  authDomain: "oddfit-2cce7.firebaseapp.com",
  projectId: "oddfit-2cce7",
  storageBucket: "oddfit-2cce7.appspot.com",
  messagingSenderId: "769787842608",
  appId: "1:769787842608:web:7395782b9a0ca0b9d51df5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// UI Elements
const dropdown = document.getElementById("productDropdown");
const form = document.getElementById("productForm");
const nameInput = document.getElementById("productName");
const categoryInput = document.getElementById("productCategory");
const colorInput = document.getElementById("productColor");
const priceInput = document.getElementById("productPrice");
const availableInput = document.getElementById("productAvailable");
const imageInput = document.getElementById("productImages");
const imagePreview = document.getElementById("imagePreviewContainer");
const sizeCheckboxes = document.getElementById("sizeCheckboxes");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const newBtn = document.getElementById("newProductBtn");

let currentProductId = null;
let mode = "view";

onAuthStateChanged(auth, user => {
  if (!user) location.href = "login.html";
  else init();
});

window.logout = () => signOut(auth).then(() => location.href = "login.html");

async function init() {
  await loadCategories();   // Load category options first
  await loadDropdown();     // Load product list
  renderSizes();            // Load size checkboxes
}

// Load product list into dropdown
async function loadDropdown() {
  dropdown.innerHTML = '<option value="">-- Select Product --</option>';
  const snap = await getDocs(collection(db, "products"));
  snap.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().product_name;
    dropdown.appendChild(opt);
  });
}

// Load category options (only once, reused)
async function loadCategories(selected = null) {
  categoryInput.innerHTML = "";
  const snap = await getDocs(collection(db, "categories"));
  snap.forEach(doc => {
    const name = doc.data().name;
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    categoryInput.appendChild(opt);
  });
  if (selected) categoryInput.value = selected;
}

function renderSizes() {
  const sizes = ["XS", "XS+", "S", "S+", "M", "M+", "L", "L+", "XL", "XL+", "XXL", "XXL+"];
  sizes.forEach(size => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = size;
    checkbox.disabled = true;
    label.appendChild(checkbox);
    label.append(" ", size);
    sizeCheckboxes.appendChild(label);
  });
}

function toggleForm(editable) {
  [nameInput, categoryInput, colorInput, priceInput, imageInput, availableInput]
    .forEach(input => input.disabled = !editable);
  Array.from(sizeCheckboxes.querySelectorAll("input")).forEach(cb => cb.disabled = !editable);
  saveBtn.style.display = editable ? "inline-block" : "none";
  editBtn.style.display = editable ? "none" : "inline-block";
}

async function loadProductDetails(id) {
  if (!id) return;
  const docRef = doc(db, "products", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const data = snap.data();
  currentProductId = id;

  nameInput.value = data.product_name || "";
  colorInput.value = data.color || "";
  priceInput.value = data.price || "";
  availableInput.value = data.available ? "true" : "false";

  // Load categories again to ensure selected option exists
  await loadCategories(data.category || "");

  // Load selected sizes
  Array.from(sizeCheckboxes.querySelectorAll("input")).forEach(cb => {
    cb.checked = (data.size || []).includes(cb.value);
  });

  // Load images
  imagePreview.innerHTML = Array.isArray(data.image_url)
    ? data.image_url.map(url => `<img src="${url}" width="80" />`).join("")
    : `<img src="${data.image_url}" width="80" />`;

  toggleForm(false);
  mode = "view";
}

// Form submission (add or update)
form.addEventListener("submit", async e => {
  e.preventDefault();
  const formData = getFormData();

  const imageFiles = imageInput.files;
  const imageUrls = [];

  for (const file of imageFiles) {
    const refPath = `assets/images/products/${Date.now()}_${file.name}`;
    const imgRef = ref(storage, refPath);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);
    imageUrls.push(url);
  }

  if (imageUrls.length > 0) formData.image_url = imageUrls;

  if (mode === "edit" && currentProductId) {
    await updateDoc(doc(db, "products", currentProductId), formData);
    alert("Product updated.");
  } else {
    await addDoc(collection(db, "products"), formData);
    alert("Product added.");
  }

  form.reset();
  imagePreview.innerHTML = "";
  await loadDropdown();
  toggleForm(false);
});

dropdown.addEventListener("change", e => loadProductDetails(e.target.value));

editBtn?.addEventListener("click", () => {
  toggleForm(true);
  mode = "edit";
});

newBtn?.addEventListener("click", () => {
  currentProductId = null;
  mode = "add";
  form.reset();
  imagePreview.innerHTML = "";
  Array.from(sizeCheckboxes.querySelectorAll("input")).forEach(cb => cb.checked = false);
  toggleForm(true);
});

// Collect form data
function getFormData() {
  const sizes = Array.from(sizeCheckboxes.querySelectorAll("input:checked"))
    .map(cb => cb.value);

  return {
    product_name: nameInput.value,
    category: categoryInput.value,
    color: colorInput.value,
    size: sizes,
    price: parseFloat(priceInput.value),
    available: availableInput.value === "true"
  };
}
