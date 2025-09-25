const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const pdf = require('pdf-parse');

// Initialize the Google Generative AI client
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in the .env file.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Upgraded function to analyze a resume
async function analyzeResume(resumePath, job, candidateSkills = []) {
    try {
        // --- Added a check to ensure the API key is present ---
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured on the server.");
        }

        console.log(`[AI Service] Reading resume: ${resumePath}`);
        if (!fs.existsSync(resumePath)) {
            throw new Error(`File not found at path: ${resumePath}`);
        }
        
        const dataBuffer = fs.readFileSync(resumePath);
        const data = await pdf(dataBuffer);
        const resumeText = data.text;
        console.log('[AI Service] Resume text extracted successfully.');

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Construct the prompt for the AI
        const prompt = `
            Analyze the following resume against the provided job description. If the candidate's self-reported skills are provided, consider them as well.
            Return a clean JSON object with two keys: "atsScore" and "summary". Do not include any other text or markdown formatting.

            - "atsScore": An integer between 0 and 100 representing how well the RESUME TEXT matches the JOB REQUIREMENTS.
            - "summary": A brief, 2-3 sentence summary explaining the score, highlighting the candidate's key strengths and weaknesses for this role.

            **Job Description:**
            - Title: ${job.jobTitle}
            - Experience Required: ${job.experience}
            - Required Skills: ${job.skills.map(s => `${s.name} (Importance: ${s.rating}/5)`).join(', ')}

            **Candidate's Self-Reported Skills (if provided):**
            - ${candidateSkills.length > 0 ? candidateSkills.map(s => `${s.name} (Self-Rated: ${s.rating}/5)`).join(', ') : 'Not provided.'}

            **Resume Content:**
            ${resumeText}

            **JSON Output:**
        `;

        console.log('[AI Service] Sending prompt to Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('[AI Service] Received response from Gemini.');
        
        const cleanedJsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysisResult = JSON.parse(cleanedJsonString);

        return analysisResult;

    } catch (error) {
        // --- ENHANCED ERROR LOGGING ---
        console.error('-----------------------------------------');
        console.error('---     ERROR IN GEMINI ANALYSIS      ---');
        console.error('-----------------------------------------');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Error Message:', error.message);
        if (error.stack) {
            console.error('Stack Trace:', error.stack);
        }
        console.error('-----------------------------------------');
        
        // Return a more descriptive error message
        return { atsScore: 'Error', summary: `Analysis failed: ${error.message}` };
    }
}

module.exports = { analyzeResume };

