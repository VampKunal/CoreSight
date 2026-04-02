const axios = require('axios');
const redisClient = require('../config/redisClient');
const getExerciseData = async (query) => {
    try {
        const cacheKey = `exercise:${query}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('Returning cached data');
            return JSON.parse(cachedData);
        }
       console.log('cache miss, fetching from API');

       const response ={
        data:[
            {
                name:"Push Up",
                targetMuscle:"Chest",},
                {
                name:"Squat",
                targetMuscle:"Legs",
                }
        ]
       };
       await redisClient.set(cacheKey, JSON.stringify(response.data), {EX: 3600});
       return response.data;


    } catch (error) {
            console.error('Error fetching exercise data:', error);
            throw error;

    }
}

module.exports = {getExerciseData};