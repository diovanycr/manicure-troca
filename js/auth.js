// Authentication Manager (Compat Version)
// Convertido da API Modular v10 para Compat v9

class AuthManager {
  constructor() {
    // Usa o auth global definido em firebase-config.js
    this.auth = auth;
    this.currentUser = null;
    this.initAuth();
  }

  initAuth() {
    // onAuthStateChanged é um método do objeto auth no modo compat
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.updateUI();
    });
  }

  signInWithGoogle() {
    // GoogleAuthProvider é uma classe do firebase.auth() no modo compat
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // FORÇAR SELEÇÃO DE CONTA
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    provider.addScope('profile');
    provider.addScope('email');
    
    // signInWithPopup é um método do objeto auth no modo compat
    return this.auth.signInWithPopup(provider)
      .then((result) => {
        this.currentUser = result.user;
        this.redirectToDashboard();
      })
      .catch((error) => {
        console.error('Erro ao entrar:', error);
        // Não mostramos alerta se o usuário apenas fechou a janela
        if (error.code !== 'auth/popup-closed-by-user' && 
            error.code !== 'auth/cancelled-popup-request') {
          alert('Erro ao fazer login: ' + error.message);
        }
      });
  }

  signOut() {
    return this.auth.signOut()
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
    this.auth.onAuthStateChanged((user) => {
      if (!user) {
        this.redirectToLogin();
      }
    });
  }

  // Métodos adicionais úteis
  signInWithEmail(email, password) {
    return this.auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        this.currentUser = userCredential.user;
        return userCredential.user;
      })
      .catch((error) => {
        console.error('Erro ao fazer login com email:', error);
        throw error;
      });
  }

  signUpWithEmail(email, password) {
    return this.auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        this.currentUser = userCredential.user;
        return userCredential.user;
      })
      .catch((error) => {
        console.error('Erro ao criar conta:', error);
        throw error;
      });
  }

  resetPassword(email) {
    return this.auth.sendPasswordResetEmail(email)
      .catch((error) => {
        console.error('Erro ao enviar email de recuperação:', error);
        throw error;
      });
  }

  updateProfile(displayName, photoURL) {
    const user = this.auth.currentUser;
    if (user) {
      return user.updateProfile({
        displayName: displayName,
        photoURL: photoURL
      }).then(() => {
        this.currentUser = user;
        this.updateUI();
      }).catch((error) => {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
      });
    }
    return Promise.reject(new Error('Nenhum usuário autenticado'));
  }
}

// Cria e exporta a instância única (disponível globalmente)
const authManager = new AuthManager();
