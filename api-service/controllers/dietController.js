const DietPlan = require('../models/DietPlan');
const { generateDietPlan } = require('../services/llmService');
const logger = require('../utils/logger');

const User = require('../models/user');

/**
 * POST /api/diet/generate  (auth required)
 * Calls LLM and saves new diet plan based on user profile.
 */
const generatePlan = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userID);
        
        if (!user || !user.onboardingCompleted) {
            return res.status(403).json({ 
                message: 'Please complete your onboarding profile before generating a diet plan.',
                onboardingRequired: true
            });
        }

        const { targetCalories, meals } = await generateDietPlan(user);

        const plan = new DietPlan({
            userId: req.user.userID,
            goal: user.goals.join(', '),
            targetCalories,
            preferences: user.healthConditions || [],
            meals,
            generatedBy: 'llm',
        });

        await plan.save();
        logger.info('Personalized DietPlan generated', { userId: req.user.userID });

        res.status(201).json(plan);
    } catch (error) {
        next(error);
    }
};


/**
 * GET /api/diet/  (auth required, paginated)
 */
const getDietPlans = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(20, parseInt(req.query.limit) || 5);
        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            DietPlan.find({ userId: req.user.userID })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            DietPlan.countDocuments({ userId: req.user.userID }),
        ]);

        res.status(200).json({
            data: plans,
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
 * PATCH /api/diet/:id  (auth required)
 * Allow user to manually edit notes or meal details.
 */
const updateDietPlan = async (req, res, next) => {
    try {
        const plan = await DietPlan.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userID },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!plan) return res.status(404).json({ message: 'Diet plan not found' });
        res.status(200).json(plan);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/diet/:id  (auth required)
 */
const deleteDietPlan = async (req, res, next) => {
    try {
        const plan = await DietPlan.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userID,
        });
        if (!plan) return res.status(404).json({ message: 'Diet plan not found' });
        res.status(200).json({ message: 'Diet plan deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { generatePlan, getDietPlans, updateDietPlan, deleteDietPlan };
