
emailjs.init("YOUR_PUBLIC_KEY");

function openPopup() {
  document.getElementById("popup").style.display = "flex";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("statusMessage").textContent = "";
}

function sendEmail() {
  const email = document.getElementById("userEmail").value;
  const status = document.getElementById("statusMessage");

  if (!email || !email.includes("@")) {
    status.textContent = "Please enter a valid email.";
    return;
  }

  emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
    user_email: email
  }).then(() => {
    status.textContent = "We will contact you soon.";
    document.querySelector("button[onclick='openPopup()']").disabled = true;
    document.querySelector("button[onclick='openPopup()']").textContent = "Thank you!";
    setTimeout(closePopup, 2000);
  }, (error) => {
    status.textContent = "Something went wrong. Try again.";
    console.error(error);
  });
}
