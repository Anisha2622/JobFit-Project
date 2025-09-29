const fs = require('fs');
const pdf = require('pdf-parse');

// This function now returns both a score and a list of matched skills.
async function calculateAtsFromResumeText(resumePath, jobSkills) {
    try {
        console.log(`[ATS Service - Text Scan] Reading resume: ${resumePath}`);
        if (!fs.existsSync(resumePath)) {
            throw new Error(`File not found: ${resumePath}`);
        }
        
        const dataBuffer = fs.readFileSync(resumePath);
        const data = await pdf(dataBuffer);
        const resumeText = data.text.toLowerCase();

        const matchedSkillNames = [];
        
        const requiredSkills = jobSkills.map(skill => {
            if (typeof skill === 'object' && skill.name) {
                return skill.name.toLowerCase();
            }
            if (typeof skill === 'string') {
                return skill.toLowerCase();
            }
            return null;
        }).filter(Boolean);

        console.log('[ATS Service - Text Scan] Required Skills:', requiredSkills);

        if (requiredSkills.length === 0) {
            return { score: 0, matchedSkills: [] }; // Return a more detailed object
        }

        requiredSkills.forEach(skill => {
            if (resumeText.includes(skill)) {
                matchedSkillNames.push(skill); // Add the found skill to the list
            }
        });

        const score = Math.round((matchedSkillNames.length / requiredSkills.length) * 100);
        console.log(`[ATS Service - Text Scan] Final Score: ${score}, Matched: ${matchedSkillNames.join(', ')}`);
        
        return { score, matchedSkillNames };

    } catch (error) {
        console.error('--- ERROR IN RESUME TEXT CALCULATION ---');
        console.error('Error Message:', error.message);
        return { score: 0, matchedSkills: [] };
    } finally {
        if (fs.existsSync(resumePath)) {
            fs.unlinkSync(resumePath);
        }
    }
}

// ... (The calculateAtsFromSkillMatch function remains the same)
function calculateAtsFromSkillMatch(jobSkills, candidateSkills) {
    // ...
}

module.exports = { calculateAtsFromResumeText, calculateAtsFromSkillMatch };

