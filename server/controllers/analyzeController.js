const Job = require('../models/Job');
const { analyzeResume } = require('../services/geminiService');

// Controller to analyze a batch of resumes for a specific job
exports.analyzeBatchResumes = async (req, res) => {
    // 1. Security check: Ensure user is HR
    if (req.user.userType !== 'HR') {
        return res.status(403).json({ msg: 'Access denied. Only HR can perform this action.' });
    }

    // 2. Validate input: Check for files and a jobId
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: 'No resume files were uploaded.' });
    }
    const { jobId } = req.body;
    if (!jobId) {
        return res.status(400).json({ msg: 'A job must be selected for analysis.' });
    }

    try {
        // 3. Find the job to analyze against
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found.' });
        }

        // 4. Process all uploaded resumes concurrently for efficiency
        const analysisPromises = req.files.map(async (file) => {
            const analysisResult = await analyzeResume(file.path, job);
            return {
                fileName: file.originalname,
                atsScore: analysisResult ? analysisResult.atsScore : 'Error',
                summary: analysisResult ? analysisResult.summary : 'Analysis failed for this resume.'
            };
        });

        const results = await Promise.all(analysisPromises);

        // 5. Send the list of analysis results back to the client
        res.status(200).json(results);

    } catch (err) {
        console.error('Batch Analysis Error:', err.message);
        res.status(500).send('Server Error');
    }
};
