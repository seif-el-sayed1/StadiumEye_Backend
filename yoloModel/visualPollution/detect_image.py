import sys
import json
from ultralytics import YOLO
import os
import torch
from ultralytics.nn.tasks import DetectionModel  

# Add DetectionModel and Sequential to safe globals
torch.serialization.add_safe_globals([DetectionModel, torch.nn.modules.container.Sequential])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "yolo_model.pt")
model = YOLO(model_path)

input_path = sys.argv[1]

results = model(input_path, verbose=False)

allowed_classes = [
    "GRAFFITI",
    "FADED_SIGNAGE",
    "POTHOLES",
    "GARBAGE",
    "CONSTRUCTION_ROAD",
    "BROKEN_SIGNAGE",
    "BAD_STREETLIGHT",
    "BAD_BILLBOARD",
    "SAND_ON_ROAD",
    "CLUTTER_SIDEWALK",
    "UNKEPT_FACADE"
]

detection_data = []
boxes = results[0].boxes
if boxes is not None:
    for box in boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()  
        width = float(x2 - x1)
        height = float(y2 - y1)
        class_name = allowed_classes[cls]

        if class_name in allowed_classes:
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
