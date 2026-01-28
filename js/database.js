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

// Usando o caminho absoluto para evitar erro 404 no GitHub Pages
import { auth } from 'https://diovanycr.github.io/manicure-troca/config/firebase-config.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

class DatabaseManager {
  constructor() {
    this.db = getDatabase();
    this.userId = null;
  }

  /**
   * Garante que temos o ID do usuário antes de qualquer operação.
   * Se o Firebase ainda não respondeu, ela espera até 5 segundos.
   */
  async _waitForUser() {
    if (this.userId) return this.userId;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Tempo esgotado ao tentar identificar usuário. Você está logado?"));
      }, 5000);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        if (user) {
          this.userId = user.uid;
          resolve(user.uid);
        } else {
          reject(new Error("Usuário não autenticado. Por favor, faça login novamente."));
          // Opcional: Redirecionar para login caso não haja usuário
          // window.location.href = '../pages/login.html';
        }
        unsubscribe();
      });
    });
  }

  // ===== OPERAÇÕES DE MANICURE =====

  async createManicure(data) {
    try {
      // 1. Espera o login ser confirmado
      const uid = await this._waitForUser();
      console.log("Usuário confirmado:", uid);

      // 2. Cria a referência no banco
      const manicuresRef = ref(this.db, `users/${uid}/manicures`);
      const newManicureRef = push(manicuresRef);
      
      const manicureData = {
        id: newManicureRef.key,
        ...data,
        createdAt: serverTimestamp(),
        status: data.status || 'active'
      };

      // 3. Salva os dados
      await set(newManicureRef, manicureData);
      console.log("Sucesso ao gravar no Firebase!");
      return manicureData;

    } catch (error) {
      console.error("Erro na função createManicure:", error.message);
      throw error; // Repassa o erro para o formulário tratar (mostrar alerta)
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
      console.error("Erro ao buscar manicures:", error);
      return [];
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

  // ===== LISTENER EM TEMPO REAL =====
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
