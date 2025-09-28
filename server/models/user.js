const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userType: {
        type: String,
        required: true,
        enum: ['HR', 'Candidate']
    },
    password: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: function() { return this.userType === 'HR'; }
    },
    jobId: {
        type: String,
        required: function() { return this.userType === 'HR'; }
    },
    fullName: {
        type: String,
        required: function() { return this.userType === 'Candidate'; }
    },
    email: {
        type: String,
        required: function() { return this.userType === 'Candidate'; }
    }
}, { timestamps: true });

// --- DEFINITIVE FIX USING PARTIAL INDEXES ---
// This is a more robust way to ensure emails and jobIds are unique only when they exist and are not empty.
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $ne: null, $ne: "" } } });
UserSchema.index({ jobId: 1 }, { unique: true, partialFilterExpression: { jobId: { $exists: true, $ne: null, $ne: "" } } });


module.exports = mongoose.models.User || mongoose.model('User', UserSchema);

