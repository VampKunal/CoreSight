const mongoose = require('mongoose');
const workoutSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exercise:{
        type: String,
        required: true
    },
    duration:{
        type: Number,
        required: true
    },
    caloriesBurned:{
        type: Number,
        required: true
    }
});
module.exports = mongoose.model('Workout', workoutSchema);
