const Application = require('../models/Application');
const Job = require('../models/job');
const { calculateAtsFromSkillMatch } = require('../utils/atsService');

// @desc    Apply to a job
exports.applyToJob = async (req, res) => {
    if (req.user.userType !== 'Candidate') {
        return res.status(403).json({ msg: 'Access denied. Only candidates can apply.' });
    }
    if (!req.file) {
        return res.status(400).json({ msg: 'Resume is required.' });
    }
    
    const skills = JSON.parse(req.body.skills);
    const { jobId, fullName, email, phone, coverLetter } = req.body;

    try {
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found.' });
        }

        const newApplication = new Application({
            jobId,
            candidateId: req.user.id,
            fullName,
            email,
            phone,
            coverLetter,
            skills,
            resumeUrl: req.file.path
        });

        // --- TRIGGER LOCAL ATS CALCULATION USING SKILL MATCH ---
        const atsScore = calculateAtsFromSkillMatch(job.skills, skills);
        newApplication.atsScore = atsScore;

        await newApplication.save();

        res.status(201).json({ msg: 'Application submitted successfully!' });

    } catch (err) {
        console.error('Apply to Job Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all applications for an HR user
exports.getApplicationsForHR = async (req, res) => {
    if (req.user.userType !== 'HR') {
        return res.status(403).json({ msg: 'Access denied.' });
    }
    try {
        const jobsPostedByHR = await Job.find({ postedBy: req.user.id }).select('_id');
        const jobIds = jobsPostedByHR.map(job => job._id);
        const applications = await Application.find({ jobId: { $in: jobIds } })
            .populate('jobId', 'jobTitle')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        console.error('Get Applications for HR Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update an application's status
exports.updateApplicationStatus = async (req, res) => {
    if (req.user.userType !== 'HR') {
        return res.status(403).json({ msg: 'Access denied.' });
    }
    const { status } = req.body;
    const { id } = req.params;
    if (!['Accepted', 'Rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status.' });
    }
    try {
        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({ msg: 'Application not found.' });
        }
        const job = await Job.findById(application.jobId);
        if (job.postedBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized.' });
        }
        application.status = status;
        await application.save();
        res.json(application);
    } catch (err) {
        console.error('Update Status Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all applications for the current candidate
exports.getMyApplications = async (req, res) => {
    if (req.user.userType !== 'Candidate') {
        return res.status(403).json({ msg: 'Access denied.' });
    }
    try {
        const applications = await Application.find({ candidateId: req.user.id })
            .populate('jobId', 'jobTitle companyName')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        console.error('Get My Applications Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get analytics for an HR user
exports.getAnalytics = async (req, res) => {
    if (req.user.userType !== 'HR') {
        return res.status(403).json({ msg: 'Access denied.' });
    }

    try {
        const jobsPostedByHR = await Job.find({ postedBy: req.user.id }).select('_id');
        const jobIds = jobsPostedByHR.map(job => job._id);

        const applications = await Application.find({ jobId: { $in: jobIds } });

        const totalApplications = applications.length;
        
        const scoredApplications = applications.filter(app => typeof app.atsScore === 'number');
        const averageScore = scoredApplications.length > 0
            ? scoredApplications.reduce((acc, curr) => acc + curr.atsScore, 0) / scoredApplications.length
            : 0;
            
        const acceptedApplications = applications.filter(app => app.status === 'Accepted').length;
        const acceptanceRate = totalApplications > 0 ? acceptedApplications / totalApplications : 0;

        res.json({
            totalApplications,
            averageScore,
            acceptanceRate
        });

    } catch (err) {
        console.error('Get Analytics Error:', err.message);
        res.status(500).send('Server Error');
    }
};

