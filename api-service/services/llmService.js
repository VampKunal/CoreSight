const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';

const getModel = (modelName, temperature) => genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json", temperature }
});

const generateJsonWithFallback = async (prompt, temperature, label) => {
    const models = [...new Set([GEMINI_MODEL, GEMINI_FALLBACK_MODEL])];
    let lastError;

    for (const modelName of models) {
        try {
            const result = await getModel(modelName, temperature).generateContent(prompt);
            return JSON.parse(result.response.text());
        } catch (err) {
            lastError = err;
            logger.error(`${label} failed`, { model: modelName, error: err.message });
        }
    }

    throw lastError;
};

/**
 * Given a list of posture issues, return targeted correction suggestions.
 * Includes user context (age/weight) if available for safer advice.
 */
const getPostureSuggestions = async (issues, exercise = 'general', userProfile = {}) => {
    if (!issues || issues.length === 0) return ['Great posture! Keep it up.'];

    const context = userProfile.age ? `(User: ${userProfile.age}yo, ${userProfile.weight}kg)` : '';
    
    const prompt = `You are a professional fitness coach specializing in kinesiology. ${context}
A user performing "${exercise}" has the following posture issues:
${issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Provide ${issues.length} professional, actionable correction tips. 
Focus on:
1. Exact body adjustment.
2. The "Why" (anatomical benefit).
3. A safety cue.

Keep each tip under 3 sentences. Return ONLY a JSON array of strings.`;

    try {
        const raw = await generateJsonWithFallback(prompt, 0.4, 'LLM posture suggestion');
        return Array.isArray(raw) ? raw : (Array.isArray(raw.suggestions) ? raw.suggestions : Object.values(raw));
    } catch (err) {
        logger.error('LLM posture suggestion failed', { error: err.message });
        return ['Unable to generate detailed suggestions. Focus on keeping your spine neutral and movements slow.'];
    }
};

/**
 * Generate a structured meal plan using the user's full health profile.
 */
const generateDietPlan = async (userProfile) => {
    const { goals, healthConditions, weight, height, activityLevel, age, gender } = userProfile;
    
    const prompt = `You are a clinical nutritionist designing a daily plan for:
- Profile: ${age}yo ${gender}, ${weight}kg, ${height}cm
- Activity Level: ${activityLevel}
- Goals: ${goals.join(', ')}
- Medical/Dietary Conditions: ${healthConditions.join(', ') || 'None reported'}

INSTRUCTIONS:
1. Calculate a safe calorie target based on the above.
2. Design a 4-meal plan that respects ALL health conditions.
3. If a medical condition exists (like hypertension or diabetes), prioritize safety over weight goals.

Return a JSON object with:
- "calories": Target daily total
- "meals": Array of 4 objects (Breakfast, Lunch, Snack, Dinner). 
  Each meal: name (string), calories (number), protein (g), carbs (g), fat (g), time (string), notes (string - explain why this fits their specific goal/condition).`;

    try {
        const raw = await generateJsonWithFallback(prompt, 0.5, 'LLM diet plan generation');
        
        // Return structured object
        return {
            targetCalories: raw.calories,
            meals: raw.meals
        };
    } catch (err) {
        logger.error('LLM diet plan generation failed', { error: err.message });
        throw new Error('Failed to generate personalized diet plan');
    }
};

module.exports = { getPostureSuggestions, generateDietPlan };
