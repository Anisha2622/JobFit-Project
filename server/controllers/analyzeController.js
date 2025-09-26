const Job = require('../models/Job');
const { calculateLocalAtsScore } = require('../utils/atsService'); // Corrected Import

// Helper function to add a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.analyzeBatchResumes = async (req, res) => {
    if (req.user.userType !== 'HR') {
        return res.status(403).json({ msg: 'Access denied.' });
    }

    const { jobId } = req.body;
    const files = req.files;

    if (!jobId || !files || files.length === 0) {
        return res.status(400).json({ msg: 'Job ID and at least one resume file are required.' });
    }

    try {
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found.' });
        }

        const results = [];
        
        for (const file of files) {
            console.log(`Analyzing file locally: ${file.originalname}...`);
            // Corrected function call
            const score = await calculateLocalAtsScore(file.path, job.skills);
            results.push({
                fileName: file.originalname,
                atsScore: score,
                summary: `The resume matched ${score}% of the required skills.`
            });
            
            // We no longer need a delay for a local function
        }

        res.json(results);

    } catch (err) {
        console.error('Batch Analysis Error:', err.message);
        res.status(500).send('Server Error');
    }
};

