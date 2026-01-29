// Database Manager (SDK Modular v10)
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
  // Auxiliar para pegar o ID do usuário atual de forma segura
  getUserId: function() {
    return auth.currentUser ? auth.currentUser.uid : null;
  },

  // --- REFERÊNCIAS ---
  getManicuresRef: function() {
    const uid = this.getUserId();
    return uid ? ref(database, `users/${uid}/manicures`) : null;
  },

  // --- OPERAÇÕES DE MANICURE ---

  // Busca uma manicure específica por ID (Necessário para a página de detalhes)
  getManicureById: async function(manicureId) {
    try {
      const uid = this.getUserId();
      if (!uid) throw new Error('Usuário não autenticado');
      
      const itemRef = ref(database, `users/${uid}/manicures/${manicureId}`);
      const snapshot = await get(itemRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.key, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar manicure:', error);
      throw error;
    }
  },

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

  // --- HISTÓRICO DE TROCAS ---

  // Registra uma nova troca e calcula a próxima data automaticamente
  addExchange: async function(manicureId, exchangeData) {
    try {
      const uid = this.getUserId();
      const manicure = await this.getManicureById(manicureId);
      
      // 1. Salvar no histórico de trocas
      const historyRef = ref(database, `users/${uid}/manicures/${manicureId}/exchanges`);
      const newExchangeRef = push(historyRef);
      const timestamp = Date.now();

      await set(newExchangeRef, {
        id: newExchangeRef.key,
        date: timestamp,
        notes: exchangeData.notes || ""
      });

      // 2. Calcular próxima troca baseado no plano (ex: 15 ou 30 dias)
      const planDays = parseInt(manicure.planType) || 15;
      const nextExchange = timestamp + (planDays * 24 * 60 * 60 * 1000);

      // 3. Atualizar a manicure com as novas datas
      await this.updateManicure(manicureId, {
        lastExchangeDate: timestamp,
        nextExchangeDate: nextExchange
      });

    } catch (error) {
      console.error('Erro ao registrar troca:', error);
      throw error;
    }
  },

  // Busca o histórico de trocas
  getKitExchanges: async function(manicureId) {
    const uid = this.getUserId();
    const historyRef = ref(database, `users/${uid}/manicures/${manicureId}/exchanges`);
    const snapshot = await get(historyRef);
    const exchanges = [];
    if (snapshot.exists()) {
      snapshot.forEach(child => { exchanges.push(child.val()); });
    }
    return exchanges;
  },

  // --- UPLOAD DE COMPROVANTES (FIREBASE STORAGE) ---
  uploadReceipt: async function(manicureId, file) {
    try {
      const uid = this.getUserId();
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = sRef(storage, `users/${uid}/receipts/${manicureId}/${fileName}`);
      
      const uploadResult = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      
      // Opcional: Salva a referência da URL no banco da manicure
      const receiptsRef = ref(database, `users/${uid}/manicures/${manicureId}/receipts`);
      await push(receiptsRef, {
        url: downloadUrl,
        date: Date.now(),
        fileName: file.name
      });
      
      return downloadUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  }
};

export { dbManager };
