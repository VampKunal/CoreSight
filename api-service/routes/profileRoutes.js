const express = require('express');
const router = express.Router();
const { getProfile, updateOnboarding, updateProfile } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, getProfile);
router.post('/onboarding', authMiddleware, updateOnboarding);
router.patch('/update', authMiddleware, updateProfile);

module.exports = router;
