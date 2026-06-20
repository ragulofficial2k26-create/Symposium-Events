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

async function createRegistrationId() {
  return `REG${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function submitRegistration(req, res) {
  try {
    const db = getDb();
    const user = req.session.user;

    const {
      eventId,
      eventName,
      posterPath,
      collegeName,
      department,
      staffName,
      staffPhone,
      district,
      competitions
    } = req.body;

    if (
      !eventId ||
      !collegeName ||
      !department ||
      !staffName ||
      !staffPhone ||
      !district ||
      !competitions
    ) {
      return res.status(400).json({
        message: 'All registration fields are required'
      });
    }

    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId)
    });

    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    const status = getEventStatus(event);

    if (status === 'upcoming') {
      return res.status(400).json({
        message: 'Registration has not started'
      });
    }

    if (status === 'closed') {
      return res.status(400).json({
        message: 'Registration has closed'
      });
    }

    const existing = await db.collection('registrations').findOne({
      eventId,
      collegeId: user.collegeId
    });

    if (existing) {
      return res.status(409).json({
        message: 'Already registered for this event'
      });
    }

    const competitionData = Array.isArray(competitions)
      ? competitions
      : JSON.parse(competitions);

    const registrationId = await createRegistrationId();

    await db.collection('registrations').insertOne({
      registrationId,
      eventId,
      eventName,
      posterPath,
      collegeId: user.collegeId,
      collegeName,
      department,
      staffName,
      staffPhone,
      district,
      competitions: competitionData,
      registrationDate: new Date().toISOString(),
      createdAt: new Date()
    });

    return res.json({
      message: 'Registration successful',
      registrationId
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Failed to submit registration',
      error: error.message
    });
  }
}

async function getMyRegistrations(req, res) {
  try {
    const db = getDb();
    const user = req.session.user;

    const registrations = await db
      .collection('registrations')
      .find({
        collegeId: user.collegeId
      })
      .toArray();

    res.json(registrations);

  } catch (error) {
    res.status(500).json({
      message: 'Failed to load registrations',
      error: error.message
    });
  }
}

async function getRegistrationById(req, res) {
  try {
    const db = getDb();
    const { registrationId } = req.params;

    const registration = await db
      .collection('registrations')
      .findOne({
        registrationId
      });

    if (!registration) {
      return res.status(404).json({
        message: 'Registration not found'
      });
    }

    res.json(registration);

  } catch (error) {
    res.status(500).json({
      message: 'Failed to load registration',
      error: error.message
    });
  }
}

module.exports = {
  submitRegistration,
  getMyRegistrations,
  getRegistrationById
};