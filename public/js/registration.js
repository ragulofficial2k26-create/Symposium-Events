let eventDetails = null;
const registrationState = { step: 1, data: {} };

function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function showOverlayPopup(message) {
  if (document.querySelector('.overlay-popup')) return;
  const overlay = document.createElement('div');
  overlay.className = 'overlay-popup';
  overlay.innerHTML = `
    <div class="overlay-popup-content">
      <h2>Already Registered</h2>
      <p>${message}</p>
      <button type="button" class="btn btn-primary overlay-close">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  overlay.querySelector('.overlay-close').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = '';
  });
}

async function loadEventDataForRegistration() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('eventId');
  if (!eventId) return;
  const response = await fetch(`/api/events/${eventId}`);
  if (!response.ok) return;
  eventDetails = await response.json();
  const poster = document.querySelector('#eventPoster');
  const title = document.querySelector('#eventTitle');
  if (poster) poster.src = eventDetails.posterPath || '/images/default-poster.svg';
  if (title) title.textContent = eventDetails.eventName;
  buildCompetitionInputs();
}

function buildCompetitionInputs() {
  if (!eventDetails) return;
  const competitionContainer = document.querySelector('#competitionFields');
  if (!competitionContainer) return;
  competitionContainer.innerHTML = eventDetails.competitions
    .map((competition) => {
      return `
      <div class="card competition-card" data-competition="${competition.name}">
        <h4>${competition.name}</h4>
        <p class="text-muted">Rules: ${competition.rules || 'None'}</p>
        <p class="text-muted">Venue: ${competition.venue || 'TBA'}</p>
        <p class="text-muted">Start Time: ${competition.startTime || 'TBA'}</p>
        ${Array.from({ length: competition.maxParticipants }, (_, index) => `
          <div class="form-group">
            <label>Participant ${index + 1} Name</label>
            <input type="text" name="participant-${competition.name}-${index}" placeholder="Participant ${index + 1}" required />
          </div>
        `).join('')}
      </div>`;
    })
    .join('');
}

function showStep(step) {
  document.querySelectorAll('.form-step').forEach((section) => {
    section.classList.toggle('active', parseInt(section.dataset.step, 10) === step);
  });
  document.querySelectorAll('.step-pill').forEach((pill) => {
    pill.classList.toggle('active', parseInt(pill.dataset.step, 10) === step);
  });
  registrationState.step = step;
}

function collectStepOne() {
  const collegeName = document.querySelector('#collegeName').value.trim();
  const department = document.querySelector('#department').value.trim();
  const staffName = document.querySelector('#staffName').value.trim();
  const staffPhone = document.querySelector('#staffPhone').value.trim();
  const district = document.querySelector('#district').value.trim();
  if (!collegeName || !department || !staffName || !staffPhone || !district) {
    showToast('Please fill all college information fields', 'error');
    return false;
  }
  registrationState.data = { collegeName, department, staffName, staffPhone, district };
  return true;
}

function collectStepTwo() {
  if (!eventDetails) return null;
  const competitions = eventDetails.competitions.map((competition) => {
    const participantFields = Array.from({ length: competition.maxParticipants }).map((_, index) => {
      const field = document.querySelector(`input[name="participant-${competition.name}-${index}"]`);
      return field ? field.value.trim() : '';
    });
    if (participantFields.some((value) => !value)) {
      showToast('All participant fields must be filled', 'error');
      return null;
    }
    return { ...competition, participants: participantFields };
  });
  if (competitions.some((comp) => comp === null)) {
    return null;
  }
  return competitions;
}

async function submitRegistration() {
  if (!eventDetails) return;
  const competitions = collectStepTwo();
  if (!competitions) return;
  const body = {
    eventId: eventDetails._id,
    eventName: eventDetails.eventName,
    posterPath: eventDetails.posterPath,
    ...registrationState.data,
    competitions
  };
  const response = await fetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 409) {
      return showOverlayPopup('You have already registered for this event. If any doubt, contact +91 9748736556.');
    }
    return showToast(result.message || 'Registration failed', 'error');
  }
  showToast('Registration submitted successfully');
  setTimeout(() => {
    window.location.href = '/my-registrations';
  }, 1200);
}

function initRegistrationHandlers() {
  const nextButton = document.querySelector('#nextStep');
  const backButton = document.querySelector('#backStep');
  const submitButton = document.querySelector('#submitRegistration');
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (collectStepOne()) showStep(2);
    });
  }
  if (backButton) {
    backButton.addEventListener('click', () => showStep(1));
  }
  if (submitButton) {
    submitButton.addEventListener('click', submitRegistration);
  }
}

async function loadMyRegistrations() {
  const container = document.querySelector('#registrationCards');
  if (!container) return;
  const response = await fetch('/api/registrations/me');
  const registrations = response.ok ? await response.json() : [];
  container.innerHTML = registrations
    .map((registration) => `
      <article class="card registration-card">
        <div class="card-header">
          <div>
            <h3>${registration.eventName}</h3>
            <p class="text-muted">College ID: ${registration.collegeId}</p>
          </div>
          <div class="badge primary">${registration.registrationDate.slice(0, 10)}</div>
        </div>
        <p><strong>College:</strong> ${registration.collegeName}</p>
        <p><strong>Department:</strong> ${registration.department}</p>
        <p><strong>Staff:</strong> ${registration.staffName}</p>
        <p><strong>Phone:</strong> ${registration.staffPhone}</p>
        <p><strong>District:</strong> ${registration.district}</p>
        <div class="admin-actions">
          <a class="btn btn-secondary" href="/api/reports/pdf/${registration.registrationId}">Download PDF</a>
          
        </div>
      </article>`)
    .join('');
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#registrationWizard')) {
    loadEventDataForRegistration();
    initRegistrationHandlers();
    showStep(1);
  }
  if (document.querySelector('#registrationCards')) {
    loadMyRegistrations();
  }
});
