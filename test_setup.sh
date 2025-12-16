#!/bin/bash

# Test script to verify YOLO detection is working

echo "Testing YOLO detection setup..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    exit 1
fi

echo "✅ Virtual environment found"

# Check if Python script exists
if [ ! -f "detect_cli.py" ]; then
    echo "❌ detect_cli.py not found!"
    exit 1
fi

echo "✅ detect_cli.py found"

# Check if model file exists
if [ ! -f "yolov8m.pt" ]; then
    echo "❌ yolov8m.pt model not found!"
    exit 1
fi

echo "✅ Model file found"

# Test Python dependencies
echo "Testing Python dependencies..."
./venv/bin/python -c "import cv2; import numpy; from ultralytics import YOLO; print('✅ All Python dependencies installed')" || {
    echo "❌ Python dependencies missing!"
    exit 1
}

# Test detection with sample image
if [ -f "dog.jpg" ]; then
    echo "Testing detection with dog.jpg..."
    ./venv/bin/python detect_cli.py dog.jpg > /tmp/test_output.json
    
    if [ $? -eq 0 ]; then
        echo "✅ Detection test successful!"
        echo "Output:"
        cat /tmp/test_output.json | python3 -m json.tool 2>/dev/null || cat /tmp/test_output.json
    else
        echo "❌ Detection test failed!"
        exit 1
    fi
else
    echo "⚠️  No test image found (dog.jpg)"
fi

echo ""
echo "🎉 All tests passed! YOLO detection is ready to use."
echo ""
echo "Next steps:"
echo "1. Make sure 'npm run dev' is running"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Upload an image to test the detection"
