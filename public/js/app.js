function toggleMobileMenu() {
  const nav = document.querySelector('.nav-links');
  nav.classList.toggle('open');
}

function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function handleLogout(event) {
  event.preventDefault();
  fetch('/api/auth/logout', { method: 'POST' })
    .then(() => {
      window.location.href = '/';
    })
    .catch(() => showToast('Logout failed', 'error'));
}

const mobileToggle = document.querySelector('.toggle-menu');
if (mobileToggle) {
  mobileToggle.addEventListener('click', toggleMobileMenu);
}

const logoutButton = document.querySelector('[data-logout]');
if (logoutButton) {
  logoutButton.addEventListener('click', handleLogout);
}
