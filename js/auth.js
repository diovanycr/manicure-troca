// 1. Importamos as funções necessárias do Firebase SDK
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// CORREÇÃO: Importando o auth configurado
import { auth as firebaseAuth } from 'https://diovanycr.github.io/manicure-troca/config/firebase-config.js'; 

class AuthManager {
  constructor() {
    this.auth = firebaseAuth;
    this.currentUser = null;
    this.initAuth();
  }

  initAuth() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.updateUI();
    });
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    
    // --- NOVIDADE AQUI: FORÇAR SELEÇÃO DE CONTA ---
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    // ----------------------------------------------

    provider.addScope('profile');
    provider.addScope('email');

    return signInWithPopup(this.auth, provider)
      .then((result) => {
        this.currentUser = result.user;
        this.redirectToDashboard();
      })
      .catch((error) => {
        console.error('Erro ao entrar:', error);
        // Não mostramos alerta se o usuário apenas fechou a janela (cancelled-popup-request)
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
      })
      .catch((error) => {
        console.error('Erro ao sair:', error);
      });
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  updateUI() {
    const userInfo = document.getElementById('user-info');
    if (this.currentUser && userInfo) {
      userInfo.innerHTML = `
        <div class="user-profile">
          <img src="${this.currentUser.photoURL || 'https://via.placeholder.com/40'}" alt="Avatar" class="avatar">
          <div class="user-info">
            <p class="name">${this.currentUser.displayName || 'Usuário'}</p>
            <p class="email">${this.currentUser.email}</p>
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

  requireAuth() {
    onAuthStateChanged(this.auth, (user) => {
      if (!user) {
        this.redirectToLogin();
      }
    });
  }
}

// Exportamos a instância única
export const authManager = new AuthManager();
