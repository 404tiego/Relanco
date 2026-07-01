const API_BASE = 'https://03fa9b82-b406-4358-a781-aca27a246b51-00-2l3tqh8rqx12t.worf.replit.dev';

document.addEventListener('DOMContentLoaded', async () => {
  const loginView = document.getElementById('login-view');
  const connectedView = document.getElementById('connected-view');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');
  const userNameEl = document.getElementById('user-name');
  const userConcessionEl = document.getElementById('user-concession');
  const counterEl = document.getElementById('counter-value');

  // ── 1. Vérifier le token au chargement ─────────────────────
  const { relanco_token, relanco_user, relanco_counter } = await chrome.storage.local.get([
    'relanco_token', 'relanco_user', 'relanco_counter'
  ]);

  if (relanco_token) {
    showConnected(relanco_user, relanco_counter || 0);
  } else {
    showLogin();
  }

  // ── 2. Connexion ────────────────────────────────────────
  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showError('Veuillez remplir tous les champs');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Connexion...';
    errorEl.classList.add('hidden');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.message || 'Échec de la connexion');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Se connecter';
        return;
      }

      // Stocker token + user
      const user = data.user || {};
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
      const concession = user.user_metadata?.concession || 'Concession automobile';

      await chrome.storage.local.set({
        relanco_token: data.token,
        relanco_refresh: data.refresh_token,
        relanco_user: JSON.stringify({ name: userName, concession }),
        relanco_counter: 0,
      });

      showConnected(JSON.stringify({ name: userName, concession }), 0);

    } catch (err) {
      showError('Erreur réseau. Réessayez.');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Se connecter';
    }
  });

  // ── 3. Déconnexion ────────────────────────────────────────
  logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove([
      'relanco_token', 'relanco_refresh', 'relanco_user', 'relanco_counter'
    ]);
    emailInput.value = '';
    passwordInput.value = '';
    showLogin();
  });

  // ── Helpers ────────────────────────────────────────────
  function showLogin() {
    loginView.classList.remove('hidden');
    connectedView.classList.add('hidden');
  }

  function showConnected(userJson, count) {
    loginView.classList.add('hidden');
    connectedView.classList.remove('hidden');

    let user = {};
    try { user = JSON.parse(userJson); } catch (e) {}

    userNameEl.textContent = user.name ? `Bonjour ${user.name}` : 'Bonjour';
    userConcessionEl.textContent = user.concession || 'Concession automobile';
    counterEl.textContent = count;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }
});
