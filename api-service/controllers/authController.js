const user =require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req,res) => {
    try {
        const {name,email,password} = req.body;
        const existingUser = await user.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
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
        console.error(error);
        res.status(500).json({message:error.message});
    }
}

const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        const existingUser = await user.findOne({email});
        if(!existingUser){
            return res.status(400).json({message:"Invalid credentials"});
        }   
        const isPasswordValid = await bcrypt.compare(password,existingUser.password);
        if(!isPasswordValid){
            return res.status(400).json({message:"Invalid credentials"});
        }
        const token =jwt.sign({
            userID:existingUser._id
        },process.env.JWT_SECRET,{expiresIn:"1h"});

        res.status(200).json({
            token,
            message:"Login successful",
        });
    } catch (error) {
        res.status(500).json({message:"Server error"});
    }
}
module.exports = {register,login};
