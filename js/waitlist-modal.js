import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPSMdZxweymU7BIl-9c6X1NzSebNO5JFs",
  authDomain: "jarofmarbles.firebaseapp.com",
  projectId: "jarofmarbles",
  storageBucket: "jarofmarbles.firebasestorage.app",
  messagingSenderId: "858134422737",
  appId: "1:858134422737:web:b1ac683a1265d188cb91f0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildModal() {
  const overlay = document.createElement("div");
  overlay.className = "waitlist-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="waitlist-modal" role="dialog" aria-modal="true" aria-labelledby="waitlist-title">
      <button type="button" class="waitlist-close" aria-label="Close">&times;</button>
      <div class="waitlist-body">
        <div class="eyebrow">Coming soon</div>
        <h2 id="waitlist-title">Jar of Marbles is in internal testing</h2>
        <p>We're not on the public App Store yet. Want to stay in the loop, or get first access when we launch?</p>
        <form class="waitlist-form" novalidate>
          <label class="waitlist-label" for="waitlist-email">Email address</label>
          <input
            id="waitlist-email"
            class="waitlist-input"
            type="email"
            name="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
          <input class="waitlist-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <button type="submit" class="button waitlist-submit">Notify me</button>
          <p class="waitlist-status" role="status" aria-live="polite"></p>
        </form>
        <button type="button" class="waitlist-dismiss">No thanks, just browsing</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function initWaitlistModal() {
  const triggers = document.querySelectorAll(".js-waitlist");
  if (!triggers.length) return;

  const overlay = buildModal();
  const form = overlay.querySelector(".waitlist-form");
  const emailInput = overlay.querySelector("#waitlist-email");
  const honeypot = overlay.querySelector(".waitlist-hp");
  const status = overlay.querySelector(".waitlist-status");
  const submitButton = overlay.querySelector(".waitlist-submit");
  let lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    status.textContent = "";
    status.classList.remove("is-error", "is-success");
    form.hidden = false;
    submitButton.disabled = false;
    overlay.querySelector(".waitlist-dismiss").hidden = false;
    emailInput.value = "";
    emailInput.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });
  overlay.querySelector(".waitlist-close").addEventListener("click", closeModal);
  overlay.querySelector(".waitlist-dismiss").addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();

    if (honeypot.value) {
      status.textContent = "Thanks! We'll be in touch.";
      status.classList.add("is-success");
      form.hidden = true;
      overlay.querySelector(".waitlist-dismiss").hidden = true;
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      status.textContent = "Please enter a valid email address.";
      status.classList.add("is-error");
      emailInput.focus();
      return;
    }

    const normalizedEmail = email.toLowerCase();

    submitButton.disabled = true;
    status.textContent = "Submitting...";
    status.classList.remove("is-error", "is-success");

    try {
      await setDoc(doc(db, "waitlist", normalizedEmail), {
        email: normalizedEmail,
        createdAt: serverTimestamp(),
        page: window.location.pathname,
      });
      status.textContent = "Thanks! We'll email you when Jar of Marbles launches.";
      status.classList.add("is-success");
      form.hidden = true;
      overlay.querySelector(".waitlist-dismiss").hidden = true;
    } catch (error) {
      console.error("Waitlist signup failed:", error.code, error.message);
      status.textContent =
        error.code === "permission-denied"
          ? "We couldn't add that email. If you've signed up before, you're already on the list. Otherwise, please try again later."
          : "Something went wrong. Please try again in a moment.";
      status.classList.add("is-error");
      submitButton.disabled = false;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWaitlistModal);
} else {
  initWaitlistModal();
}
