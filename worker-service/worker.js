const amqp = require("amqplib");
const axios = require("axios");
const logger = require('./utils/logger');

const API_SERVICE_URL = process.env.API_SERVICE_URL || "http://api-service:5000";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(
            process.env.RABBITMQ_URL || "amqp://rabbitmq"
        );

        const channel = await connection.createChannel();

        // ── Posture Queue (new) ──────────────────────────────────────────────
        const postureQueue = "postureQueue";
        await channel.assertQueue(postureQueue, { durable: true });
        logger.info("Worker listening on postureQueue");

        channel.consume(postureQueue, async (msg) => {
            if (!msg) return;
            try {
                const data = JSON.parse(msg.content.toString());
                logger.info("Received posture result", { sessionId: data.sessionId, score: data.score });

                await axios.post(
                    `${API_SERVICE_URL}/api/posture/ingest`,
                    data,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "x-internal-secret": INTERNAL_SECRET,
                        },
                        timeout: 10000,
                    }
                );

                logger.info("Posture session forwarded to api-service", { sessionId: data.sessionId });
                channel.ack(msg);
            } catch (err) {
                logger.error("Error forwarding postureQueue message", { error: err.message });
                // Nack with requeue=true so it retries once
                channel.nack(msg, false, true);
            }
        });

    } catch (error) {
        logger.error("RabbitMQ connection failed, retrying in 5s...", { error: error.message });
        setTimeout(connectRabbitMQ, 5000);
    }
};

connectRabbitMQ();