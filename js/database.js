// Database Manager (SDK Modular v10) - COMPLETO
import { auth, database, storage } from '../config/firebase-config.js';
import { 
    ref, 
    push, 
    set, 
    get, 
    update, 
    remove, 
    onValue 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
    ref as sRef, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const dbManager = {
  // Auxiliar para pegar o ID do usuário atual
  getUserId: function() {
    return auth.currentUser ? auth.currentUser.uid : null;
  },

  // --- REFERÊNCIAS ---
  getManicuresRef: function() {
    const uid = this.getUserId();
    return uid ? ref(database, `users/${uid}/manicures`) : null;
  },

  // --- LISTAGEM (O que estava faltando) ---

  // Dentro do seu dbManager em js/database.js

async function getAllManicures() {
  // Aguarda até 3 segundos para garantir que o Firebase reconheça o usuário
  await new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) resolve(user);
      else reject(new Error("Usuário não autenticado"));
    });
    setTimeout(() => reject(new Error("Tempo limite de autenticação excedido")), 3000);
  });

  const user = auth.currentUser;
  const dbRef = ref(db, `users/${user.uid}/manicures`);
  const snapshot = await get(dbRef);
  return snapshot.val();
}

  // Busca uma única manicure (Usado no manicure-details.html)
  getManicureById: async function(manicureId) {
    try {
      const uid = this.getUserId();
      if (!uid) throw new Error('Usuário não autenticado');
      
      const itemRef = ref(database, `users/${uid}/manicures/${manicureId}`);
      const snapshot = await get(itemRef);
      
      return snapshot.exists() ? { id: snapshot.key, ...snapshot.val() } : null;
    } catch (error) {
      console.error('Erro ao buscar manicure:', error);
      throw error;
    }
  },

  // --- CADASTRO E ATUALIZAÇÃO ---

  createManicure: async function(manicureData) {
    const mRef = this.getManicuresRef();
    if (!mRef) throw new Error('Usuário não autenticado');

    const newRef = push(mRef);
    const data = {
      ...manicureData,
      id: newRef.key,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await set(newRef, data);
    return data;
  },

  updateManicure: async function(manicureId, updates) {
    const uid = this.getUserId();
    const itemRef = ref(database, `users/${uid}/manicures/${manicureId}`);
    await update(itemRef, {
      ...updates,
      updatedAt: Date.now()
    });
  },

  // --- TROCAS DE KIT ---

  addExchange: async function(manicureId, exchangeData) {
    const uid = this.getUserId();
    const manicure = await this.getManicureById(manicureId);
    
    const historyRef = ref(database, `users/${uid}/manicures/${manicureId}/exchanges`);
    const newExchangeRef = push(historyRef);
    const timestamp = Date.now();

    await set(newExchangeRef, {
      id: newExchangeRef.key,
      date: timestamp,
      notes: exchangeData.notes || ""
    });

    const planDays = parseInt(manicure.planType) || 15;
    const nextExchange = timestamp + (planDays * 24 * 60 * 60 * 1000);

    await this.updateManicure(manicureId, {
      lastExchangeDate: timestamp,
      nextExchangeDate: nextExchange
    });
  },

  getKitExchanges: async function(manicureId) {
    const uid = this.getUserId();
    const historyRef = ref(database, `users/${uid}/manicures/${manicureId}/exchanges`);
    const snapshot = await get(historyRef);
    const exchanges = [];
    if (snapshot.exists()) {
      snapshot.forEach(child => { exchanges.push(child.val()); });
    }
    return exchanges;
  }
};

export { dbManager };
