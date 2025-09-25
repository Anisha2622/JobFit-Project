const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { analyzeBatchResumes } = require('../controllers/analyzeController');
const { ensureUploadsDirectoryExists } = require('../utils/fileUtils');

// Multer configuration for multiple file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/';
        ensureUploadsDirectoryExists(uploadPath); // Ensure the directory exists
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// @route   POST api/analyze/resumes
// @desc    Upload and analyze a batch of resumes for a specific job
// @access  Private (HR only)
router.post('/resumes', [auth, upload.array('resumes', 10)], analyzeBatchResumes);

module.exports = router;
