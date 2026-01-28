import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  update, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo, 
  get,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// IMPORTANTE: Caminho absoluto para evitar erro 404 em qualquer página
import { auth } from 'https://diovanycr.github.io/manicure-troca/config/firebase-config.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

class DatabaseManager {
  constructor() {
    this.db = getDatabase();
    this.userId = null;
    this.authInitialized = false;
    this.initializeUserListener();
  }

  initializeUserListener() {
    onAuthStateChanged(auth, (user) => {
      this.userId = user ? user.uid : null;
      this.authInitialized = true;
      console.log("Sistema de Autenticação:", this.userId ? "Usuário Identificado" : "Aguardando Login");
    });
  }

  // Função que segura a execução até o Firebase confirmar quem é o usuário
  async _waitForUser() {
    if (this.userId) return this.userId;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.userId) reject(new Error('Falha na autenticação: Tempo esgotado.'));
      }, 5000);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          this.userId = user.uid;
          clearTimeout(timeout);
          resolve(user.uid);
          unsubscribe();
        }
      });
    });
  }

  // ===== OPERAÇÕES DE MANICURE =====

  async createManicure(data) {
    try {
      const uid = await this._waitForUser();
      const manicuresRef = ref(this.db, `users/${uid}/manicures`);
      const newManicureRef = push(manicuresRef);
      
      const manicureData = {
        id: newManicureRef.key,
        ...data,
        createdAt: serverTimestamp(),
        status: 'active'
      };

      await set(newManicureRef, manicureData);
      return manicureData;
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
      throw error;
    }
  }

  async getAllManicures() {
    try {
      const uid = await this._waitForUser();
      const manicuresRef = ref(this.db, `users/${uid}/manicures`);
      const snapshot = await get(manicuresRef);
      
      const manicures = [];
      snapshot.forEach((child) => {
        manicures.push(child.val());
      });
      return manicures;
    } catch (error) {
      console.error("Erro ao buscar manicures:", error);
      return [];
    }
  }

  async getManicureById(manicureId) {
    const uid = await this._waitForUser();
    const manicureRef = ref(this.db, `users/${uid}/manicures/${manicureId}`);
    const snapshot = await get(manicureRef);
    return snapshot.val();
  }

  async updateManicure(manicureId, data) {
    const uid = await this._waitForUser();
    const manicureRef = ref(this.db, `users/${uid}/manicures/${manicureId}`);
    await update(manicureRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  async deleteManicure(manicureId) {
    const uid = await this._waitForUser();
    const manicureRef = ref(this.db, `users/${uid}/manicures/${manicureId}`);
    await remove(manicureRef);
  }

  // ===== ESCUTA EM TEMPO REAL =====

  onManicuresChange(callback) {
    this._waitForUser().then(uid => {
      const manicuresRef = ref(this.db, `users/${uid}/manicures`);
      onValue(manicuresRef, (snapshot) => {
        const manicures = [];
        snapshot.forEach((child) => {
          manicures.push(child.val());
        });
        callback(manicures);
      });
    }).catch(err => console.error("Erro no listener:", err));
  }
}

export const dbManager = new DatabaseManager();
