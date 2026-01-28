// 1. Importamos as funções específicas que precisamos
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Importamos a instância da app que configuraste no firebase-config.js
import { app } from './firebase-config.js'; 

class AuthManager {
  constructor() {
    // 2. Inicializamos o serviço de Auth passando a app
    this.auth = getAuth(app);
    this.currentUser = null;
    this.initAuth();
  }

  initAuth() {
    // 3. Em vez de firebase.auth().onAuthStateChanged, usamos a função direta
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.updateUI();
    });
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    // 4. Usamos o signInWithPopup passando a instância do auth
    signInWithPopup(this.auth, provider)
      .then((result) => {
        console.log('User signed in:', result.user);
        this.currentUser = result.user;
        this.redirectToDashboard();
      })
      .catch((error) => {
        console.error('Error signing in:', error);
        alert('Erro ao fazer login: ' + error.message);
      });
  }

  signOut() {
    signOut(this.auth)
      .then(() => {
        console.log('User signed out');
        this.currentUser = null;
        this.redirectToLogin();
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  updateUI() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');

    if (this.isAuthenticated()) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (userInfo) {
        userInfo.innerHTML = `
          <span>${this.currentUser.displayName || this.currentUser.email}</span>
          <img src="${this.currentUser.photoURL || 'assets/default-avatar.png'}" alt="Avatar" class="avatar">
        `;
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userInfo) userInfo.innerHTML = '';
    }
  }

  redirectToDashboard() {
    window.location.href = 'index.html';
  }

  redirectToLogin() {
    window.location.href = 'pages/login.html';
  }

  requireAuth() {
    if (!this.isAuthenticated()) {
      this.redirectToLogin();
    }
  }
}

// 5. IMPORTANTE: Criamos a instância e tornamos global para o HTML conseguir ver
window.authManager = new AuthManager();
