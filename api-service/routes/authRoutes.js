console.log("auth routes loaded");

const express = require('express');
const router =express.Router();
const {register, login, refreshToken} = require('../controllers/authController');
const { body } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register',
    authLimiter,
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    register);
router.post('/login',
    authLimiter,
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        
    ],
    login);

router.post('/refresh', refreshToken);

module.exports = router;