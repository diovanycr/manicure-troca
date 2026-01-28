// Authentication Module
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initAuth();
  }

  initAuth() {
    // Listen for auth state changes
    firebase.auth().onAuthStateChanged((user) => {
      this.currentUser = user;
      this.updateUI();
    });
  }

  // Sign in with OAuth (Google)
  signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    firebase.auth().signInWithPopup(provider)
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

  // Sign out
  signOut() {
    firebase.auth().signOut()
      .then(() => {
        console.log('User signed out');
        this.currentUser = null;
        this.redirectToLogin();
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Update UI based on auth state
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

  // Redirect to dashboard
  redirectToDashboard() {
    window.location.href = 'index.html';
  }

  // Redirect to login
  redirectToLogin() {
    window.location.href = 'pages/login.html';
  }

  // Require authentication
  requireAuth() {
    if (!this.isAuthenticated()) {
      this.redirectToLogin();
    }
  }
}

// Initialize auth manager
const authManager = new AuthManager();
