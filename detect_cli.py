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
CONFIDENCE_THRESHOLD_ANIMAL = 0.35  # Slightly lowered for better recall
CONFIDENCE_THRESHOLD_VEHICLE = 0.45 # Lowered to ensure trucks/buses are caught in forest environments

# Visual References
ROAD_Y_ESTIMATE_RATIO = 0.75  # Assumed road position in frame

# Species Correction (COCO -> Wildlife)
WILDLIFE_MAPPING = {
    'dog': 'Tiger',
    'cat': 'Leopard',
    'cow': 'Gaur/Bison',
    'sheep': 'Blue Sheep',
    'horse': 'Wild Horse',
    'bird': 'Eagle/Wild Bird',
    'truck': 'Heavy Vehicle',
    'bus': 'Transport Bus',
    'car': 'Passenger Vehicle'
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
            
        h, w = image.shape[:2]
            
        # Run detection with lower base threshold to see everything, then filter
        results = model(image, conf=0.25, verbose=False)
        
        detections_output = []
        vehicle_detected = False
        vehicle_classes = ['car', 'truck', 'bus', 'motorcycle']
        animal_classes = ['dog', 'cat', 'elephant', 'bear', 'zebra', 'giraffe', 'cow', 'horse', 'sheep', 'bird']
        
        if results and len(results) > 0:
            result = results[0]
            
            # 1. Validate Vehicle Presence (Lowered threshold from 0.60 to 0.45)
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                name = result.names[cls_id]
                
                if name in vehicle_classes and conf >= CONFIDENCE_THRESHOLD_VEHICLE:
                    vehicle_detected = True
                    break
            
            # ONLY apply speed if a vehicle is actually present in the image
            if vehicle_detected:
                effective_speed = passed_speed if passed_speed > 0 else 40.0
            else:
                effective_speed = 0
            
            assessor = RiskAssessor()
            
            # 2. Process All Relevant Detections (Animals + Vehicles)
            for idx, box in enumerate(result.boxes):
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                name = result.names[cls_id]
                
                # Dynamic mapping check
                is_animal = name in animal_classes
                is_vehicle = name in vehicle_classes
                
                # Determine threshold
                threshold = CONFIDENCE_THRESHOLD_ANIMAL if is_animal else CONFIDENCE_THRESHOLD_VEHICLE
                
                if (is_animal or is_vehicle) and conf >= threshold:
                    xyxy = box.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = map(float, xyxy)
                    
                    # Risk assessment only applies to animals, vehicles are just markers
                    risk = assessor.assess_risk([x1, y1, x2, y2], image.shape, vehicle_speed=effective_speed) if is_animal else None
                    
                    # RETURN NORMALIZED COORDINATES (0-100) instead of raw pixels
                    # This fixes the scaling issues in the frontend
                    detections_output.append({
                        "id": idx,
                        "animal": get_clean_name(name),
                        "type": "animal" if is_animal else "vehicle",
                        "confidence": round(conf * 100, 1),
                        "bbox": {
                            "x": round((x1 / w) * 100, 2),
                            "y": round((y1 / h) * 100, 2),
                            "width": round(((x2-x1) / w) * 100, 2),
                            "height": round(((y2-y1) / h) * 100, 2)
                        },
                        "risk": risk
                    })

        # Aggregate Result Calculation
        if detections_output:
            # Only count animals for the main risk assessment
            animals_only = [d for d in detections_output if d['type'] == 'animal']
            if animals_only:
                best_risk = max(animals_only, key=lambda x: x['risk']['risk_score'])
                risk_level = best_risk['risk']['alert_level'].lower()
                crossing_prob = round(best_risk['risk']['crossing_probability'] * 100)
                dist_to_road = round(best_risk['risk']['distance_to_road'] * 100)
            else:
                # Only vehicles detected
                risk_level = "safe"
                crossing_prob = 0
                dist_to_road = 0
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
