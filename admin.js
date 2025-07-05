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
let existingImageUrls = [];
let newImageFiles = [];

onAuthStateChanged(auth, user => {
  if (!user) location.href = "login.html";
  else init();
});

window.logout = () => signOut(auth).then(() => location.href = "login.html");

async function init() {
  await loadCategories();
  await loadDropdown();
  renderSizes();
}

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

  await loadCategories(data.category || "");

  Array.from(sizeCheckboxes.querySelectorAll("input")).forEach(cb => {
    cb.checked = (data.size || []).includes(cb.value);
  });

  existingImageUrls = Array.isArray(data.image_url) ? data.image_url : [data.image_url];
  newImageFiles = [];

  renderImagePreview();
  toggleForm(false);
  mode = "view";
}

function renderImagePreview() {
  imagePreview.innerHTML = "";

  existingImageUrls.forEach((url, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "image-box";
    wrapper.innerHTML = `<img src="${url}" /><button class="remove-btn" data-index="${index}">×</button>`;
    imagePreview.appendChild(wrapper);
  });

  newImageFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = e => {
      const wrapper = document.createElement("div");
      wrapper.className = "image-box";
      wrapper.innerHTML = `<img src="${e.target.result}" /><button class="remove-btn new" data-index="${index}">×</button>`;
      imagePreview.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });
}

imagePreview.addEventListener("click", e => {
  if (e.target.classList.contains("remove-btn")) {
    const index = parseInt(e.target.dataset.index);
    if (e.target.classList.contains("new")) {
      newImageFiles.splice(index, 1);
    } else {
      existingImageUrls.splice(index, 1);
    }
    renderImagePreview();
  }
});

imageInput.addEventListener("change", () => {
  newImageFiles = Array.from(imageInput.files);
  renderImagePreview();
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  const formData = getFormData();
  const imageUrls = [...existingImageUrls];

  for (const file of newImageFiles) {
    const refPath = `assets/images/products/${Date.now()}_${file.name}`;
    const imgRef = ref(storage, refPath);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);
    imageUrls.push(url);
  }

  formData.image_url = imageUrls;

  if (mode === "edit" && currentProductId) {
    await updateDoc(doc(db, "products", currentProductId), formData);
    alert("Product updated.");
  } else {
    await addDoc(collection(db, "products"), formData);
    alert("Product added.");
  }

  form.reset();
  imageInput.value = "";
  existingImageUrls = [];
  newImageFiles = [];
  renderImagePreview();
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
  imageInput.value = "";
  existingImageUrls = [];
  newImageFiles = [];
  Array.from(sizeCheckboxes.querySelectorAll("input")).forEach(cb => cb.checked = false);
  renderImagePreview();
  toggleForm(true);
});

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
