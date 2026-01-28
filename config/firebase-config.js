import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEEwNYA30Jb59CcVvhhsqF1B1hCQ410UM",
  authDomain: "parceiro-be3e9.firebaseapp.com",
  databaseURL: "https://parceiro-be3e9-default-rtdb.firebaseio.com",
  projectId: "parceiro-be3e9",
  storageBucket: "parceiro-be3e9.firebasestorage.app",
  messagingSenderId: "619982778395",
  appId: "1:619982778395:web:25c141958b7c06da02c8be"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { app };

// Mantém compatibilidade global se necessário
window.firebaseServices = { db, auth, storage, app };

export default firebaseConfig;
