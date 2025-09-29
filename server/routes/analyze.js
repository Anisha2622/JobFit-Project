const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { analyzeBatchResumes } = require('../controllers/analyzeController');

const upload = multer({ dest: 'uploads/' });

// @route   POST /api/analyze/resumes
// @desc    Analyze a batch of resumes for a job
// @access  Private (HR Only)
router.post('/resumes', [auth, upload.array('resumes', 10)], analyzeBatchResumes);

module.exports = router;

