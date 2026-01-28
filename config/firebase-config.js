// Firebase Configuration
// Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDEEwNYA30Jb59CcVvhhsqF1B1hCQ410UM",
  authDomain: "parceiro-be3e9.firebaseapp.com",
  databaseURL: "https://parceiro-be3e9-default-rtdb.firebaseio.com",
  projectId: "parceiro-be3e9",
  storageBucket: "parceiro-be3e9.firebasestorage.app",
  messagingSenderId: "619982778395",
  appId: "1:619982778395:web:25c141958b7c06da02c8be"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// Export for use in other modules
window.firebaseServices = {
  db,
  auth,
  storage
};
