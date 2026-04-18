const rateLimit = require('express-rate-limit');

// Auth routes: Protect against brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 attempts per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login/register attempts. Please try again later.' }
});

// General API: Prevent excessive scraping or abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // 300 reqs per 15 mins (very generous)
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'General API limit reached. Slow down a bit!' }
});

// LLM endpoints: Protect costs (Gemini generation)
const llmLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 generations per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'AI generation limit reached for this hour. Grab a water and try again soon!' }
});

module.exports = { authLimiter, apiLimiter, llmLimiter };

