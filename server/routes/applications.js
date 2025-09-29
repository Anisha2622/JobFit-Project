const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { 
    applyToJob, 
    getApplicationsForHR, 
    updateApplicationStatus,
    getMyApplications,
    getAnalytics // Import new function
} = require('../controllers/applicationController');

const upload = multer({ dest: 'uploads/' });

router.post('/', [auth, upload.single('resume')], applyToJob);
router.get('/hr', auth, getApplicationsForHR);
router.get('/me', auth, getMyApplications);

// --- NEW: Get analytics for an HR user ---
router.get('/analytics', auth, getAnalytics);

router.patch('/:id/status', auth, updateApplicationStatus);

module.exports = router;

