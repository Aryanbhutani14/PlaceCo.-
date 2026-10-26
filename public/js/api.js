/**
 * PlaceCo - Client-Side API & Authentication Manager
 * Handles JWT storage, RBAC page guards, and request wrappers.
 */

const PlaceCoAuth = {
  TOKEN_KEY: 'placeco_auth_token',
  USER_KEY: 'placeco_auth_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken() && this.getUser());
  },

  logout() {
    this.setToken(null);
    this.setUser(null);
    window.location.href = '/login.html?message=logged_out';
  },

  /**
   * Role-Based Access Guard for Frontend Pages
   * @param {string|string[]} allowedRoles
   */
  guardPage(allowedRoles) {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
      window.location.href = '/login.html?error=unauthorized';
      return false;
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(user.role)) {
      alert(`Access Denied! Your role (${user.role.toUpperCase()}) is not authorized to access this page.\nRedirecting to your assigned dashboard.`);
      
      if (user.role === 'student') {
        window.location.href = '/student/dashboard.html';
      } else if (user.role === 'recruiter') {
        window.location.href = '/recruiter/dashboard.html';
      } else if (user.role === 'admin') {
        window.location.href = '/admin/dashboard.html';
      } else {
        window.location.href = '/login.html';
      }
      return false;
    }

    return true;
  },

  /**
   * Unified Fetch Wrapper with JWT header
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({
        success: false,
        message: 'Non-JSON server response received.'
      }));

      if (response.status === 401 && !url.includes('/api/auth/login')) {
        // Expired or invalid token
        this.setToken(null);
        this.setUser(null);
        window.location.href = '/login.html?error=session_expired';
        return;
      }

      return {
        ok: response.ok,
        status: response.status,
        ...data
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        success: false,
        message: err.message || 'Network connection failed.'
      };
    }
  },

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="font-size: 1.25rem;">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
      <div style="flex: 1; font-size: 0.9rem;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

window.PlaceCoAuth = PlaceCoAuth;
