const express = require('express');
const router = express.Router();
const { createJob, getAllJobs } = require('../controllers/jobController');
const auth = require('../middleware/auth'); // Import the auth middleware

// @route   POST api/jobs
// @desc    Create a new job posting
// @access  Private (HR only)
router.post('/', auth, createJob); // We add 'auth' here to protect the route

// @route   GET api/jobs
// @desc    Get all job postings
// @access  Public
router.get('/', getAllJobs);

module.exports = router;