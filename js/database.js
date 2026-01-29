import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  update, 
  remove, 
  onValue, 
  get,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Ajustado para caminho relativo: sai da pasta 'js' e entra na 'config'
import { auth } from '../config/firebase-config.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

class DatabaseManager {
  constructor() {
    this.db = getDatabase();
    this.userId = null;
  }

  /**
   * Garante que temos o ID do usuário antes de qualquer operação.
   */
  async _waitForUser() {
    if (this.userId) return this.userId;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Tempo esgotado ao tentar identificar usuário."));
      }, 5000);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        if (user) {
          this.userId = user.uid;
          resolve(user.uid);
        } else {
          reject(new Error("Usuário não autenticado."));
        }
        unsubscribe();
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
        status: data.status || 'active'
      };

      await set(newManicureRef, manicureData);
      return manicureData;
    } catch (error) {
      console.error("Erro ao criar:", error);
      throw error;
    }
  }

  async getAllManicures() {
    try {
      const uid = await this._waitForUser();
      const manicuresRef = ref(this.db, `users/${uid}/manicures`);
      const snapshot = await get(manicuresRef);
      
      const manicures = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          manicures.push(child.val());
        });
      }
      return manicures;
    } catch (error) {
      console.error("Erro ao buscar todas:", error);
      return [];
    }
  }

  // NOVA FUNÇÃO: Busca apenas uma manicure pelo ID (Uso na manicure-details.html)
  async getManicureById(manicureId) {
    try {
      const uid = await this._waitForUser();
      const manicureRef = ref(this.db, `users/${uid}/manicures/${manicureId}`);
      const snapshot = await get(manicureRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
      throw error;
    }
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
