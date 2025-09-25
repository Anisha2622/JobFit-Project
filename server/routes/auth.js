// server/routes/auth.js
const express = require('express');
const router = express.Router();
// --- UPDATED: Import both register and login ---
const { register, login } = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', register);

// --- NEW: Add the login route below ---
// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);


module.exports = router;