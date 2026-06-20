const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const showPasswordToggle = document.querySelector('#showPassword');

function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

if (showPasswordToggle) {
  showPasswordToggle.addEventListener('change', () => {
    const passwordField = document.querySelector('#password');
    const confirmField = document.querySelector('#confirmPassword');
    if (passwordField) passwordField.type = showPasswordToggle.checked ? 'text' : 'password';
    if (confirmField) confirmField.type = showPasswordToggle.checked ? 'text' : 'password';
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.querySelector('#username').value.trim();
    const password = document.querySelector('#password').value.trim();
    const remember = document.querySelector('#rememberMe').checked;
    if (!username || !password) {
      return showToast('Enter both username and password', 'error');
    }
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember })
    });
    const result = await response.json();
    if (!response.ok) {
      return showToast(result.message || 'Login failed', 'error');
    }
    window.location.href = result.role === 'admin' ? '/admin/dashboard' : '/events';
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const collegeName = document.querySelector('#collegeName').value.trim();
    const username = document.querySelector('#regUsername').value.trim();
    const password = document.querySelector('#regPassword').value.trim();
    const confirmPassword = document.querySelector('#confirmPassword').value.trim();
    if (!collegeName || !username || !password || !confirmPassword) {
      return showToast('Fill in all registration fields', 'error');
    }
    if (password !== confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collegeName, username, password, confirmPassword })
    });
    const result = await response.json();
    if (!response.ok) {
      return showToast(result.message || 'Registration failed', 'error');
    }
    showToast(`Registered! Your College ID: ${result.collegeId}`);
    setTimeout(() => {
      window.location.href = '/login';
    }, 1400);
  });
}
