const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const { upload } = require('../middleware/upload');
const {
  getDashboardStats,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getEventsAdmin,
  getRegistrationsAdmin,
  getRegistrationById,
  deleteRegistration
} = require('../controllers/adminController');

router.use(adminAuth);
router.get('/stats', getDashboardStats);
router.get('/events', getEventsAdmin);
router.get('/events/:eventId', getEventById);
router.post('/events', upload.single('poster'), createEvent);
router.put('/events/:eventId', upload.single('poster'), updateEvent);
router.delete('/events/:eventId', deleteEvent);
router.get('/registrations', getRegistrationsAdmin);
router.get('/registrations/:registrationId', getRegistrationById);
router.delete('/registrations/:registrationId', deleteRegistration);

module.exports = router;
