require('dotenv').config();

const express = require('express');
const cors = require("cors");
const logger = require('./utils/logger');
const connectDB = require("./config/db");
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require("./routes/authRoutes");
const postureRoutes = require('./routes/postureRoutes');
const dietRoutes = require('./routes/dietRoutes');
const profileRoutes = require('./routes/profileRoutes');

const errorhandler = require('./middleware/errorMiddleware');

const app = express();

connectDB();

// ---- Global Middleware ----
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter); // Apply general rate limit to all /api routes


logger.info("Registering routes");
app.use("/api/auth", authRoutes);
app.use("/api/posture", postureRoutes);
app.use("/api/diet", dietRoutes);
app.use("/api/profile", profileRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the FitTrack API - Industry Edition!',
        status: 'Operational'
    });
});


app.use(errorhandler);
app.get("/api/auth/test", (req, res) => {
    res.send("Auth route working");
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});