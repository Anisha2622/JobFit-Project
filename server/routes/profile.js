const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, updatePassword } = require('../controllers/profileController');

// All routes here are protected and require a user to be logged in

// @route   GET api/profile/me
// @desc    Get current user's profile
router.get('/me', auth, getProfile);

// @route   PUT api/profile
// @desc    Update user's basic information
router.put('/', auth, updateProfile);

// @route   PUT api/profile/password
// @desc    Update user's password
router.put('/password', auth, updatePassword);

module.exports = router;

