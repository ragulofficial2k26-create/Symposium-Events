const express = require('express');
const router = express.Router();
const { login, register, logout, profile } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/profile', profile);

module.exports = router;
