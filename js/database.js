// Database Manager (Corrigido para SDK Modular v10)
import { auth, database, storage } from '../config/firebase-config.js';
import { 
    ref, 
    push, 
    set, 
    get, 
    update, 
    remove, 
    query, 
    orderByChild, 
    onValue, 
    off 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const dbManager = {
  // Get reference to user's data
  getUserRef: function(userId) {
    const id = userId || (auth.currentUser ? auth.currentUser.uid : null);
    if (!id) return null;
    return ref(database, `users/${id}`);
  },

  // Get reference to manicures
  getManicuresRef: function() {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) return null;
    return ref(database, `users/${userId}/manicures`);
  },

  // Create a new manicure
  createManicure: async function(manicureData) {
    try {
      const manicuresRef = this.getManicuresRef();
      if (!manicuresRef) throw new Error('User not authenticated');

      const newManicureRef = push(manicuresRef);
      const manicure = {
        ...manicureData,
        id: newManicureRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await set(newManicureRef, manicure);
      return manicure;
    } catch (error) {
      console.error('Error creating manicure:', error);
      throw error;
    }
  },

  // Get all manicures
  getAllManicures: async function() {
    try {
      const manicuresRef = this.getManicuresRef();
      if (!manicuresRef) return [];

      const snapshot = await get(manicuresRef);
      const manicures = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          manicures.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
      }

      return manicures;
    } catch (error) {
      console.error('Error getting manicures:', error);
      throw error;
    }
  },

  // Update manicure
  updateManicure: async function(manicureId, updates) {
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      if (!userId) throw new Error('User not authenticated');
      
      const itemRef = ref(database, `users/${userId}/manicures/${manicureId}`);
      await update(itemRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating manicure:', error);
      throw error;
    }
  },

  // Delete manicure
  deleteManicure: async function(manicureId) {
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      const itemRef = ref(database, `users/${userId}/manicures/${manicureId}`);
      await remove(itemRef);
    } catch (error) {
      console.error('Error deleting manicure:', error);
      throw error;
    }
  },

  // Listen to manicures changes (real-time)
  listenToManicures: function(callback) {
    const manicuresRef = this.getManicuresRef();
    if (!manicuresRef) return null;

    return onValue(manicuresRef, (snapshot) => {
      const manicures = [];
      snapshot.forEach((childSnapshot) => {
        manicures.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(manicures);
    });
  }
};

export { dbManager };
