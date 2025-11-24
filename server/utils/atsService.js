const fs = require('fs');
const pdf = require('pdf-parse');

// --- SCORING ENGINE 1: Resume Text Analysis ---
// This is used for the HR "Upload Resumes" feature.
async function calculateAtsFromResumeText(resumePath, jobSkills) {
    let tempFilePath = resumePath;
    try {
        console.log(`[ATS Service - Text Scan] Reading resume: ${tempFilePath}`);
        if (!fs.existsSync(tempFilePath)) {
            throw new Error(`File not found: ${tempFilePath}`);
        }
        
        const dataBuffer = fs.readFileSync(tempFilePath);
        const data = await pdf(dataBuffer);
        const resumeText = data.text.toLowerCase();

        const matchedSkillNames = [];
        
        const requiredSkills = (jobSkills || []).map(skill => {
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
            console.log('[ATS Service - Text Scan] No required skills for this job. Score is 0.');
            return { score: 0, matchedSkills: [] };
        }

        requiredSkills.forEach(skill => {
            if (resumeText.includes(skill)) {
                matchedSkillNames.push(skill);
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
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`[ATS Service] Cleaned up temporary file: ${tempFilePath}`);
        }
    }
}

// --- SCORING ENGINE 2: Direct Skill Matching ---
// This is used when a candidate applies, comparing their skills to the job's skills.
function calculateAtsFromSkillMatch(jobSkills, candidateSkills) {
    console.log('[ATS Service - Skill Match] Starting skill comparison.');
    
    if (!jobSkills || jobSkills.length === 0) {
        console.log('[ATS Service - Skill Match] No required skills for this job. Score is 0.');
        return 0;
    }

    const jobSkillsMap = new Map();
    let totalPossibleScore = 0;

    jobSkills.forEach(skill => {
        const skillName = (skill.name || '').toLowerCase();
        const rating = skill.rating || 1;
        jobSkillsMap.set(skillName, rating);
        totalPossibleScore += rating;
    });

    let achievedScore = 0;
    (candidateSkills || []).forEach(candidateSkill => {
        const skillName = (candidateSkill.name || '').toLowerCase();
        if (jobSkillsMap.has(skillName)) {
            achievedScore += jobSkillsMap.get(skillName);
        }
    });

    if (totalPossibleScore === 0) return 100;

    const finalScore = Math.round((achievedScore / totalPossibleScore) * 100);
    console.log(`[ATS Service - Skill Match] Final Score: ${finalScore}`);
    return finalScore;
}


module.exports = { calculateAtsFromResumeText, calculateAtsFromSkillMatch };

