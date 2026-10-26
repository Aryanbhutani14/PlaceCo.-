/**
 * PlaceCo - Authentication Controller (Login & Registration UI)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated, offer redirect
  if (PlaceCoAuth.isAuthenticated()) {
    const user = PlaceCoAuth.getUser();
    const existingBanner = document.getElementById('auth-alert');
    if (existingBanner && user) {
      existingBanner.className = 'alert alert-info';
      existingBanner.innerHTML = `
        <span>You are currently signed in as <strong>${user.name}</strong> (${user.role.toUpperCase()}).</span>
        <a href="/${user.role}/dashboard.html" style="font-weight: 700; text-decoration: underline; margin-left: 0.5rem;">Go to Dashboard →</a>
      `;
      existingBanner.style.display = 'flex';
    }
  }

  // Handle URL queries
  const urlParams = new URLSearchParams(window.location.search);
  const authAlert = document.getElementById('auth-alert');

  if (urlParams.get('message') === 'logged_out' && authAlert) {
    authAlert.className = 'alert alert-success';
    authAlert.textContent = 'You have been successfully signed out of PlaceCo.';
    authAlert.style.display = 'flex';
  } else if (urlParams.get('error') === 'session_expired' && authAlert) {
    authAlert.className = 'alert alert-danger';
    authAlert.textContent = 'Your session has expired. Please sign in again.';
    authAlert.style.display = 'flex';
  } else if (urlParams.get('error') === 'unauthorized' && authAlert) {
    authAlert.className = 'alert alert-danger';
    authAlert.textContent = 'Authentication required. Please sign in to access that page.';
    authAlert.style.display = 'flex';
  }

  // Tab switching (Login vs Register)
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginFormWrap = document.getElementById('login-form-wrap');
  const registerFormWrap = document.getElementById('register-form-wrap');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginFormWrap.style.display = 'block';
      registerFormWrap.style.display = 'none';
      authTitle.textContent = 'Sign In to PlaceCo';
      authSubtitle.textContent = 'Enter your institutional credentials to access your placement dashboard.';
      clearAlert();
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      loginFormWrap.style.display = 'none';
      registerFormWrap.style.display = 'block';
      authTitle.textContent = 'Create an Account';
      authSubtitle.textContent = 'Register a new Student or Recruiter account to get started.';
      clearAlert();
    });
  }

  // Password Visibility Toggle
  setupPasswordToggles();

  // Login Form Submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  // Register Form Submission
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }
});

function clearAlert() {
  const alert = document.getElementById('auth-alert');
  if (alert) {
    alert.style.display = 'none';
    alert.textContent = '';
  }
}

function showAlert(message, type = 'danger') {
  const alert = document.getElementById('auth-alert');
  if (alert) {
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<span>${message}</span>`;
    alert.style.display = 'flex';
  }
}

function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        btn.textContent = isPassword ? '👁' : '🔒';
      }
    });
  });
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  clearAlert();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const submitBtn = document.getElementById('login-submit-btn');

  // Client Validation
  if (!email) {
    showAlert('Please enter your email address.', 'danger');
    document.getElementById('login-email').focus();
    return;
  }

  if (!email.toLowerCase().endsWith('@bmu.edu.in')) {
    showAlert('Access restricted: Only official @bmu.edu.in institutional email IDs are permitted.', 'danger');
    document.getElementById('login-email').focus();
    return;
  }

  if (!password) {
    showAlert('Please enter your password.', 'danger');
    document.getElementById('login-password').focus();
    return;
  }

  // Set loading state
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="loading-spinner"></span> Authenticating...`;

  try {
    const res = await PlaceCoAuth.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!res || !res.success) {
      const errorMsg = res && res.message ? res.message : 'Invalid email or password.';
      showAlert(errorMsg, 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }

    // Success! Save session
    PlaceCoAuth.setToken(res.data.token);
    PlaceCoAuth.setUser(res.data.user);

    showAlert(`Welcome back, ${res.data.user.name}! Redirecting to dashboard...`, 'success');

    setTimeout(() => {
      window.location.href = res.data.redirectUrl || `/${res.data.user.role}/dashboard.html`;
    }, 600);

  } catch (err) {
    showAlert('Unable to connect to the authentication server. Please check your connection.', 'danger');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  clearAlert();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const role = document.querySelector('input[name="register-role"]:checked')?.value;
  const submitBtn = document.getElementById('register-submit-btn');

  if (!name) {
    showAlert('Please enter your full name.', 'danger');
    return;
  }

  if (!email) {
    showAlert('Please enter a valid email address.', 'danger');
    return;
  }

  if (!email.toLowerCase().endsWith('@bmu.edu.in')) {
    showAlert('Registration is restricted to official @bmu.edu.in institutional email IDs.', 'danger');
    return;
  }

  if (!password || password.length < 6) {
    showAlert('Password must be at least 6 characters long.', 'danger');
    return;
  }

  if (!role) {
    showAlert('Please select an account role (Student or Recruiter).', 'danger');
    return;
  }

  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="loading-spinner"></span> Registering...`;

  try {
    const res = await PlaceCoAuth.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });

    if (!res || !res.success) {
      const errorMsg = res && res.message ? res.message : 'Registration failed.';
      showAlert(errorMsg, 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }

    PlaceCoAuth.setToken(res.data.token);
    PlaceCoAuth.setUser(res.data.user);

    showAlert(`Account created successfully! Redirecting to dashboard...`, 'success');

    setTimeout(() => {
      window.location.href = res.data.redirectUrl || `/${res.data.user.role}/dashboard.html`;
    }, 700);

  } catch (err) {
    showAlert('Registration error occurred. Please try again.', 'danger');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}
