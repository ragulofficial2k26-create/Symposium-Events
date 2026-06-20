function createCountdown(targetElement, endDatetime, statusLabel) {
  const statusBadge = targetElement.querySelector('.countdown-status');
  const counter = targetElement.querySelector('.countdown-timer');
  
  // Ensure elements exist
  if (!counter) return;
  
  const interval = setInterval(() => {
    const now = new Date();
    const end = new Date(endDatetime);
    const distance = end - now;
    
    if (distance <= 0) {
      clearInterval(interval);
      if (statusBadge) {
        statusBadge.textContent = 'Registration Closed';
        statusBadge.className = 'badge danger';
      }
      if (counter) counter.textContent = '⏰ Registration Period Ended';
      return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / 1000 / 60) % 60);
    const seconds = Math.floor((distance / 1000) % 60);
    
    if (counter) {
      counter.textContent = `⏳ Ends in ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    
    if (statusBadge && statusLabel) {
      statusBadge.textContent = statusLabel;
      statusBadge.className = `badge ${statusLabel === 'Registration Open' ? 'success' : 'warning'}`;
    }
  }, 1000);
}

function buildCountdownElements() {
  const countdownBlocks = document.querySelectorAll('[data-countdown-end]');
  countdownBlocks.forEach((block) => {
    const endDate = block.dataset.countdownEnd;
    const status = block.dataset.statusLabel || 'Registration Open';
    createCountdown(block, endDate, status);
  });
}

// Run on page load
window.addEventListener('load', buildCountdownElements);

// Also watch for DOM changes to handle dynamically created elements
if (window.MutationObserver) {
  const observer = new MutationObserver(() => {
    buildCountdownElements();
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
