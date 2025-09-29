const fs = require('fs');
const path = require('path');

const createUploadsDir = () => {
    // Define the path to the uploads directory relative to the current file
    const uploadsDirPath = path.join(__dirname, '..', 'uploads');

    // Check if the directory exists, and if not, create it
    if (!fs.existsSync(uploadsDirPath)) {
        fs.mkdirSync(uploadsDirPath);
        console.log('Successfully created uploads directory.');
    }
};

module.exports = { createUploadsDir };
