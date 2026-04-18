import json
import os
import pika
import logging

logger = logging.getLogger("queue_publisher")

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://localhost")
QUEUE_NAME = "postureQueue"

def publish(result: dict):
    """Publish a posture analysis result to RabbitMQ."""
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        channel.basic_publish(
            exchange="",
            routing_key=QUEUE_NAME,
            body=json.dumps(result),
            properties=pika.BasicProperties(
                delivery_mode=2,  # persistent
                content_type="application/json",
            ),
        )
        connection.close()
        logger.info(f"Published posture result to {QUEUE_NAME} (score={result.get('score')})")
    except Exception as e:
        logger.error(f"Failed to publish to RabbitMQ: {e}")
        raise
