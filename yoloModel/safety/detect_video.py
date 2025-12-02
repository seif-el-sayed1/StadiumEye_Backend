import sys
import json
import os
import io
import logging
from ultralytics import YOLO

logging.getLogger("ultralytics").setLevel(logging.ERROR)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "yolo_model.pt")
model = YOLO(model_path)

input_path = sys.argv[1]

old_stdout = sys.stdout
sys.stdout = io.StringIO()

results = model.predict(source=input_path, verbose=False, show=False)

sys.stdout = old_stdout

allowed_classes = [
    "NO-Gloves",
    "NO-Goggles",
    "NO-Hardhat",
    "NO-Mask",
    "NO-Safety Vest",
    "Fall-Detected"
]

detection_data = []

boxes = results[0].boxes
if boxes is not None:
    for i in range(len(boxes)):
        cls = int(boxes.cls[i].item())
        conf = float(boxes.conf[i].item())
        x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy()
        width = float(x2 - x1)
        height = float(y2 - y1)
        class_name = allowed_classes[cls] if cls < len(allowed_classes) else str(cls)

        detection_data.append({
            "Id": cls,
            "ClassName": class_name,
            "confidence": round(conf, 2),
            "x": round(float(x1)),
            "y": round(float(y1)),
            "width": round(width),
            "height": round(height)
        })

print(json.dumps(detection_data))
sys.stdout.flush()
