// 1. IMPORTAÇÃO: Agora buscamos as funções do Firebase e a instância 'auth' do seu config
import { 
    onAuthStateChanged, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { auth } from '../config/firebase-config.js';

class AuthManager {
  constructor() {
    this.auth = auth;
    this.currentUser = null;
    this.initAuth();
  }

  initAuth() {
    // No SDK Modular, usamos a função onAuthStateChanged(auth, callback)
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.updateUI();
    });
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    return signInWithPopup(this.auth, provider)
      .then((result) => {
        this.currentUser = result.user;
        this.redirectToDashboard();
      })
      .catch((error) => {
        if (error.code !== 'auth/popup-closed-by-user') {
          alert('Erro ao fazer login: ' + error.message);
        }
      });
  }

  signOut() {
    return signOut(this.auth)
      .then(() => {
        this.currentUser = null;
        this.redirectToLogin();
      });
  }

  requireAuth() {
    onAuthStateChanged(this.auth, (user) => {
      if (!user) {
        this.redirectToLogin();
      }
    });
  }

  updateUI() {
    const userInfo = document.getElementById('user-info');
    if (this.currentUser && userInfo) {
      userInfo.innerHTML = `
        <div class="user-profile" style="display: flex; align-items: center; gap: 10px;">
          <img src="${this.currentUser.photoURL || 'https://via.placeholder.com/40'}" alt="Avatar" style="width:32px; height:32px; border-radius:50%;">
          <div style="line-height: 1.2;">
            <p style="font-weight:600; font-size: 0.8rem; margin:0;">${this.currentUser.displayName || 'Usuário'}</p>
            <p style="font-size: 0.7rem; color: #666; margin:0;">${this.currentUser.email}</p>
          </div>
        </div>
      `;
    }
  }

  redirectToDashboard() {
    window.location.href = 'https://diovanycr.github.io/manicure-troca/index.html';
  }

  redirectToLogin() {
    window.location.href = 'https://diovanycr.github.io/manicure-troca/pages/login.html';
  }

  // Outros métodos adaptados para o modo Modular
  signInWithEmail(email, password) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signUpWithEmail(email, password) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }
}

// 2. EXPORTAÇÃO: A linha vital para o seu HTML encontrar o authManager
export const authManager = new AuthManager();
