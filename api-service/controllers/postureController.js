const PostureSession = require('../models/PostureSession');
const { getPostureSuggestions } = require('../services/llmService');
const logger = require('../utils/logger');

const User = require('../models/user');

/**
 * POST /api/posture/ingest  (internal: called only by worker-service)
 * Receives posture analysis from the worker, calls LLM, saves to MongoDB.
 */
const ingestSession = async (req, res, next) => {
    try {
        const { sessionId, userId, exercise, score, angles, issues, landmarks } = req.body;

        // Fetch user context for better suggestions
        const user = await User.findById(userId);
        const userProfile = user ? { 
            age: user.age, 
            weight: user.weight, 
            healthConditions: user.healthConditions 
        } : {};

        // Call LLM for human-readable suggestions
        const suggestions = await getPostureSuggestions(issues, exercise, userProfile);

        const session = new PostureSession({
            sessionId,
            userId,
            exercise,
            score,
            angles,
            issues,
            suggestions,
            landmarks,
        });

        await session.save();
        logger.info('PostureSession saved with personalized suggestions', { sessionId, userId, score });

        res.status(201).json({ message: 'Session saved', sessionId });
    } catch (error) {
        next(error);
    }
};


/**
 * GET /api/posture/sessions  (auth required, paginated)
 */
const getSessions = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const [sessions, total] = await Promise.all([
            PostureSession.find({ userId: req.user.userID })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-landmarks'), // exclude heavy landmark data from list view
            PostureSession.countDocuments({ userId: req.user.userID }),
        ]);

        res.status(200).json({
            data: sessions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/posture/latest  (auth required)
 */
const getLatestSession = async (req, res, next) => {
    try {
        const session = await PostureSession.findOne({ userId: req.user.userID })
            .sort({ createdAt: -1 })
            .select('-landmarks');

        if (!session) {
            return res.status(404).json({ message: 'No posture sessions found' });
        }
        res.status(200).json(session);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/posture/sessions/:id  (auth required, includes full landmarks)
 */
const getSessionById = async (req, res, next) => {
    try {
        const session = await PostureSession.findOne({
            _id: req.params.id,
            userId: req.user.userID,
        });
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.status(200).json(session);
    } catch (error) {
        next(error);
    }
};

module.exports = { ingestSession, getSessions, getLatestSession, getSessionById };
