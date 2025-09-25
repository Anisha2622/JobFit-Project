// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use the variable from the .env file in your connection string
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully.');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;