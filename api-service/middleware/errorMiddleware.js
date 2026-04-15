const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
    logger.error(err.message, { 
        stack: err.stack ,
        path : req.path,
        method : req.method,
        body : req.body
    });
    res.status(err.status||500).json({ message: err.message || 'Internal Server Error' });  

};

module.exports = errorMiddleware;