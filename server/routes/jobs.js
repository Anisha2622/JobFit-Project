const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, getMyJobs } = require('../controllers/jobController'); // Import new function
const auth = require('../middleware/auth');

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (HR only)
router.post('/', auth, createJob);

// @route   GET /api/jobs/my-jobs
// @desc    Get jobs posted by current HR user
// @access  Private (HR only)
router.get('/my-jobs', auth, getMyJobs);

// @route   GET /api/jobs
// @desc    Get all job postings (Public for candidates)
// @note    This must come after /my-jobs to avoid route conflicts
router.get('/', getAllJobs);

module.exports = router;

