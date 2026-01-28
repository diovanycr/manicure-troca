// 1. Importamos as funções necessárias do Firebase SDK
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Importamos a instância da app (Certifique-se que o caminho está correto)
import { app } from './firebase-config.js'; 

class AuthManager {
  constructor() {
    this.auth = getAuth(app);
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
    provider.addScope('profile');
    provider.addScope('email');

    return signInWithPopup(this.auth, provider)
      .then((result) => {
        this.currentUser = result.user;
        this.redirectToDashboard();
      })
      .catch((error) => {
        console.error('Erro ao entrar:', error);
        alert('Erro ao fazer login: ' + error.message);
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

    if (this.currentUser) {
      if (userInfo) {
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
  }

  redirectToDashboard() {
    // Se estiver na pasta pages/, o caminho é '../index.html'
    // Se estiver na raiz, é 'index.html'
    window.location.href = window.location.pathname.includes('pages/') ? '../index.html' : 'index.html';
  }

  redirectToLogin() {
    window.location.href = window.location.pathname.includes('pages/') ? 'login.html' : 'pages/login.html';
  }

  requireAuth() {
    // Verificação via observador para evitar redirecionamento falso antes do Firebase carregar
    onAuthStateChanged(this.auth, (user) => {
      if (!user) {
        this.redirectToLogin();
      }
    });
  }
}

// exportamos a instância para o index.html conseguir importar
export const authManager = new AuthManager();
