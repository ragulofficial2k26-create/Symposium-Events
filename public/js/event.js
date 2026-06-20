let myRegistrations = [];

function getEventsApiRoute() {
  return window.location.pathname === '/' ? '/api/events/public' : '/api/events';
}

function getEventDetailsApiRoute(eventId) {
  return window.location.pathname === '/' ? `/api/events/public/${eventId}` : `/api/events/${eventId}`;
}

async function fetchEvents() {
  const response = await fetch(getEventsApiRoute());
  return response.ok ? response.json() : [];
}

async function fetchMyRegistrations() {
  try {
    const response = await fetch('/api/registrations/me');
    return response.ok ? await response.json() : [];
  } catch (error) {
    return [];
  }
}

function isAlreadyRegistered(eventId) {
  return myRegistrations.some((registration) => registration.eventId === eventId);
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
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  overlay.querySelector('.overlay-close').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = '';
  });
}

function renderEventCards(events) {
  const grid = document.querySelector('.events-grid');
  if (!grid) return;
  grid.innerHTML = events
    .map((event) => {
      const status = event.statusLabel.badge;
      const badgeClass = event.status === 'open' ? 'success' : event.status === 'upcoming' ? 'warning' : 'danger';
      const registerButton = event.status === 'open'
        ? `<a class="btn btn-primary" data-event-id="${event._id}" data-event-status="${event.status}" href="/event-details?eventId=${event._id}">Register</a>`
        : `<button type="button" class="btn btn-primary btn-disabled" data-event-id="${event._id}" data-event-status="${event.status}" aria-disabled="true">${event.status === 'upcoming' ? `Starts ${event.registrationStartDate} ${event.registrationStartTime}` : 'Registration Closed'}</button>`;
      return `
      <article class="event-card card">
        <img src="${event.posterPath || '/images/default-poster.svg'}" alt="${event.eventName}">
        <div class="event-card-body">
          <span class="badge ${badgeClass}">${status}</span>
          <h3>${event.eventName}</h3>
          <div class="event-meta">
            <span>📅 ${event.eventConductDate}</span>
            <span>⏰ ${event.eventStartTime}</span>
          </div>
          <p class="text-muted">Registration: ${event.registrationStartDate} ${event.registrationStartTime} to ${event.registrationEndDate} ${event.registrationEndTime}</p>
          <div class="countdown-card" data-countdown-end="${event.registrationEndDate}T${event.registrationEndTime}" data-status-label="${status}">
            <div class="countdown-timer text-muted">Loading timer...</div>
          </div>
          <div class="event-card-footer">
            <button type="button" class="btn btn-secondary view-details" data-event-id="${event._id}">View details</button>
            ${registerButton}
          </div>
        </div>
      </article>`;
    })
    .join('');
}

function applySearchFilter(events, query) {
  return events.filter((event) => event.eventName.toLowerCase().includes(query.toLowerCase()));
}

async function loadEventsPage() {
  const [events, registrations] = await Promise.all([fetchEvents(), fetchMyRegistrations()]);
  myRegistrations = registrations || [];
  renderEventCards(events);
  attachRegisterClickHandlers();
  attachViewDetailsHandlers();
  
  // Initialize countdown timers
  if (typeof buildCountdownElements === 'function') {
    setTimeout(() => {
      buildCountdownElements();
    }, 50);
  }
  
  const searchInput = document.querySelector('#searchEvents');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderEventCards(applySearchFilter(events, searchInput.value));
      attachRegisterClickHandlers();
      attachViewDetailsHandlers();
      
      // Re-initialize countdown timers after search
      if (typeof buildCountdownElements === 'function') {
        setTimeout(() => {
          buildCountdownElements();
        }, 50);
      }
    });
  }
}

function attachRegisterClickHandlers() {
  document.querySelectorAll('a[data-event-id], button[data-event-id]').forEach((button) => {
    button.removeEventListener('click', handleRegisterClick);
    button.addEventListener('click', handleRegisterClick);
  });
}

function attachViewDetailsHandlers() {
  document.querySelectorAll('button.view-details[data-event-id]').forEach((button) => {
    button.removeEventListener('click', handleViewDetailsClick);
    button.addEventListener('click', handleViewDetailsClick);
  });
}

async function handleViewDetailsClick(e) {
  const eventId = e.currentTarget.dataset.eventId;
  if (!eventId) return;
  e.preventDefault();
  const response = await fetch(getEventDetailsApiRoute(eventId));
  if (!response.ok) return;
  const event = await response.json();
  showEventDetailsModal(event);
}

function showEventDetailsModal(event) {
  if (document.querySelector('.overlay-event-details')) return;
  const overlay = document.createElement('div');
  overlay.className = 'overlay-event-details';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';
  overlay.innerHTML = `
    <div class="event-modal" style="background:#fff; border-radius:12px; max-width:900px; width:90%; max-height:90%; overflow:auto; position:relative; padding:20px; box-shadow:0 8px 30px rgba(0,0,0,0.3);">
      <button class="event-modal-close" aria-label="Close" style="position:absolute; right:12px; top:8px; background:transparent; border:0; font-size:28px; line-height:1; cursor:pointer;">&times;</button>
      <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:flex-start;">
        <img src="${event.posterPath || '/images/default-poster.svg'}" alt="${event.eventName}" style="border-radius:12px; max-width:320px; width:100%; height:auto; object-fit:cover;">
        <div style="flex:1; min-width:240px;">
          <h2 style="margin-top:0">${event.eventName}</h2>
          <div class="registration-status" style="margin-bottom:8px;"><span class="badge ${event.status === 'open' ? 'success' : event.status === 'upcoming' ? 'warning' : 'danger'}">${event.statusLabel.badge}</span></div>
          <p class="text-muted">Event date ${event.eventConductDate} at ${event.eventStartTime}</p>
          <div class="event-meta" style="margin:8px 0;">
            <div>Registration begins: ${event.registrationStartDate} ${event.registrationStartTime}</div>
            <div>Registration ends: ${event.registrationEndDate} ${event.registrationEndTime}</div>
          </div>
          <p>${event.description || ''}</p>
        </div>
      </div>
      <div id="eventCompetitions" style="margin-top:14px; display:flex; flex-direction:column; gap:8px;">
        ${event.competitions && event.competitions.length ? event.competitions.map((c) => `
          <div class="card competition-card" style="padding:10px; border-radius:8px;">
            <h4 style="margin:0 0 6px 0">${c.name}</h4>
            <p class="text-muted" style="margin:0">Venue: ${c.venue || 'TBA'}</p>
            <p class="text-muted" style="margin:0">Start Time: ${c.startTime || 'TBA'}</p>
            <p class="text-muted" style="margin:0">Rules: ${c.rules || 'No rules defined'}</p>
            <p class="text-muted" style="margin:0">Max participants: ${c.maxParticipants || 'N/A'}</p>
          </div>`).join('') : ''}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  const closeBtn = overlay.querySelector('.event-modal-close');
  function closeModal() {
    overlay.remove();
    document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) closeModal();
  });
}

function handleRegisterClick(event) {
  const target = event.currentTarget;
  const eventId = target.dataset.eventId;
  const status = target.dataset.eventStatus;
  if (!eventId) return;
  if (status !== 'open') {
    event.preventDefault();
    if (status === 'upcoming') {
      return showOverlayPopup('Registration has not started yet. It begins on the event start date and time shown.');
    }
    
  }
  if (isAlreadyRegistered(eventId)) {
    event.preventDefault();
    return showOverlayPopup('You have already registered for this event. If any doubt, contact +91 9748736556.');
  }
}

async function loadEventDetails() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('eventId');
  if (!eventId) return;
  const response = await fetch(`/api/events/${eventId}`);
  if (!response.ok) return;
  const event = await response.json();
  const detailsPanel = document.querySelector('.details-panel');
  if (!detailsPanel) return;
  const statusClass = event.status === 'open' ? 'success' : event.status === 'upcoming' ? 'warning' : 'danger';
  detailsPanel.innerHTML = `
    <div class="event-details-panel card">
      <img src="${event.posterPath || '/images/default-poster.svg'}" alt="${event.eventName}" style="border-radius:22px; max-height:360px; width:100%; object-fit:cover;">
      <div class="registration-status">
        <span class="badge ${statusClass}">${event.statusLabel.badge}</span>
      </div>
      <h2>${event.eventName}</h2>
      <p class="text-muted">Event date ${event.eventConductDate} at ${event.eventStartTime}</p>
      <div class="event-meta">
        <span>Registration begins: ${event.registrationStartDate} ${event.registrationStartTime}</span>
        <span>Registration ends: ${event.registrationEndDate} ${event.registrationEndTime}</span>
      </div>
      <div class="countdown-card" data-countdown-end="${event.registrationEndDate}T${event.registrationEndTime}" data-status-label="${event.statusLabel.badge}">
        <div class="badge ${statusClass} countdown-status">${event.statusLabel.badge}</div>
        <div class="countdown-timer text-muted">Loading timer...</div>
      </div>
    </div>`;
  
  // Initialize countdown timer after DOM update
  if (typeof buildCountdownElements === 'function') {
    setTimeout(() => {
      buildCountdownElements();
    }, 50);
  }
  const registerPanel = document.querySelector('.registration-action');
  if (registerPanel) {
    if (event.status !== 'open') {
      registerPanel.innerHTML = `<div class="card"><h3 class="text-muted">${event.status === 'upcoming' ? 'Registration Not Started' : 'Registration Closed'}</h3></div>`;
    } else {
      registerPanel.innerHTML = `<div class="card">
          <h3>Register for this event</h3>
          <button class="btn btn-primary" id="startRegistration">Begin Registration</button>
        </div>`;
      const startButton = document.querySelector('#startRegistration');
      if (startButton) {
        startButton.addEventListener('click', (clickEvent) => {
          if (isAlreadyRegistered(eventId)) {
            clickEvent.preventDefault();
            return showOverlayPopup('You have already registered for this event. If any doubt, contact +91 9748736556.');
          }
          window.location.href = `/event-details?eventId=${eventId}#register`; 
          const eventFormLoad = document.querySelector('#registrationWizard');
          if (eventFormLoad) eventFormLoad.scrollIntoView({ behavior: 'smooth' });
        });
      }
    }
  }
  const eventInfo = document.querySelector('#eventMeta');
  if (eventInfo) {
    eventInfo.innerHTML = event.competitions
      .map((competition) => `
        <div class="card competition-card">
          <h4>${competition.name}</h4>
          <p class="text-muted">Venue: ${competition.venue || 'TBA'}</p>
          <p class="text-muted">Start Time: ${competition.startTime || 'TBA'}</p>
          <p class="text-muted">Rules: ${competition.rules || 'No rules defined'}</p>
          <p class="text-muted">Max participants: ${competition.maxParticipants}</p>
        </div>`)
      .join('');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.events-grid')) {
    loadEventsPage();
  }
  if (document.querySelector('.details-panel')) {
    loadEventDetails();
  }
});
