const  workoutmodel =require("../models/workout");
const User = require("../models/user");
const { sendToQueue } = require("../services/queueProducer");
const addWorkout =async(req,res)=>{
    try {
        const {exercise, duration, caloriesBurned} = req.body;
        const workoutEntry = new workoutmodel({
            userId: req.user.userID,
            exercise,
            duration,
            caloriesBurned
        });
        await sendToQueue({
            userId: req.user.userID,
            exercise,
        });
        await workoutEntry.save();
        res.status(201).json({message:"Workout added successfully"});
    } catch (error) {
        res.status(500).json({message:error.message});

    }
}

const getWorkouts = async(req,res)=>{
    try {
        const workout = await workoutmodel.find({userId:req.user.userID});
        res.status(200).json(workout);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
}

const deleteWorkout = async(req,res)=>{
    try {
        const {id}=req.params;
        await workoutmodel.findByIdAndDelete(id);
        res.status(200).json({message:"Workout deleted successfully"});
    } catch (error) {
        res.status(500).json({message:error.message});
    }       

}

module.exports = {addWorkout,getWorkouts,deleteWorkout};