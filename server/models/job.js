const mongoose = require('mongoose');

// Define the structure for a single skill with a rating
const SkillSchema = new mongoose.Schema({
    skillName: {
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
    skills: {
        type: [SkillSchema], // Use the new SkillSchema
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
