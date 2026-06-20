const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { exportExcel, exportRegistrationPdf } = require('../controllers/reportController');

router.get('/excel', auth, adminAuth, exportExcel);
router.get('/pdf/:registrationId', auth, exportRegistrationPdf);

module.exports = router;
