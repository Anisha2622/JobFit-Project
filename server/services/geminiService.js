// server/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const pdf = require('pdf-parse');

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to analyze a resume against a job description
async function analyzeResume(resumePath, job) {
    try {
        // 1. Read the PDF file and extract its text content
        const dataBuffer = fs.readFileSync(resumePath);
        const data = await pdf(dataBuffer);
        const resumeText = data.text;

        // 2. Define the generative model to use
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 3. Construct the prompt for the AI
        const prompt = `
            Analyze the following resume against the provided job description and return a JSON object with two keys: "atsScore" and "summary".

            - "atsScore": An integer between 0 and 100 representing how well the resume matches the job requirements.
            - "summary": A brief, 2-3 sentence summary explaining the score, highlighting the candidate's key strengths and weaknesses for this specific role.

            **Job Description:**
            - Title: ${job.jobTitle}
            - Experience Required: ${job.experience} years
            - Key Skills: ${job.skills.join(', ')}
            - Full Description: ${job.jobDescription}

            **Resume Content:**
            ${resumeText}

            **JSON Output:**
        `;

        // 4. Call the AI model
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 5. Clean and parse the JSON response from the AI
        const cleanedJsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysisResult = JSON.parse(cleanedJsonString);

        return analysisResult;

    } catch (error) {
        console.error('Error in Gemini analysis:', error);
        return null; // Return null if there's an error
    }
}

module.exports = { analyzeResume };