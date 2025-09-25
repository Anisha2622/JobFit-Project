const Job = require('../models/job');

// Controller function to create a new job
exports.createJob = async (req, res) => {
    if (req.user.userType !== 'HR') {
        return res.status(403).json({ msg: 'Access denied. Only HR can post jobs.' });
    }

    // The skills will now be an array of objects: [{ skillName, rating }]
    const { companyName, jobTitle, experience, skills, jobDescription } = req.body;

    try {
        const newJob = new Job({
            companyName,
            jobTitle,
            experience,
            skills, // Save the array of skill objects
            jobDescription,
            postedBy: req.user.id
        });

        const job = await newJob.save();
        res.status(201).json(job);

    } catch (err) {
        console.error("Create Job Error:", err.message);
        res.status(500).send('Server Error');
    }
};

// Controller function to get all jobs
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        console.error("Get All Jobs Error:", err.message);
        res.status(500).send('Server Error');
    }
};
