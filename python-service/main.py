import base64
import logging
import os
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

import pose_analyzer
import queue_publisher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("python-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Python posture service started")
    yield
    logger.info("Python posture service shutting down")


app = FastAPI(title="FitTrack Python Posture Service", lifespan=lifespan)


class AnalyzeRequest(BaseModel):
    frame: str          # base64-encoded image (JPEG/PNG)
    userId: str
    exercise: str = "general"


class AnalyzeResponse(BaseModel):
    sessionId: str
    score: int
    issues: list[str]
    angles: dict
    queued: bool


@app.get("/health")
def health():
    return {"status": "ok", "service": "python-posture"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    """
    Accept a base64 frame, run MediaPipe posture analysis,
    then publish result to RabbitMQ postureQueue.
    """
    try:
        frame_bytes = base64.b64decode(req.frame)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 frame")

    result = pose_analyzer.analyze(frame_bytes)

    if "error" in result and result["score"] == 0:
        raise HTTPException(status_code=422, detail=result["error"])

    session_id = str(uuid.uuid4())
    payload = {
        "sessionId": session_id,
        "userId": req.userId,
        "exercise": req.exercise,
        **result,
    }

    queued = True
    try:
        queue_publisher.publish(payload)
    except Exception as e:
        logger.error(f"Queue publish failed: {e}")
        queued = False

    return AnalyzeResponse(
        sessionId=session_id,
        score=result["score"],
        issues=result["issues"],
        angles=result["angles"],
        queued=queued,
    )
