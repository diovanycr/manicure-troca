// Database Manager (Compat Version)

const dbManager = {
  // Get reference to user's data
  getUserRef: function(userId) {
    return database.ref(`users/${userId || auth.currentUser.uid}`);
  },

  // Get reference to manicures
  getManicuresRef: function() {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) return null;
    return database.ref(`users/${userId}/manicures`);
  },

  // Create a new manicure
  createManicure: async function(manicureData) {
    try {
      const ref = this.getManicuresRef();
      if (!ref) throw new Error('User not authenticated');

      const newManicureRef = ref.push();
      const manicure = {
        ...manicureData,
        id: newManicureRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await newManicureRef.set(manicure);
      return manicure;
    } catch (error) {
      console.error('Error creating manicure:', error);
      throw error;
    }
  },

  // Get all manicures
  getAllManicures: async function() {
    try {
      const ref = this.getManicuresRef();
      if (!ref) return [];

      const snapshot = await ref.once('value');
      const manicures = [];
      
      snapshot.forEach((childSnapshot) => {
        manicures.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      return manicures;
    } catch (error) {
      console.error('Error getting manicures:', error);
      throw error;
    }
  },

  // Get manicure by ID
  getManicureById: async function(manicureId) {
    try {
      const ref = this.getManicuresRef();
      if (!ref) return null;

      const snapshot = await ref.child(manicureId).once('value');
      if (!snapshot.exists()) return null;

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error getting manicure:', error);
      throw error;
    }
  },

  // Update manicure
  updateManicure: async function(manicureId, updates) {
    try {
      const ref = this.getManicuresRef();
      if (!ref) throw new Error('User not authenticated');

      await ref.child(manicureId).update({
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
      const ref = this.getManicuresRef();
      if (!ref) throw new Error('User not authenticated');

      await ref.child(manicureId).remove();
    } catch (error) {
      console.error('Error deleting manicure:', error);
      throw error;
    }
  },

  // Toggle manicure status
  toggleManicureStatus: async function(manicureId) {
    try {
      const manicure = await this.getManicureById(manicureId);
      if (!manicure) throw new Error('Manicure not found');

      const newStatus = manicure.status === 'active' ? 'inactive' : 'active';
      await this.updateManicure(manicureId, { status: newStatus });
      
      return newStatus;
    } catch (error) {
      console.error('Error toggling status:', error);
      throw error;
    }
  },

  // Record kit exchange
  recordKitExchange: async function(manicureId, notes = '') {
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      if (!userId) throw new Error('User not authenticated');

      const exchangeRef = database.ref(`users/${userId}/manicures/${manicureId}/exchanges`).push();
      const exchange = {
        id: exchangeRef.key,
        exchangeDate: Date.now(),
        notes: notes,
        createdAt: Date.now()
      };

      await exchangeRef.set(exchange);
      return exchange;
    } catch (error) {
      console.error('Error recording exchange:', error);
      throw error;
    }
  },

  // Get kit exchanges for a manicure
  getKitExchanges: async function(manicureId) {
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      if (!userId) return [];

      const snapshot = await database.ref(`users/${userId}/manicures/${manicureId}/exchanges`)
        .orderByChild('exchangeDate')
        .once('value');
      
      const exchanges = [];
      snapshot.forEach((childSnapshot) => {
        exchanges.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Reverse to show newest first
      return exchanges.reverse();
    } catch (error) {
      console.error('Error getting exchanges:', error);
      throw error;
    }
  },

  // Upload payment receipt
  uploadPaymentReceipt: async function(manicureId, file) {
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      if (!userId) throw new Error('User not authenticated');

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `receipt_${manicureId}_${timestamp}_${file.name}`;
      const storageRef = storage.ref(`users/${userId}/receipts/${fileName}`);

      // Upload file
      const uploadTask = await storageRef.put(file);
      const downloadURL = await uploadTask.ref.getDownloadURL();

      // Save receipt info to database
      const receiptRef = database.ref(`users/${userId}/manicures/${manicureId}/receipts`).push();
      const receipt = {
        id: receiptRef.key,
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: Date.now()
      };

      await receiptRef.set(receipt);
      return receipt;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    }
  },

  // Get payment receipts for a manicure
  getPaymentReceipts: async function(manicureId) {
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      if (!userId) return [];

      const snapshot = await database.ref(`users/${userId}/manicures/${manicureId}/receipts`)
        .orderByChild('uploadedAt')
        .once('value');
      
      const receipts = [];
      snapshot.forEach((childSnapshot) => {
        receipts.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Reverse to show newest first
      return receipts.reverse();
    } catch (error) {
      console.error('Error getting receipts:', error);
      throw error;
    }
  },

  // Listen to manicures changes (real-time)
  listenToManicures: function(callback) {
    const ref = this.getManicuresRef();
    if (!ref) return null;

    return ref.on('value', (snapshot) => {
      const manicures = [];
      snapshot.forEach((childSnapshot) => {
        manicures.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(manicures);
    });
  },

  // Stop listening to manicures changes
  stopListeningToManicures: function() {
    const ref = this.getManicuresRef();
    if (ref) ref.off();
  }
};
