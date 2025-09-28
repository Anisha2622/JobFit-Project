const mongoose = require('mongoose');

// A sub-schema to define the structure for each skill
const SkillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
});

const JobSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    experience: {
        type: String, 
        required: true
    },
    // The 'skills' field is an array of SkillSchema objects
    skills: {
        type: [SkillSchema], 
        required: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.models.Job || mongoose.model('Job', JobSchema);
