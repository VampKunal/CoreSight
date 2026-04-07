console.log('Server is starting...');

require('dotenv').config();

const express = require('express');
const cors = require("cors");

const connectDB = require("./config/db");
const { connnectRabbitMQ } = require('./services/queueProducer');

const authRoutes = require("./routes/authRoutes");
const testRoutes = require('./routes/testRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');

const errorhandler = require('./middleware/errorMiddleware');

const app = express();

// 🔹 connect DB + RabbitMQ
connectDB();
connnectRabbitMQ();

// 🔹 middleware (ORDER MATTERS)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 routes
console.log("Registering /api/auth routes");
app.use("/api/auth", authRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/test", testRoutes);
app.use("/api/workouts", workoutRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the FitTrack API!' });
});

// 🔹 ERROR HANDLER MUST BE LAST
app.use(errorhandler);
app.get("/api/auth/test", (req, res) => {
    res.send("Auth route working");
});
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});