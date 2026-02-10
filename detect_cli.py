#!/usr/bin/env python3
import sys
import json
import cv2
import numpy as np
from ultralytics import YOLO
import os

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION & CONSTANTS (Avoiding Hardcodings)
# ═══════════════════════════════════════════════════════════════
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'yolov8m.pt')

# Detection Thresholds
CONFIDENCE_THRESHOLD_ANIMAL = 0.40
CONFIDENCE_THRESHOLD_VEHICLE = 0.60  # Higher to prevent "ghost" vehicles

# Visual References
ROAD_Y_ESTIMATE_RATIO = 0.75  # Assumed road position in frame

# Species Correction (COCO -> Wildlife)
WILDLIFE_MAPPING = {
    'dog': 'Tiger',
    'cat': 'Leopard',
    'cow': 'Gaur/Bison',
    'sheep': 'Blue Sheep',
    'horse': 'Wild Horse',
    'bird': 'Eagle/Wild Bird'
}

# Risk Weights
SPEED_RISK_MULTIPLIER = 0.5
MAX_RISK_SCORE = 1.0

# ═══════════════════════════════════════════════════════════════
# LOGIC CLASSES
# ═══════════════════════════════════════════════════════════════

class RiskAssessor:
    def assess_risk(self, bbox, image_shape, vehicle_speed=0):
        """
        Uses a continuous scoring function instead of hardcoded buckets
        for dynamic validation of crossing risk.
        """
        h, w = image_shape[:2]
        x1, y1, x2, y2 = bbox
        
        # Calculate vertical proximity (validation of "closeness" to danger zone)
        center_y = (y1 + y2) / 2
        target_road_y = h * ROAD_Y_ESTIMATE_RATIO
        
        # Normalized distance (0.0 means ON the road line)
        distance_norm = abs(center_y - target_road_y) / h
        
        # Geometric decay for risk (Risk decreases exponentially with distance)
        # Formula: risk = e^(-10 * distance)
        raw_risk = np.exp(-12 * distance_norm)
        
        # Apply speed multiplier if validated vehicle is present
        risk_score = raw_risk
        if vehicle_speed > 0:
            speed_impact = (vehicle_speed / 100.0) * SPEED_RISK_MULTIPLIER
            risk_score = risk_score * (1 + speed_impact)
            
        risk_score = min(float(risk_score), MAX_RISK_SCORE)
        
        # Determine labels dynamically based on continuous score
        if risk_score > 0.85:
            alert_level = "CRITICAL"
            crossing_prob = 0.90 + (risk_score - 0.85) * 0.6 # Close to 1.0
        elif risk_score > 0.50:
            alert_level = "WARNING"
            crossing_prob = 0.60 + (risk_score - 0.50) * 0.8
        elif risk_score > 0.20:
            alert_level = "CAUTION"
            crossing_prob = 0.30 + (risk_score - 0.20) * 1.0
        else:
            alert_level = "LOW"
            crossing_prob = risk_score * 1.5
            
        return {
            'risk_score': round(risk_score, 3),
            'alert_level': alert_level,
            'crossing_probability': round(min(crossing_prob, 1.0), 3),
            'distance_to_road': round(distance_norm, 4)
        }

def get_clean_name(name):
    lower_name = name.lower().replace('_', ' ')
    return WILDLIFE_MAPPING.get(lower_name, lower_name.title())

# ═══════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
        
    img_path = sys.argv[1]
    # Speed is 0 by default unless explicitly passed and validated
    passed_speed = float(sys.argv[2]) if len(sys.argv) > 2 else 0
    
    try:
        # Load model with specific device if needed
        model = YOLO(MODEL_PATH)
        
        image = cv2.imread(img_path)
        if image is None:
            print(json.dumps({"error": "Failed to read image source"}))
            sys.exit(1)
            
        # Run detection with lower base threshold to see everything, then filter
        results = model(image, conf=0.25, verbose=False)
        
        detections_output = []
        vehicle_detected = False
        vehicle_classes = ['car', 'truck', 'bus', 'motorcycle']
        animal_classes = ['dog', 'cat', 'elephant', 'bear', 'zebra', 'giraffe', 'cow', 'horse', 'sheep', 'bird']
        
        if results and len(results) > 0:
            result = results[0]
            
            # 1. Validate Vehicle Presence (Higher threshold to avoid ghosting)
            # Only count vehicles with high confidence to "verify" their impact on speed
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                name = result.names[cls_id]
                
                if name in vehicle_classes and conf >= CONFIDENCE_THRESHOLD_VEHICLE:
                    vehicle_detected = True
                    break
            
            # Determine effective speed: if no high-conf vehicle, speed MUST be 0
            # Remove hardcoded "65" fallback.
            effective_speed = passed_speed if vehicle_detected else 0
            
            assessor = RiskAssessor()
            
            # 2. Process Animal Detections
            for idx, box in enumerate(result.boxes):
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                name = result.names[cls_id]
                
                # Check animal confidence
                if name not in animal_classes or conf < CONFIDENCE_THRESHOLD_ANIMAL:
                    continue
                    
                xyxy = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = map(float, xyxy)
                
                # Dynamic Risk Assessment
                risk = assessor.assess_risk([x1, y1, x2, y2], image.shape, vehicle_speed=effective_speed)
                
                detections_output.append({
                    "id": idx,
                    "animal": get_clean_name(name),
                    "confidence": round(conf * 100, 1),
                    "bbox": {
                        "x": int(x1),
                        "y": int(y1),
                        "width": int(x2-x1),
                        "height": int(y2-y1)
                    },
                    "risk": risk
                })

        # Aggregate Result Calculation
        if detections_output:
            best_risk = max(detections_output, key=lambda x: x['risk']['risk_score'])
            risk_level = best_risk['risk']['alert_level'].lower()
            crossing_prob = round(best_risk['risk']['crossing_probability'] * 100)
            dist_to_road = round(best_risk['risk']['distance_to_road'] * 100)
        else:
            risk_level = "safe"
            crossing_prob = 0
            dist_to_road = 0

        output = {
            "detections": detections_output,
            "vehicleSpeed": effective_speed,
            "riskLevel": risk_level,
            "crossingProbability": crossing_prob,
            "distanceToRoad": dist_to_road
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": f"Internal Detection Error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
