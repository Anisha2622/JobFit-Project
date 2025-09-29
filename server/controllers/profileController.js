const User = require('../models/user');
const bcrypt = require('bcryptjs');

// @desc    Get current user's profile
// @route   GET /api/profile/me
exports.getProfile = async (req, res) => {
    try {
        // req.user.id is available from the auth middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Get Profile Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   PUT /api/profile
exports.updateProfile = async (req, res) => {
    // Exclude password from being updated here
    const { password, ...updateData } = req.body;

    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user = await User.findByIdAndUpdate(req.user.id, { $set: updateData }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        console.error('Update Profile Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user password
// @route   PUT /api/profile/password
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error('Update Password Error:', err.message);
        res.status(500).send('Server Error');
    }
};

