const fs = require('fs');
const path = require('path');

// This function checks if the 'uploads' directory exists, and creates it if it doesn't.
const ensureUploadsDirectoryExists = () => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
        try {
            fs.mkdirSync(uploadPath);
            console.log("'uploads' directory created successfully.");
        } catch (err) {
            console.error("Error creating 'uploads' directory:", err);
        }
    }
};

module.exports = { ensureUploadsDirectoryExists };
