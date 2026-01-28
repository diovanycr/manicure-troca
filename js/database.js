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

// CORREÇÃO AQUI: Saindo da pasta 'js' e entrando na pasta 'config'
import { auth } from '../config/firebase-config.js'; 
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
    });
  }

  async _waitForUser() {
    if (this.userId) return this.userId;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.userId) reject(new Error('Tempo de autenticação esgotado. Verifique sua conexão.'));
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

  async createManicure(data) {
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
  }

  async getAllManicures() {
    const uid = await this._waitForUser();
    const manicuresRef = ref(this.db, `users/${uid}/manicures`);
    const snapshot = await get(manicuresRef);
    
    const manicures = [];
    snapshot.forEach((child) => {
      manicures.push(child.val());
    });
    return manicures;
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

  async toggleManicureStatus(manicureId) {
    const manicure = await this.getManicureById(manicureId);
    const newStatus = manicure.status === 'active' ? 'inactive' : 'active';
    await this.updateManicure(manicureId, { status: newStatus });
    return newStatus;
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
    });
  }
}

export const dbManager = new DatabaseManager();
