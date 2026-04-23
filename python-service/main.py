import base64
import logging
import os
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
import tempfile
import cv2
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
    landmarks: list[dict] = []


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
        landmarks=result.get("landmarks", []),
    )

@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...), userId: str = "guest", exercise: str = "general"):
    contents = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp:
        temp.write(contents)
        temp_path = temp.name
        
    cap = cv2.VideoCapture(temp_path)
    issues_set = set()
    total_score = 0
    frame_count = 0
    valid_frames = 0
    sampled_frames = []
    latest_angles = {}
    latest_landmarks = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        if frame_count % 10 != 0: # Process 1 frame every 10 frames
            continue
            
        _, buffer = cv2.imencode('.jpg', frame)
        result = pose_analyzer.analyze(buffer.tobytes())
        
        if not result.get("error"):
            total_score += result.get("score", 0)
            issues_set.update(result.get("issues", []))
            valid_frames += 1
            latest_angles = result.get("angles", {})
            latest_landmarks = result.get("landmarks", [])
            sampled_frames.append({
                "frame": frame_count,
                "score": result.get("score", 0),
                "issues": result.get("issues", []),
                "angles": result.get("angles", {}),
                "landmarks": result.get("landmarks", [])
            })
            
    cap.release()
    os.remove(temp_path)
    
    if valid_frames == 0:
        return {"sessionId": str(uuid.uuid4()), "score": 0, "issues": ["Could not process video or no person detected"], "angles": {}, "landmarks": [], "frames": [], "queued": False}
        
    avg_score = int(total_score / valid_frames)
    
    return {
        "sessionId": str(uuid.uuid4()),
        "score": avg_score,
        "issues": list(issues_set),
        "angles": latest_angles,
        "landmarks": latest_landmarks,
        "frames": sampled_frames[-12:],
        "queued": False
    }

@app.websocket("/ws/analyze")
async def ws_analyze(websocket: WebSocket, userId: str, exercise: str = "general"):
    """
    WebSocket endpoint for real-time live camera analysis from the React Native app.
    Accepts text messages containing base64 frames and returns JSON analysis instantly.
    """
    await websocket.accept()
    logger.info(f"WebSocket connected for user {userId}, exercise {exercise}")
    
    session_id = str(uuid.uuid4())
    
    try:
        while True:
            # Receive base64 frame from client
            frame_b64 = await websocket.receive_text()
            
            try:
                frame_bytes = base64.b64decode(frame_b64)
            except Exception:
                await websocket.send_json({"error": "Invalid base64 frame"})
                continue
                
            # Analyze frame
            result = pose_analyzer.analyze(frame_bytes)
            
            # Send immediate feedback to client for the UI
            response = {
                "sessionId": session_id,
                "score": result.get("score", 0),
                "issues": result.get("issues", []),
                "angles": result.get("angles", {}),
                "landmarks": result.get("landmarks", []),
                "error": result.get("error", None)
            }
            await websocket.send_json(response)
            
            # Process and queue in background if there's a valid pose
            if not result.get("error"):
                payload = {
                    "sessionId": session_id,
                    "userId": userId,
                    "exercise": exercise,
                    **result
                }
                # To prevent flooding RabbitMQ, we could add a throttle here, 
                # but for now we publish every processed frame.
                try:
                    queue_publisher.publish(payload)
                except Exception as e:
                    logger.error(f"WebSocket queue publish failed: {e}")
                    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {userId}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass
