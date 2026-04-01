const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {addWorkout, getWorkouts,deleteWorkout} = require('../controllers/workoutController');

router.post('/add', authMiddleware, addWorkout);
router.get('/all', authMiddleware, getWorkouts);
router.delete('/delete/:id', authMiddleware, deleteWorkout);
module.exports = router;