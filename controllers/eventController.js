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

async function getEvents(req, res) {
  try {
    const db = getDb();
    const events = await db.collection('events').find().sort({ createdAt: -1 }).toArray();
    const mapped = events.map((event) => ({
      ...event,
      status: getEventStatus(event),
      statusLabel: formatStatus(event)
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load events', error: error.message });
  }
}

async function getPublicEvents(req, res) {
  try {
    const db = getDb();
    const events = await db.collection('events').find().sort({ createdAt: -1 }).toArray();
    const mapped = events.map((event) => ({
      ...event,
      status: getEventStatus(event),
      statusLabel: formatStatus(event)
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load events', error: error.message });
  }
}

async function getEventDetails(req, res) {
  try {
    const db = getDb();
    const { eventId } = req.params;
    const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({
      ...event,
      status: getEventStatus(event),
      statusLabel: formatStatus(event)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load event', error: error.message });
  }
}

module.exports = { getEvents, getPublicEvents, getEventDetails };