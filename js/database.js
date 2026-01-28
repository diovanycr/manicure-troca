// 1. Importamos as funções necessárias do Firebase SDK Moderno
import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  update, 
  remove, 
  once, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo, 
  get,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

class DatabaseManager {
  constructor() {
    this.db = getDatabase();
    this.userId = null;
    this.initializeUserListener();
  }

  initializeUserListener() {
    onAuthStateChanged(auth, (user) => {
      this.userId = user ? user.uid : null;
    });
  }

  // ===== MANICURES OPERATIONS =====

  async createManicure(data) {
    if (!this.userId) throw new Error('User not authenticated');

    const manicuresRef = ref(this.db, `users/${this.userId}/manicures`);
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
    if (!this.userId) {
      // Pequena espera para garantir que o Auth carregou o userId
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!this.userId) throw new Error('User not authenticated');
    }

    const manicuresRef = ref(this.db, `users/${this.userId}/manicures`);
    const snapshot = await get(manicuresRef);
    
    const manicures = [];
    snapshot.forEach((child) => {
      manicures.push(child.val());
    });
    return manicures;
  }

  async getManicureById(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');
    const manicureRef = ref(this.db, `users/${this.userId}/manicures/${manicureId}`);
    const snapshot = await get(manicureRef);
    return snapshot.val();
  }

  async updateManicure(manicureId, data) {
    if (!this.userId) throw new Error('User not authenticated');
    const manicureRef = ref(this.db, `users/${this.userId}/manicures/${manicureId}`);
    await update(manicureRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  async deleteManicure(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');
    const manicureRef = ref(this.db, `users/${this.userId}/manicures/${manicureId}`);
    await remove(manicureRef);
  }

  async toggleManicureStatus(manicureId) {
    const manicure = await this.getManicureById(manicureId);
    const newStatus = manicure.status === 'active' ? 'inactive' : 'active';
    await this.updateManicure(manicureId, { status: newStatus });
    await this.createStatusHistory(manicureId, manicure.status, newStatus);
    return newStatus;
  }

  // ===== KIT EXCHANGES OPERATIONS =====

  async recordKitExchange(manicureId, notes = '') {
    if (!this.userId) throw new Error('User not authenticated');
    const exchangesRef = ref(this.db, `users/${this.userId}/kitExchanges`);
    const newExchangeRef = push(exchangesRef);
    
    const exchangeData = {
      id: newExchangeRef.key,
      manicureId,
      exchangeDate: serverTimestamp(),
      notes,
      createdAt: serverTimestamp()
    };

    await set(newExchangeRef, exchangeData);
    return exchangeData;
  }

  async getKitExchanges(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');
    const exchangesRef = ref(this.db, `users/${this.userId}/kitExchanges`);
    const q = query(exchangesRef, orderByChild('manicureId'), equalTo(manicureId));
    const snapshot = await get(q);
    
    const exchanges = [];
    snapshot.forEach((child) => {
      exchanges.push(child.val());
    });
    return exchanges.sort((a, b) => b.exchangeDate - a.exchangeDate);
  }

  // ===== STATUS HISTORY =====

  async createStatusHistory(manicureId, previousStatus, newStatus) {
    if (!this.userId) throw new Error('User not authenticated');
    const historyRef = ref(this.db, `users/${this.userId}/statusHistory`);
    const newHistoryRef = push(historyRef);
    
    await set(newHistoryRef, {
      id: newHistoryRef.key,
      manicureId,
      previousStatus,
      newStatus,
      changedAt: serverTimestamp()
    });
  }

  // ===== REAL-TIME LISTENERS =====

  onManicuresChange(callback) {
    if (!this.userId) return;
    const manicuresRef = ref(this.db, `users/${this.userId}/manicures`);
    onValue(manicuresRef, (snapshot) => {
      const manicures = [];
      snapshot.forEach((child) => {
        manicures.push(child.val());
      });
      callback(manicures);
    });
  }

  offManicuresChange() {
    if (!this.userId) return;
    const manicuresRef = ref(this.db, `users/${this.userId}/manicures`);
    off(manicuresRef);
  }
}

// Exportamos a instância para ser usada no Dashboard
export const dbManager = new DatabaseManager();
