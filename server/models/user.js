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

// --- DEFINITIVE FIX for Conditional Uniqueness ---
// This tells the database to only enforce uniqueness if the field exists AND is not an empty string.
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $ne: "" } } });
UserSchema.index({ jobId: 1 }, { unique: true, partialFilterExpression: { jobId: { $exists: true, $ne: "" } } });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
