import math
import mediapipe as mp
import numpy as np
import cv2

mp_pose = mp.solutions.pose

def _angle(a, b, c):
    """Compute angle at point b given three (x,y) coords."""
    ba = (a[0] - b[0], a[1] - b[1])
    bc = (c[0] - b[0], c[1] - b[1])
    cos = (ba[0]*bc[0] + ba[1]*bc[1]) / (
        (math.hypot(*ba) * math.hypot(*bc)) + 1e-6
    )
    return math.degrees(math.acos(max(-1.0, min(1.0, cos))))

def _lm(landmarks, idx):
    """Return (x, y) for a landmark index."""
    l = landmarks[idx]
    return (l.x, l.y)

def analyze(frame_bytes: bytes) -> dict:
    """
    Analyze a single JPEG/PNG frame.
    Returns a dict with landmarks, angles, score, issues.
    """
    nparr = np.frombuffer(frame_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "Could not decode image", "score": 0, "issues": ["Invalid frame"]}

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    with mp_pose.Pose(
        static_image_mode=True,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5
    ) as pose:
        results = pose.process(img_rgb)

    if not results.pose_landmarks:
        return {"error": "No person detected", "score": 0, "issues": ["No person detected in frame"]}

    lm = results.pose_landmarks.landmark

    # ---- Key angles ----
    # Neck tilt: ear → shoulder → hip
    neck_angle = _angle(_lm(lm, 7), _lm(lm, 11), _lm(lm, 23))   # left side
    # Spine: shoulder → hip → knee
    spine_angle = _angle(_lm(lm, 11), _lm(lm, 23), _lm(lm, 25))
    # Left knee
    left_knee_angle = _angle(_lm(lm, 23), _lm(lm, 25), _lm(lm, 27))
    # Right knee
    right_knee_angle = _angle(_lm(lm, 24), _lm(lm, 26), _lm(lm, 28))
    # Shoulder alignment (horizontal symmetry)
    shoulder_diff = abs(_lm(lm, 11)[1] - _lm(lm, 12)[1])

    angles = {
        "neck_tilt": round(neck_angle, 2),
        "spine": round(spine_angle, 2),
        "left_knee": round(left_knee_angle, 2),
        "right_knee": round(right_knee_angle, 2),
        "shoulder_diff": round(shoulder_diff, 4),
    }

    # ---- Scoring & Issues ----
    issues = []
    score = 100

    if neck_angle < 150:
        issues.append("Head is tilted forward — bring chin back")
        score -= 15
    if spine_angle < 160:
        issues.append("Spine is bent — straighten your back")
        score -= 20
    if left_knee_angle < 160 or right_knee_angle < 160:
        issues.append("Knees are bent more than expected — extend legs")
        score -= 10
    if shoulder_diff > 0.05:
        issues.append("Shoulders are uneven — level both shoulders")
        score -= 10

    score = max(0, score)

    # ---- Landmarks as list ----
    landmarks = [
        {"index": i, "x": round(l.x, 4), "y": round(l.y, 4), "z": round(l.z, 4), "visibility": round(l.visibility, 4)}
        for i, l in enumerate(lm)
    ]

    return {
        "score": score,
        "angles": angles,
        "issues": issues,
        "landmarks": landmarks,
    }
