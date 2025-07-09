// firebase-init.js
const firebaseConfig = {
  apiKey: "AIzaSyA-xxxxxxxxxxxxxxxxxxxx",            // ← Thay bằng API key của bạn
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
  measurementId: "G-ABCDEFGH"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
