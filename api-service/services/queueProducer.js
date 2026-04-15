const amqp = require('amqplib');
const logger = require('../utils/logger');
let channel;
const connnectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
        channel = await connection.createChannel();
        await channel.assertQueue('workoutQueue', { durable: true });
        logger.info('Connected to RabbitMQ');
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ', error);
    }
};

const sendToQueue = async (data) => {
    if (!channel) {
        logger.error('RabbitMQ channel is not established');
        return;
    }
    channel.sendToQueue('workoutQueue', Buffer.from(JSON.stringify(data)), { persistent: true });
    logger.info('Data sent to workoutQueue:', data);
};
module.exports = {
    connnectRabbitMQ,
    sendToQueue
};