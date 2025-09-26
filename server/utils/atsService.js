const fs = require('fs');
const pdf = require('pdf-parse');

// --- LOCAL ATS SCORING FUNCTION ---
// This function reads a resume and scores it against job skills without any external API.
async function calculateLocalAtsScore(resumePath, jobSkills) {
    try {
        console.log(`[Local ATS] Reading resume: ${resumePath}`);
        if (!fs.existsSync(resumePath)) {
            throw new Error(`File not found: ${resumePath}`);
        }
        
        const dataBuffer = fs.readFileSync(resumePath);
        const data = await pdf(dataBuffer);
        const resumeText = data.text.toLowerCase(); // Convert to lowercase for case-insensitive matching

        let matchedSkills = 0;
        
        // --- ROBUST SKILL PARSING LOGIC ---
        // This can handle both old (string) and new (object) skill formats.
        const requiredSkills = jobSkills.map(skill => {
            if (typeof skill === 'object' && skill.name) {
                return skill.name.toLowerCase();
            }
            if (typeof skill === 'string') {
                return skill.toLowerCase();
            }
            return null;
        }).filter(Boolean); // Filter out any null or undefined entries

        console.log('[Local ATS] Required Skills:', requiredSkills);

        requiredSkills.forEach(skill => {
            if (resumeText.includes(skill)) {
                matchedSkills++;
                console.log(`[Local ATS] Found skill: ${skill}`);
            }
        });

        // Clean up the temporary file after analysis
        if (fs.existsSync(resumePath)) {
            fs.unlinkSync(resumePath);
            console.log(`[Local ATS] Cleaned up temporary file: ${resumePath}`);
        }

        if (requiredSkills.length === 0) {
            return 100; // If no skills are required, score is 100
        }

        const score = Math.round((matchedSkills / requiredSkills.length) * 100);
        console.log(`[Local ATS] Final Score: ${score}`);
        return score;

    } catch (error) {
        console.error('--- ERROR IN LOCAL ATS CALCULATION ---');
        console.error('Error Message:', error.message);
        // Ensure cleanup happens even if there's an error
        if (fs.existsSync(resumePath)) {
            fs.unlinkSync(resumePath);
        }
        return 0; // Return a score of 0 if analysis fails
    }
}

module.exports = { calculateLocalAtsScore };

