const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    coverLetter: {
        type: String
    },
    resumeUrl: { 
        type: String,
        required: true
    },
    skills: [{
        name: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 }
    }],
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected'],
        default: 'Pending'
    },
    // --- RE-ADDED ATS SCORE FIELD ---
    atsScore: {
        type: Number
    }
}, { timestamps: true });

module.exports = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);

