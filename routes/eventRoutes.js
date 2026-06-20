const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getEvents, getEventDetails, getPublicEvents } = require('../controllers/eventController');

router.get('/public', getPublicEvents);
router.get('/public/:eventId', getEventDetails);
router.use(auth);
router.get('/', getEvents);
router.get('/:eventId', getEventDetails);

module.exports = router;
