const amqp = require("amqplib");

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(
            process.env.RABBITMQ_URL || "amqp://rabbitmq"
        );

        const channel = await connection.createChannel();

        const queue = "workoutQueue"; 

        await channel.assertQueue(queue, { durable: true });

        console.log("Worker connected to RabbitMQ");
        console.log("Waiting for messages...");

        channel.consume(queue, (msg) => {
            const data = JSON.parse(msg.content.toString());

            console.log("Processing workout:", data);

            channel.ack(msg);
        });

    } catch (error) {
        console.log("Retrying RabbitMQ connection...");
        setTimeout(connectRabbitMQ, 5000);
    }
};

connectRabbitMQ();