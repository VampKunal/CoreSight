const amqp = require("amqplib");

const startWorker = async () => {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue("workout_queue");

    console.log("Worker started, waiting for messages...");

    channel.consume("workout_queue", (msg) => {
        const data = JSON.parse(msg.content.toString());

        console.log("Processing workout:", data);

        channel.ack(msg);
    });
};

startWorker();