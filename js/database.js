import { 
  getDatabase, ref, push, set, update, remove, onValue, get, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { auth } from 'https://diovanycr.github.io/manicure-troca/config/firebase-config.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

class DatabaseManager {
  constructor() {
    this.db = getDatabase();
    this.userId = null;
  }

  // Essa função garante que o código ESPERE o Firebase responder quem é o usuário
  async _getUserId() {
    if (this.userId) return this.userId;

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          this.userId = user.uid;
          resolve(user.uid);
        } else {
          // Se não houver usuário, redireciona para o login
          window.location.href = 'https://diovanycr.github.io/manicure-troca/pages/login.html';
        }
        unsubscribe();
      });
    });
  }

  async createManicure(data) {
    try {
      const uid = await this._getUserId(); // Espera o ID do usuário
      const manicuresRef = ref(this.db, `users/${uid}/manicures`);
      const newManicureRef = push(manicuresRef);
      
      const manicureData = {
        id: newManicureRef.key,
        ...data,
        createdAt: serverTimestamp()
      };

      await set(newManicureRef, manicureData);
      console.log("Gravado com sucesso no Firebase!");
      return true;
    } catch (error) {
      console.error("Erro detalhado no Firebase:", error);
      throw error;
    }
  }

  async getAllManicures() {
    const uid = await this._getUserId();
    const manicuresRef = ref(this.db, `users/${uid}/manicures`);
    const snapshot = await get(manicuresRef);
    const manicures = [];
    snapshot.forEach((child) => {
      manicures.push(child.val());
    });
    return manicures;
  }
}

export const dbManager = new DatabaseManager();
