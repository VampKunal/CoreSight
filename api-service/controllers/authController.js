const user =require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {validationResult} = require('express-validator');


const register = async (req,res,next) => {
    try {
        const err = validationResult(req);
        if(!err.isEmpty()){
            const errormsg=new Error("Validation error");
            errormsg.status=400;
            errormsg.details=err.array();
            next(errormsg);
        }
        const {name,email,password} = req.body;
        const existingUser = await user.findOne({email});
        if(existingUser){
            const errormsg = new Error("Email already in use");
            errormsg.status=400;
            return next(errormsg);
        }
        const hashedPassword= await bcrypt.hash(password,10);
        const newUser= new user({
            name,
            email,
            password:hashedPassword
        });
        await newUser.save();
        res.status(201).json({message:"User registered successfully"});
    } catch (error) {
        next(error);
    }
}

const login = async (req,res,next)=>{
    try {
        const err = validationResult(req);
        if(!err.isEmpty()){
            const errormsg=new Error("Validation error");
            errormsg.status=400;
            errormsg.details=err.array();
            return next(errormsg);
        }
        const {email,password} = req.body;
        const existingUser = await user.findOne({email});
        if(!existingUser){
            const errormsg = new Error("Invalid credentials");
            errormsg.status = 400;
            return next(errormsg);
        }
        const isPasswordValid = await bcrypt.compare(password,existingUser.password);
        if(!isPasswordValid){
            const errormsg = new Error("Invalid credentials");
            errormsg.status = 400;
            return next(errormsg);
        }
        const token =jwt.sign({
            userID:existingUser._id
        },process.env.JWT_SECRET,{expiresIn:"1h"});

        res.status(200).json({
            token,
            message:"Login successful",
        });
    } catch (error) {
        next(error);
    }
}
module.exports = {register,login};
