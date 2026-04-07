const amqp = require('amqplib');
let channel;
const connnectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
        channel = await connection.createChannel();
        await channel.assertQueue('workoutQueue', { durable: true });
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ', error);
    }
};

const sendToQueue = async (data) => {
    if (!channel) {
        console.error('RabbitMQ channel is not established');
        return;
    }
    channel.sendToQueue('workoutQueue', Buffer.from(JSON.stringify(data)), { persistent: true });
    console.log('Data sent to workoutQueue:', data);
};
module.exports = {
    connnectRabbitMQ,
    sendToQueue
};