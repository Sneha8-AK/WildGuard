# YOLO Detection Troubleshooting Guide

## Setup Complete ✅

Your YOLO detection system is now properly configured and ready to use!

## What Was Fixed

1. **Virtual Environment Created**: A Python virtual environment was created at `venv/`
2. **Dependencies Installed**: All required Python packages (ultralytics, opencv, torch, etc.) are installed
3. **Error Handling Added**: Better error messages and logging to help debug issues
4. **Detection Tested**: The Python detection script works correctly with sample images

## How to Use

1. **Start the Development Server** (if not already running):

   ```bash
   npm run dev
   ```

2. **Open Your Browser**:
   Navigate to `http://localhost:3000`

3. **Upload an Image**:
   - Click on the upload area or drag and drop an image
   - The system will analyze the image using YOLOv8
   - Results will be displayed showing:
     - Detected objects with bounding boxes
     - Confidence scores
     - Risk assessment
     - Crossing probability

## Testing

Run the test script to verify everything is working:

```bash
./test_setup.sh
```

## Common Issues & Solutions

### Issue: "No file provided" error

**Solution**: Make sure you're uploading a valid image file (JPG, PNG, etc.)

### Issue: "Detection failed" error

**Solution**:

1. Check the browser console (F12) for detailed error messages
2. Check the terminal running `npm run dev` for server-side errors
3. Verify the virtual environment exists: `ls -la venv/`

### Issue: No detections found

**Solution**:

- The image might not contain any recognizable objects
- Try uploading a different image with clear subjects
- The model detects 80 different object classes (people, animals, vehicles, etc.)

### Issue: Python script fails

**Solution**:

1. Test the Python script directly:
   ```bash
   ./venv/bin/python detect_cli.py dog.jpg
   ```
2. Check if all dependencies are installed:
   ```bash
   ./venv/bin/pip list
   ```

## What Gets Detected

The YOLOv8 model can detect 80 different object classes including:

- **Animals**: dog, cat, bird, horse, sheep, cow, elephant, bear, zebra, giraffe, etc.
- **Vehicles**: car, motorcycle, airplane, bus, train, truck, boat
- **People**: person
- And many more common objects

## Viewing Logs

### Browser Console

1. Open browser DevTools (F12 or right-click → Inspect)
2. Go to the Console tab
3. You'll see detailed logs for each upload:
   - File information
   - API response status
   - Detection results
   - Any errors

### Server Logs

Check the terminal where `npm run dev` is running for:

- File processing logs
- Python script execution details
- Error messages

## File Structure

```
wildgaurd/
├── venv/                      # Python virtual environment
├── detect_cli.py              # Python detection script
├── yolov8m.pt                 # YOLOv8 model weights
├── app/
│   ├── api/detect/route.ts    # API endpoint for detection
│   └── page.tsx               # Main page with upload UI
├── components/
│   ├── upload-section.tsx     # Upload component
│   ├── detection-dashboard.tsx # Results display
│   └── results-panel.tsx      # Detection history
└── requirements.txt           # Python dependencies
```

## Next Steps

1. **Upload an image** to test the detection
2. **Check the console** for detailed logs
3. **View the results** in the dashboard
4. If you encounter any issues, check the logs and error messages

## Support

If you continue to experience issues:

1. Check the browser console for errors
2. Check the terminal for server-side errors
3. Run `./test_setup.sh` to verify the setup
4. Make sure `npm run dev` is running

---

**Status**: ✅ System is ready to use!
