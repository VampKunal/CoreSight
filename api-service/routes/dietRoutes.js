const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { llmLimiter } = require('../middleware/rateLimiter');
const {
    generatePlan,
    getDietPlans,
    updateDietPlan,
    deleteDietPlan,
} = require('../controllers/dietController');

// Rate-limit diet generation (calls LLM)
router.post('/generate', authMiddleware, llmLimiter, generatePlan);
router.get('/', authMiddleware, getDietPlans);
router.patch('/:id', authMiddleware, updateDietPlan);
router.delete('/:id', authMiddleware, deleteDietPlan);

module.exports = router;
