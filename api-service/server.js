console.log('Server is starting...');

require('dotenv').config();

const express = require('express');
const cors = require("cors");
const testRoutes = require('./routes/testRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const connectDB = require("./config/db");
const authRoutes =require("./routes/authRoutes");;
const exerciseRoutes = require('./routes/exerciseRoutes');
const { connnectRabbitMQ } = require('./services/queueProducer');

const app = express();

connectDB();

app.use(cors());
connnectRabbitMQ();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/exercises", exerciseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/workouts', workoutRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the FitTrack API!' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});