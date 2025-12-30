#!/usr/bin/env python3
"""
API Script for Animal Behavior Prediction
Reads JSON from stdin and outputs prediction results
"""

import sys
import json
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from animal_behavior_predictor import AnimalBehaviorPredictor
except ImportError as e:
    print(json.dumps({'error': f'Import error: {str(e)}'}), file=sys.stderr)
    sys.exit(1)

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Initialize predictor
        predictor = AnimalBehaviorPredictor()
        
        # Load trained model
        model_path = 'models/animal_behavior_model.pkl'
        if not os.path.exists(model_path):
            # Train model if it doesn't exist
            print("Model not found. Training new model...", file=sys.stderr)
            predictor.train_model()
            predictor.save_model(model_path)
        else:
            # Load silently - don't print to stdout
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model_data = __import__('joblib').load(model_path)
                predictor.model = model_data['model']
                predictor.label_encoders = model_data['label_encoders']
                predictor.feature_columns = model_data['feature_columns']
                predictor.risk_thresholds = model_data['risk_thresholds']
        
        # Make prediction
        result = predictor.predict_single(input_data)
        
        # Add recommendations based on risk level
        recommendations = {
            'critical': [
                'Immediate action required',
                'Activate warning systems',
                'Reduce vehicle speed to minimum',
                'Deploy wildlife barriers if available',
                'Alert nearby drivers'
            ],
            'warning': [
                'High caution advised',
                'Reduce speed significantly',
                'Increase monitoring frequency',
                'Prepare emergency response'
            ],
            'caution': [
                'Moderate risk detected',
                'Maintain safe speed',
                'Stay alert for wildlife',
                'Monitor situation'
            ],
            'safe': [
                'Low risk conditions',
                'Normal operations',
                'Continue standard monitoring'
            ]
        }
        
        result['recommendations'] = recommendations.get(result['risk_level'], [])
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
