# 🔥 Firebase Setup Guide — Math Magic for Kids

Follow these steps to enable real Google login and account creation.

---

## Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter a project name (e.g. `math-magic-kids`)
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

---

## Step 2 — Register Your Web App

1. In the Firebase console, click the **`</>`** (Web) icon
2. Enter an app nickname (e.g. `math-app`)
3. Click **"Register app"**
4. You'll see a `firebaseConfig` object — **copy it**

It looks like this:
```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "math-magic-kids.firebaseapp.com",
  projectId:         "math-magic-kids",
  storageBucket:     "math-magic-kids.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};
```

---

## Step 3 — Paste Config Into app.js

Open `app.js` and replace the placeholder `firebaseConfig` near the top of the file:

```js
// 🔧 YOUR FIREBASE CONFIG — paste your values here
const firebaseConfig = {
  apiKey:            "PASTE_YOUR_API_KEY",        // ← replace
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN",    // ← replace
  projectId:         "PASTE_YOUR_PROJECT_ID",     // ← replace
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET", // ← replace
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID", // ← replace
  appId:             "PASTE_YOUR_APP_ID",         // ← replace
};
```

---

## Step 4 — Enable Authentication Methods

1. In the Firebase console sidebar, go to **Build → Authentication**
2. Click **"Get started"**
3. Under **Sign-in method** tab, enable:
   - ✅ **Email/Password** — click, toggle on, Save
   - ✅ **Google** — click, toggle on, enter support email, Save

---

## Step 5 — Add Authorized Domain

> **IMPORTANT for Google Sign-In popup to work!**

Firebase only allows popups from authorized domains.

**For local testing (`file://`):**

1. Go to **Authentication → Settings → Authorized domains**
2. Click **"Add domain"**
3. Add: `localhost`

> ⚠️ Note: Google Sign-In popup does **not** work when opening `index.html` directly as a `file://` URL. You must run a local server. See Step 6.

---

## Step 6 — Run a Local Server

Open your terminal in the project folder and run:

```sh
# Option A — Python (built-in on macOS)
python3 -m http.server 8080

# Option B — Node.js
npx -y serve .
```

Then open: **http://localhost:8080** in your browser.

---

## ✅ You're Done!

- Email/Password sign-up and login will work
- Google Sign-In popup will work
- Signed-in users see their name and photo on the home screen
- Sign out button returns to the login screen
