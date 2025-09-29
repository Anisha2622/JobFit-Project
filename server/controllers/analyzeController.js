const Job = require('../models/job');
const { calculateAtsFromResumeText } = require('../utils/atsService');

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
            console.log(`Analyzing file with text scanner: ${file.originalname}...`);
            const analysisResult = await calculateAtsFromResumeText(file.path, job.skills);
            results.push({
                fileName: file.originalname,
                atsScore: analysisResult.score,
                // --- NEW: Pass the list of matched skills to the frontend ---
                matchedSkills: analysisResult.matchedSkillNames,
                summary: `The resume matched ${analysisResult.score}% of the required skills based on text analysis.`
            });
        }

        res.json(results);

    } catch (err) {
        console.error('Batch Analysis Error:', err.message);
        res.status(500).send('Server Error');
    }
};

