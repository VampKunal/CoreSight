const mongoose = require('mongoose');

const postureSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        sessionId: {
            type: String,
            required: true,
            unique: true,
        },
        exercise: {
            type: String,
            default: 'general',
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        angles: {
            neck_tilt: Number,
            spine: Number,
            left_knee: Number,
            right_knee: Number,
            shoulder_diff: Number,
        },
        issues: [String],
        suggestions: [String],   // LLM-generated corrections
        landmarks: { type: mongoose.Schema.Types.Mixed }, // raw mediapipe data
    },
    { timestamps: true }
);

module.exports = mongoose.model('PostureSession', postureSessionSchema);
