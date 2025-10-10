const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { 
    applyToJob, 
    getApplicationsForHR, 
    updateApplicationStatus,
    getMyApplications
    // "getAnalytics" is intentionally removed as per your request
} = require('../controllers/applicationController');

const upload = multer({ dest: 'uploads/' });

// @route   POST /api/applications
// @desc    Apply to a job
router.post('/', [auth, upload.single('resume')], applyToJob);

// @route   GET /api/applications/hr
// @desc    Get all applications for an HR user
router.get('/hr', auth, getApplicationsForHR);

// @route   GET /api/applications/me
// @desc    Get all applications for the logged-in candidate
router.get('/me', auth, getMyApplications);

// @route   PATCH /api/applications/:id/status
// @desc    Update an application's status
router.patch('/:id/status', auth, updateApplicationStatus);

module.exports = router;

