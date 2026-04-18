const logger = require('../utils/logger');

/**
 * Validates X-Internal-Secret header for worker → api-service calls.
 * This prevents random clients from directly injecting posture sessions.
 */
const internalAuthMiddleware = (req, res, next) => {
    const secret = req.headers['x-internal-secret'];
    if (!secret || secret !== process.env.INTERNAL_SECRET) {
        logger.warn('Unauthorized internal request blocked', { ip: req.ip, path: req.path });
        return res.status(403).json({ message: 'Forbidden: invalid internal secret' });
    }
    next();
};

module.exports = internalAuthMiddleware;
