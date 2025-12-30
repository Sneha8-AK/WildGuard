#!/usr/bin/env python3
"""
Quick test script for the prediction API
"""

import json
import subprocess

# Test data
test_data = {
    'animal_type': 'Wolf',
    'location_x': 450.5,
    'location_y': 680.2,
    'movement_speed_mps': 9.5,
    'activity': 'Running',
    'temperature_c': 25.0,
    'is_near_water': True,
    'steps_taken': 650,
    'hour': 18
}

print("🧪 Testing Prediction API")
print("=" * 60)
print("\n📥 Input Data:")
print(json.dumps(test_data, indent=2))

# Run prediction
process = subprocess.Popen(
    ['python3', 'predict_api.py'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

stdout, stderr = process.communicate(input=json.dumps(test_data))

if process.returncode == 0:
    print("\n✅ Prediction Successful!")
    print("\n📤 Raw Output:")
    print(repr(stdout))
    print("\n📤 Stderr:")
    print(repr(stderr))
    
    if stdout.strip():
        result = json.loads(stdout)
        print("\n📤 Parsed Output:")
        print(json.dumps(result, indent=2))
        
        print("\n" + "=" * 60)
        print(f"🦊 Animal: {result['animal_type']}")
        print(f"⚠️  Risk Level: {result['risk_level'].upper()}")
        print(f"📊 Risk Score: {result['risk_score']*100:.1f}%")
        print(f"🎯 Confidence: {result['confidence']*100:.1f}%")
        print("\n📋 Recommendations:")
        for i, rec in enumerate(result['recommendations'], 1):
            print(f"  {i}. {rec}")
    else:
        print("No output received!")
else:
    print("\n❌ Prediction Failed!")
    print("Error:", stderr)
