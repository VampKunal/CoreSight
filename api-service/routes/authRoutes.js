console.log("auth routes loaded");

const express = require('express');
const router =express.Router();
const {register,login} = require('../controllers/authController');
const { body } = require('express-validator');
router.post('/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    register);
router.post('/login',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        
    ],
    login);

module.exports = router;