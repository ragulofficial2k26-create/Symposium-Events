async function loadDashboard() {
  const statsResponse = await fetch('/api/admin/stats');
  const stats = statsResponse.ok ? await statsResponse.json() : {};
  document.querySelector('#totalEvents').textContent = stats.totalEvents || 0;
  document.querySelector('#totalColleges').textContent = stats.totalColleges || 0;
  document.querySelector('#totalParticipants').textContent = stats.totalParticipants || 0;
  document.querySelector('#activeEvents').textContent = stats.activeEvents || 0;
  document.querySelector('#closedEvents').textContent = stats.closedEvents || 0;
}

function generateEventList(events) {
  const container = document.querySelector('#adminEventList');
  if (!container) return;
  container.innerHTML = events
    .map((event) => {
      const statusClass = event.status === 'open' ? 'success' : event.status === 'upcoming' ? 'warning' : 'danger';
      return `
      <div class="event-list-item">
        <img src="${event.posterPath || '/images/default-poster.svg'}" alt="${event.eventName}">
        <div>
          <h4>${event.eventName}</h4>
          <p class="text-muted">${event.eventConductDate} • ${event.eventStartTime}</p>
          <span class="badge ${statusClass}">${event.statusLabel.badge}</span>
        </div>
        <div class="admin-actions">
          <a class="btn btn-secondary" href="/admin/edit-event?eventId=${event._id}">Edit</a>
          <button class="btn btn-danger" data-delete-event="${event._id}">Delete</button>
        </div>
      </div>`;
    })
    .join('');
}

async function loadAdminEvents() {
  const search = document.querySelector('#eventSearch')?.value.trim() || '';
  const status = document.querySelector('#filterStatus')?.value || '';
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  const response = await fetch(`/api/admin/events?${query.toString()}`);
  const events = response.ok ? await response.json() : [];
  generateEventList(events);
  bindDeleteHandlers();
}

function bindDeleteHandlers() {
  const buttons = document.querySelectorAll('[data-delete-event]');
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const eventId = button.dataset.deleteEvent;
      if (!confirm('Delete this event?')) return;
      const response = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
      if (response.ok) {
        loadAdminEvents();
      } else {
        alert('Unable to delete event');
      }
    });
  });
}

async function loadRegistrationTable() {
  const search = document.querySelector('#registrationSearch')?.value.trim() || '';
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  const response = await fetch(`/api/admin/registrations?${query.toString()}`);
  const regs = response.ok ? await response.json() : [];
  const body = document.querySelector('#registrationBody');
  if (!body) return;
  body.innerHTML = regs
    .map((reg) => `
      <tr>
        <td>${reg.collegeId}</td>
        <td>${reg.eventName}</td>
        <td>${reg.collegeName}</td>
        <td>${reg.department}</td>
        <td>${reg.staffName}</td>
        <td>${reg.staffPhone}</td>
        <td>${reg.district}</td>
        <td>${new Date(reg.createdAt).toLocaleDateString()}</td>
        <td>
          <a class="btn btn-secondary" href="/api/reports/pdf/${reg.registrationId}">PDF</a>
          <button class="btn btn-danger" data-delete-registration="${reg.registrationId}">Delete</button>
        </td>
      </tr>`)
    .join('');
  bindRegistrationDelete();
}

function bindRegistrationDelete() {
  document.querySelectorAll('[data-delete-registration]').forEach((button) => {
    button.addEventListener('click', async () => {
      const registrationId = button.dataset.deleteRegistration;
      if (!confirm('Remove this registration?')) return;
      const response = await fetch(`/api/admin/registrations/${registrationId}`, { method: 'DELETE' });
      if (response.ok) {
        loadRegistrationTable();
      }
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#totalEvents')) {
    loadDashboard();
  }
  if (document.querySelector('#adminEventList')) {
    loadAdminEvents();
    document.querySelector('#eventSearch')?.addEventListener('input', loadAdminEvents);
    document.querySelector('#filterStatus')?.addEventListener('change', loadAdminEvents);
  }
  if (document.querySelector('#registrationBody')) {
    loadRegistrationTable();
    document.querySelector('#registrationSearch')?.addEventListener('input', loadRegistrationTable);
    document.querySelector('#downloadExcel')?.addEventListener('click', () => {
      window.location.href = '/api/reports/excel';
    });
  }
});
