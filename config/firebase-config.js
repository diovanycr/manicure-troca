// Firebase Configuration (Compat Version)
// Configuração do Firebase - Sistema de Gestão de Manicures

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
const app = firebase.initializeApp(firebaseConfig);

// Create references (available globally)
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Also make available via window for compatibility
window.firebaseServices = { 
  db: database, 
  auth: auth, 
  storage: storage, 
  app: app 
};
