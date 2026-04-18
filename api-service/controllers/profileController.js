const User = require('../models/user');
const logger = require('../utils/logger');

/**
 * GET /api/profile/me
 * Fetches the current user's profile information.
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userID).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/profile/onboarding
 * Processes the initial questionnaire and marks onboarding as completed.
 */
const updateOnboarding = async (req, res, next) => {
    try {
        const { age, gender, weight, height, activityLevel, goals, healthConditions } = req.body;

        // Validation (basic)
        if (!age || !weight || !height || !activityLevel) {
            return res.status(400).json({ message: 'All basic metrics (age, weight, height, activityLevel) are required.' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userID,
            {
                age,
                gender,
                weight,
                height,
                activityLevel,
                goals: goals || [],
                healthConditions: healthConditions || [],
                onboardingCompleted: true
            },
            { new: true, runValidators: true }
        ).select('-password');

        logger.info('User completed onboarding', { userId: req.user.userID });
        res.status(200).json({
            message: 'Onboarding completed successfully!',
            user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/profile/update
 * General profile update for subsequent changes.
 */
const updateProfile = async (req, res, next) => {
    try {
        const updates = req.body;
        // Don't allow password updates through this endpoint
        delete updates.password;
        delete updates.email;

        const user = await User.findByIdAndUpdate(
            req.user.userID,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile, updateOnboarding, updateProfile };
