<script type="module">
  // Firebase CDN imports
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
  import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

  // 🔧 Fill in YOUR apiKey below (leave everything else as-is)
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "thexchange-3a729.firebaseapp.com",
    projectId: "thexchange-3a729",
    storageBucket: "thexchange-3a729.appspot.com",
    messagingSenderId: "259444885265",
    appId: "1:259444885265:web:ac70a32db004e3a7da6eb0"
  };

  // Initialize
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export const storage = getStorage(app);

  // Expose to other scripts if needed
  window._thex = { app, auth, db, storage };
</script>




