const { getDb } = require('../config/database');
const { ObjectId } = require('mongodb');

function getEventStatus(event) {
  const now = new Date();
  const start = new Date(`${event.registrationStartDate}T${event.registrationStartTime}`);
  const end = new Date(`${event.registrationEndDate}T${event.registrationEndTime}`);
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'open';
  return 'closed';
}

function formatStatus(event) {
  const status = getEventStatus(event);
  if (status === 'upcoming') return { badge: 'Upcoming', color: 'warning' };
  if (status === 'open') return { badge: 'Registration Open', color: 'success' };
  return { badge: 'Registration Closed', color: 'danger' };
}

async function getDashboardStats(req, res) {
  try {
    const db = getDb();
    const events = await db.collection('events').find().sort({ createdAt: -1 }).toArray();
    const users = await db.collection('users').find({ role: 'user' }).toArray();
    const registrations = await db.collection('registrations').find().toArray();
    const activeEvents = events.filter((event) => getEventStatus(event) === 'open').length;
    const closedEvents = events.filter((event) => getEventStatus(event) === 'closed').length;
    const totalParticipants = registrations.reduce((sum, reg) => {
      return sum + reg.competitions.reduce((count, c) => count + c.participants.length, 0);
    }, 0);
    res.json({
      totalEvents: events.length,
      totalColleges: users.length,
      totalParticipants,
      activeEvents,
      closedEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Dashboard statistics failed', error: error.message });
  }
}

async function createEvent(req, res) {
  try {
    const db = getDb();
    const {
      eventName,
      eventConductDate,
      eventStartTime,
      registrationStartDate,
      registrationStartTime,
      registrationEndDate,
      registrationEndTime,
      competitions
    } = req.body;
    if (!eventName || !eventConductDate || !eventStartTime || !registrationStartDate || !registrationStartTime || !registrationEndDate || !registrationEndTime) {
      return res.status(400).json({ message: 'Event fields are required' });
    }
    const posterPath = req.file ? `/uploads/event-posters/${req.file.filename}` : '/images/default-poster.svg';
    const competitionData = Array.isArray(competitions) ? competitions : JSON.parse(competitions || '[]');
    await db.collection('events').insertOne({
      eventName,
      posterPath,
      eventConductDate,
      eventStartTime,
      registrationStartDate,
      registrationStartTime,
      registrationEndDate,
      registrationEndTime,
      competitions: competitionData,
      createdAt: new Date()
    });
    return res.json({ message: 'Event created successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Event creation failed', error: error.message });
  }
}

async function updateEvent(req, res) {
  try {
    const db = getDb();
    const { eventId } = req.params;
    const {
      eventName,
      eventConductDate,
      eventStartTime,
      registrationStartDate,
      registrationStartTime,
      registrationEndDate,
      registrationEndTime,
      competitions
    } = req.body;
    const updateData = {
      eventName,
      eventConductDate,
      eventStartTime,
      registrationStartDate,
      registrationStartTime,
      registrationEndDate,
      registrationEndTime,
      competitions: Array.isArray(competitions) ? competitions : JSON.parse(competitions || '[]')
    };
    if (req.file) {
      updateData.posterPath = `/uploads/event-posters/${req.file.filename}`;
    }
    await db.collection('events').updateOne({ _id: new ObjectId(eventId) }, { $set: updateData });
    res.json({ message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ message: 'Event update failed', error: error.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const db = getDb();
    const { eventId } = req.params;
    await db.collection('events').deleteOne({ _id: new ObjectId(eventId) });
    await db.collection('registrations').deleteMany({ eventId });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Event deletion failed', error: error.message });
  }
}

async function getEventById(req, res) {
  try {
    const db = getDb();
    const { eventId } = req.params;
    const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    return res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load event', error: error.message });
  }
}

async function getEventsAdmin(req, res) {
  try {
    const db = getDb();
    const { search, status } = req.query;
    const events = await db.collection('events').find().toArray();
    const filtered = events.filter((event) => {
      const statusMatch = status ? getEventStatus(event) === status : true;
      const textMatch = search ? event.eventName.toLowerCase().includes(search.toLowerCase()) : true;
      return statusMatch && textMatch;
    });
    // attach status and formatted label for client display (matches public events API)
    const mapped = filtered.map((event) => ({
      ...event,
      _id: event._id.toString(),
      status: getEventStatus(event),
      statusLabel: formatStatus(event)
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load events', error: error.message });
  }
}

async function getRegistrationsAdmin(req, res) {
  try {
    const db = getDb();
    const { search } = req.query;
    const registrations = await db.collection('registrations').find().toArray();
    const filtered = registrations.filter((reg) => {
      if (!search) return true;
      const lower = search.toLowerCase();
      return (
        reg.collegeId.toLowerCase().includes(lower) ||
        reg.collegeName.toLowerCase().includes(lower) ||
        reg.eventName.toLowerCase().includes(lower) ||
        reg.staffName.toLowerCase().includes(lower)
      );
    });
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load registrations', error: error.message });
  }
}

async function getRegistrationById(req, res) {
  try {
    const db = getDb();
    const { registrationId } = req.params;
    const registration = await db.collection('registrations').findOne({ registrationId });
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load registration', error: error.message });
  }
}

async function deleteRegistration(req, res) {
  try {
    const db = getDb();
    const { registrationId } = req.params;
    await db.collection('registrations').deleteOne({ registrationId });
    res.json({ message: 'Registration removed' });
  } catch (error) {
    res.status(500).json({ message: 'Deletion failed', error: error.message });
  }
}

module.exports = {
  getDashboardStats,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getEventsAdmin,
  getRegistrationsAdmin,
  getRegistrationById,
  deleteRegistration
};