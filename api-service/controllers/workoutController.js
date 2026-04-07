const  workoutmodel =require("../models/workout");
const User = require("../models/user");
const { sendToQueue } = require("../services/queueProducer");
const addWorkout =async(req,res,next)=>{
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
        next(error);
    }
}

const getWorkouts = async(req,res,next)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const workouts = await workoutmodel.find({userId:req.user.userID}).skip(skip).limit(limit);
        res.status(200).json(workouts);
    } catch (error) {
        next(error);
    }
}

const deleteWorkout = async(req,res,next)=>{
    try {
        const {id}=req.params;
        await workoutmodel.findByIdAndDelete(id);
        res.status(200).json({message:"Workout deleted successfully"});
    } catch (error) {
        next(error);
    }       

}

module.exports = {addWorkout,getWorkouts,deleteWorkout};