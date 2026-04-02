const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {getExerciseData} = require('../services/exerciseService');
router.get('/', async (req, res) => {
    try {
        const {q}=req.query;
        const data =await getExerciseData(q);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;

