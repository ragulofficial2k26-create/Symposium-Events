const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { submitRegistration, getMyRegistrations, getRegistrationById } = require('../controllers/registrationController');

router.use(auth);
router.post('/', submitRegistration);
router.get('/me', getMyRegistrations);
router.get('/:registrationId', getRegistrationById);

module.exports = router;
