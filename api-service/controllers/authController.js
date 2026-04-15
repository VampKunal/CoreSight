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

const generateAccessToken = (userID) => {
    return jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userID) => {
    return jwt.sign({ userID }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const login = async (req, res, next) => {
    try {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            const errormsg = new Error("Validation error");
            errormsg.status = 400;
            errormsg.details = err.array();
            return next(errormsg);
        }
        const { email, password } = req.body;
        const existingUser = await user.findOne({ email });
        if (!existingUser) {
            const errormsg = new Error("Invalid credentials");
            errormsg.status = 400;
            return next(errormsg);
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            const errormsg = new Error("Invalid credentials");
            errormsg.status = 400;
            return next(errormsg);
        }

        const accessToken = generateAccessToken(existingUser._id);
        const refreshToken = generateRefreshToken(existingUser._id);

        res.status(200).json({
            accessToken,
            refreshToken,
            message: "Login successful",
        });
    } catch (error) {
        next(error);
    }
}

const refreshToken = async (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        const err = new Error("Refresh token required");
        err.status = 401;
        return next(err);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = generateAccessToken(decoded.userID);
        const newRefreshToken = generateRefreshToken(decoded.userID);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        const err = new Error("Invalid refresh token");
        err.status = 403;
        next(err);
    }
}

module.exports = { register, login, refreshToken };
