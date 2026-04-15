const amqp = require("amqplib");
const logger = require('./utils/logger');
const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(
            process.env.RABBITMQ_URL || "amqp://rabbitmq"
        );

        const channel = await connection.createChannel();

        const queue = "workoutQueue";

        await channel.assertQueue(queue, { durable: true });

        logger.info("Worker connected to RabbitMQ");
        logger.info("Waiting for messages...");

        channel.consume(queue, (msg) => {
            const data = JSON.parse(msg.content.toString());

            logger.info("Processing workout:", { data });

            channel.ack(msg);
        });

    } catch (error) {
        logger.error("Retrying RabbitMQ connection...", error);
        setTimeout(connectRabbitMQ, 5000);
    }
};

connectRabbitMQ();