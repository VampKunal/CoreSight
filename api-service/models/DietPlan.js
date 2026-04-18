const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    name: String,
    calories: Number,
    protein: Number,   // grams
    carbs: Number,
    fat: Number,
    time: String,      // e.g. "Breakfast", "Lunch", "Snack", "Dinner"
});

const dietPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        goal: {
            type: String,
            required: true,  // e.g. "weight loss", "muscle gain", "maintenance"
        },
        targetCalories: Number,
        preferences: [String],   // e.g. ["vegetarian", "no gluten"]
        meals: [mealSchema],
        generatedBy: {
            type: String,
            enum: ['llm', 'manual'],
            default: 'llm',
        },
        notes: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('DietPlan', dietPlanSchema);
