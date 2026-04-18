const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // ---- Profile / Onboarding Fields ----
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
    weight: { type: Number }, // in kg
    height: { type: Number }, // in cm
    activityLevel: { 
        type: String, 
        enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extra-active'] 
    },
    goals: [{ type: String }],
    healthConditions: [{ type: String }],
    onboardingCompleted: { type: Boolean, default: false }
},
{ timestamps: true }
);
const User = mongoose.model('User', userSchema);

module.exports = User;