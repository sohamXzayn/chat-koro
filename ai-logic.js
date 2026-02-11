// ai-logic.js

export async function getSmartSummary(messages) {
    if (!messages || messages.length === 0) return null;

    // 1. Filter out noise for a cleaner summary
    const cleanHistory = messages
        .filter(m => !m.includes('Missed voice call') && !m.includes('Declined voice call'))
        .join('\n');

    // 2. API Config
    const API_KEY = "PRIVATE_API_KEY"; 
    // Using the gemma-3-27b (or gemma-2 depending on your tier availability)
    const MODEL = "gemma-3-27b-it"; 
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    // 3. Instruction Prompt
    const prompt = `
    You are a helpful assistant integrated into a chat app. 
    Below is a chat transcript. Summarize what has happened so far in a friendly tone using 3 short bullet points.
    
    TRANSCRIPT:
    ${cleanHistory}`;

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            // Fallback to Gemini 1.5 Flash if Gemma 3 model ID is restricted on your tier
            console.warn("Gemma 3 specific model busy, trying Flash fallback...");
            return await getFallbackSummary(cleanHistory, API_KEY);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
        
    } catch (err) {
        console.error("AI Error:", err);
        return "Gemma is resting. Try again in a moment!";
    }
}

// Fallback function to ensure the UI never stays "loading"
async function getFallbackSummary(history, key) {
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "Summarize this chat:\n" + history }] }]
        })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

}
