const express = require('express');
const router = express.Router();
const { getProfile, updateOnboarding, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getProfile);
router.post('/onboarding', protect, updateOnboarding);
router.patch('/update', protect, updateProfile);

module.exports = router;
