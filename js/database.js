// Database Manager (SDK Modular v10) - COMPLETO E CORRIGIDO
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
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const dbManager = {
    // Auxiliar para pegar o ID do usuário atual com espera de autenticação
    getUserId: function() {
        return new Promise((resolve, reject) => {
            const user = auth.currentUser;
            if (user) return resolve(user.uid);

            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                if (user) resolve(user.uid);
                else reject(new Error("Usuário não autenticado"));
            });
            // Timeout de 3 segundos
            setTimeout(() => reject(new Error("Tempo limite de autenticação")), 3000);
        });
    },

    // --- REFERÊNCIAS ---
    async getManicuresRef() {
        const uid = await this.getUserId();
        return ref(database, `users/${uid}/manicures`);
    },

    // --- LISTAGEM ---
    async getAllManicures() {
        try {
            const uid = await this.getUserId();
            const dbRef = ref(database, `users/${uid}/manicures`);
            const snapshot = await get(dbRef);
            return snapshot.val();
        } catch (error) {
            console.error("Erro ao listar manicures:", error);
            throw error;
        }
    },

    // Busca uma única manicure
    async getManicureById(manicureId) {
        try {
            const uid = await this.getUserId();
            const itemRef = ref(database, `users/${uid}/manicures/${manicureId}`);
            const snapshot = await get(itemRef);
            return snapshot.exists() ? { id: snapshot.key, ...snapshot.val() } : null;
        } catch (error) {
            console.error('Erro ao buscar manicure:', error);
            throw error;
        }
    },

    // --- CADASTRO E ATUALIZAÇÃO ---
    async createManicure(manicureData) {
        const uid = await this.getUserId();
        const mRef = ref(database, `users/${uid}/manicures`);
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

    // Método alternativo compatível com o seu form atual
    async addManicure(data) {
        return this.createManicure(data);
    },

    async updateManicure(manicureId, updates) {
        const uid = await this.getUserId();
        const itemRef = ref(database, `users/${uid}/manicures/${manicureId}`);
        await update(itemRef, {
            ...updates,
            updatedAt: Date.now()
        });
    },

    // --- TROCAS DE KIT ---
    async addExchange(manicureId, exchangeData) {
        const uid = await this.getUserId();
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

    async getKitExchanges(manicureId) {
        const uid = await this.getUserId();
        const historyRef = ref(database, `users/${uid}/manicures/${manicureId}/exchanges`);
        const snapshot = await get(historyRef);
        const exchanges = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => { 
                exchanges.push({ id: child.key, ...child.val() }); 
            });
        }
        return exchanges;
    },

    // --- UPLOAD DE COMPROVANTE ---
    async uploadReceipt(manicureId, file) {
        const uid = await this.getUserId();
        const storageRef = sRef(storage, `receipts/${uid}/${manicureId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }
};

export { dbManager };
