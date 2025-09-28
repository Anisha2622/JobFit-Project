const Job = require('../models/job');
const Application = require('../models/Application');

// @desc    Create a new job posting
exports.createJob = async (req, res) => {
    if (req.user.userType !== 'HR') {
        return res.status(403).json({ msg: 'Access denied. Only HR can post jobs.' });
    }
    const { companyName, jobTitle, experience, skills, jobDescription } = req.body;
    try {
        const newJob = new Job({
            companyName,
            jobTitle,
            experience,
            skills,
            jobDescription,
            postedBy: req.user.id
        });
        const job = await newJob.save();
        res.status(201).json(job);
    } catch (err) {
        console.error('Create Job Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all job postings (for candidates)
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        console.error('Get All Jobs Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get jobs for the current HR user with stats
exports.getMyJobs = async (req, res) => {
    if (req.user.userType !== 'HR') {
        return res.status(403).json({ msg: 'Access denied.' });
    }
    try {
        const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });

        const jobsWithStats = await Promise.all(
            jobs.map(async (job) => {
                const total = await Application.countDocuments({ jobId: job._id });
                const accepted = await Application.countDocuments({ jobId: job._id, status: 'Accepted' });
                const rejected = await Application.countDocuments({ jobId: job._id, status: 'Rejected' });
                
                return {
                    ...job.toObject(),
                    applicationStats: { total, accepted, rejected }
                };
            })
        );

        res.json(jobsWithStats);
    } catch (err) {
        console.error('Get My Jobs Error:', err.message);
        res.status(500).send('Server Error');
    }
};

