// Database Module - Firebase Realtime Database
class DatabaseManager {
  constructor() {
    this.db = firebase.database();
    this.userId = null;
    this.initializeUserListener();
  }

  // Initialize user listener
  initializeUserListener() {
    firebase.auth().onAuthStateChanged((user) => {
      this.userId = user ? user.uid : null;
    });
  }

  // ===== MANICURES OPERATIONS =====

  // Create new manicure
  async createManicure(data) {
    if (!this.userId) throw new Error('User not authenticated');

    const manicureId = this.db.ref(`users/${this.userId}/manicures`).push().key;
    const manicureData = {
      id: manicureId,
      ...data,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      status: 'active'
    };

    await this.db.ref(`users/${this.userId}/manicures/${manicureId}`).set(manicureData);
    return manicureData;
  }

  // Get all manicures
  async getAllManicures() {
    if (!this.userId) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      this.db.ref(`users/${this.userId}/manicures`).once('value', (snapshot) => {
        const manicures = [];
        snapshot.forEach((child) => {
          manicures.push(child.val());
        });
        resolve(manicures);
      }, reject);
    });
  }

  // Get manicure by ID
  async getManicureById(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      this.db.ref(`users/${this.userId}/manicures/${manicureId}`).once('value', (snapshot) => {
        resolve(snapshot.val());
      }, reject);
    });
  }

  // Update manicure
  async updateManicure(manicureId, data) {
    if (!this.userId) throw new Error('User not authenticated');

    await this.db.ref(`users/${this.userId}/manicures/${manicureId}`).update({
      ...data,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }

  // Delete manicure
  async deleteManicure(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');

    await this.db.ref(`users/${this.userId}/manicures/${manicureId}`).remove();
  }

  // Toggle manicure status
  async toggleManicureStatus(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');

    const manicure = await this.getManicureById(manicureId);
    const newStatus = manicure.status === 'active' ? 'inactive' : 'active';

    await this.updateManicure(manicureId, { status: newStatus });

    // Record status change
    await this.createStatusHistory(manicureId, manicure.status, newStatus);

    return newStatus;
  }

  // ===== KIT EXCHANGES OPERATIONS =====

  // Record kit exchange
  async recordKitExchange(manicureId, notes = '') {
    if (!this.userId) throw new Error('User not authenticated');

    const exchangeId = this.db.ref(`users/${this.userId}/kitExchanges`).push().key;
    const exchangeData = {
      id: exchangeId,
      manicureId,
      exchangeDate: firebase.database.ServerValue.TIMESTAMP,
      notes,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    await this.db.ref(`users/${this.userId}/kitExchanges/${exchangeId}`).set(exchangeData);
    return exchangeData;
  }

  // Get kit exchanges for manicure
  async getKitExchanges(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      this.db.ref(`users/${this.userId}/kitExchanges`)
        .orderByChild('manicureId')
        .equalTo(manicureId)
        .once('value', (snapshot) => {
          const exchanges = [];
          snapshot.forEach((child) => {
            exchanges.push(child.val());
          });
          resolve(exchanges.sort((a, b) => b.exchangeDate - a.exchangeDate));
        }, reject);
    });
  }

  // Get last kit exchange
  async getLastKitExchange(manicureId) {
    const exchanges = await this.getKitExchanges(manicureId);
    return exchanges.length > 0 ? exchanges[0] : null;
  }

  // ===== PAYMENT RECEIPTS OPERATIONS =====

  // Upload payment receipt
  async uploadPaymentReceipt(manicureId, file) {
    if (!this.userId) throw new Error('User not authenticated');

    const receiptId = this.db.ref(`users/${this.userId}/paymentReceipts`).push().key;
    const storageRef = firebase.storage().ref(`users/${this.userId}/receipts/${receiptId}`);

    // Upload file to storage
    const snapshot = await storageRef.put(file);
    const fileUrl = await snapshot.ref.getDownloadURL();

    // Save receipt metadata to database
    const receiptData = {
      id: receiptId,
      manicureId,
      fileKey: receiptId,
      fileUrl,
      fileName: file.name,
      mimeType: file.type,
      uploadedAt: firebase.database.ServerValue.TIMESTAMP
    };

    await this.db.ref(`users/${this.userId}/paymentReceipts/${receiptId}`).set(receiptData);
    return receiptData;
  }

  // Get payment receipts for manicure
  async getPaymentReceipts(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      this.db.ref(`users/${this.userId}/paymentReceipts`)
        .orderByChild('manicureId')
        .equalTo(manicureId)
        .once('value', (snapshot) => {
          const receipts = [];
          snapshot.forEach((child) => {
            receipts.push(child.val());
          });
          resolve(receipts.sort((a, b) => b.uploadedAt - a.uploadedAt));
        }, reject);
    });
  }

  // ===== STATUS HISTORY OPERATIONS =====

  // Create status history record
  async createStatusHistory(manicureId, previousStatus, newStatus) {
    if (!this.userId) throw new Error('User not authenticated');

    const historyId = this.db.ref(`users/${this.userId}/statusHistory`).push().key;
    const historyData = {
      id: historyId,
      manicureId,
      previousStatus,
      newStatus,
      changedAt: firebase.database.ServerValue.TIMESTAMP
    };

    await this.db.ref(`users/${this.userId}/statusHistory/${historyId}`).set(historyData);
    return historyData;
  }

  // Get status history for manicure
  async getStatusHistory(manicureId) {
    if (!this.userId) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      this.db.ref(`users/${this.userId}/statusHistory`)
        .orderByChild('manicureId')
        .equalTo(manicureId)
        .once('value', (snapshot) => {
          const history = [];
          snapshot.forEach((child) => {
            history.push(child.val());
          });
          resolve(history.sort((a, b) => b.changedAt - a.changedAt));
        }, reject);
    });
  }

  // ===== REAL-TIME LISTENERS =====

  // Listen for manicures changes
  onManicuresChange(callback) {
    if (!this.userId) throw new Error('User not authenticated');

    this.db.ref(`users/${this.userId}/manicures`).on('value', (snapshot) => {
      const manicures = [];
      snapshot.forEach((child) => {
        manicures.push(child.val());
      });
      callback(manicures);
    });
  }

  // Stop listening for manicures changes
  offManicuresChange() {
    if (!this.userId) return;
    this.db.ref(`users/${this.userId}/manicures`).off('value');
  }
}

// Initialize database manager
const dbManager = new DatabaseManager();
