from ultralytics import YOLO
import cv2, os, sys, json
from collections import defaultdict
import torch
from ultralytics.nn.tasks import DetectionModel  

# Add DetectionModel to safe globals
torch.serialization.add_safe_globals([DetectionModel])

# Video input
input_path = sys.argv[1]

# Optional: output JSON path
output_path = sys.argv[2] if len(sys.argv) > 2 else None

# Load YOLO model
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "yolo_model.pt")
model = YOLO(MODEL_PATH)

# Open video
cap = cv2.VideoCapture(input_path)
if not cap.isOpened():
    sys.stderr.write("Error opening video\n")
    sys.exit(1)

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

# Class names
class_names = [
    "Fall-Detected","Gloves","Goggles","Hardhat","Ladder",
    "Mask","NO-Gloves","NO-Goggles","NO-Hardhat","NO-Mask",
    "NO-Safety Vest","Person","Safety Cone","Safety Vest"
]

summary = defaultdict(list)

# Process each frame individually
while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, verbose=False, save=False, save_txt=False)

    boxes = results[0].boxes
    for box in boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        xyxy = box.xyxy[0].cpu().numpy().astype(int)
        x1, y1, x2, y2 = xyxy

        summary[cls].append((conf, class_names[cls], x1, y1, x2, y2))

cap.release()

# Prepare JSON output
data = []
for cls, lst in summary.items():
    avg_conf = round(sum(conf for conf, *_ in lst) / len(lst), 2)
    _, _, x1, y1, x2, y2 = lst[-1]
    data.append({
        "Id": cls,
        "ClassName": class_names[cls],
        "confidence": avg_conf,
        "x": int(x1),
        "y": int(y1),
        "width": int(x2 - x1),
        "height": int(y2 - y1)
    })

# Save JSON if path provided
if output_path:
    with open(output_path, "w") as f:
        json.dump(data, f)

# Print JSON for Node.js to capture
print(json.dumps(data))
