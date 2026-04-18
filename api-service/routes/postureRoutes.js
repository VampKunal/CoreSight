const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const internalAuthMiddleware = require('../middleware/internalAuthMiddleware');
const {
    ingestSession,
    getSessions,
    getLatestSession,
    getSessionById,
} = require('../controllers/postureController');

// Called by worker-service only (internal secret required)
router.post('/ingest', internalAuthMiddleware, ingestSession);

// User-facing endpoints (JWT required)
router.get('/sessions', authMiddleware, getSessions);
router.get('/latest', authMiddleware, getLatestSession);
router.get('/sessions/:id', authMiddleware, getSessionById);

module.exports = router;
