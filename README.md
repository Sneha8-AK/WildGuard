# WildGuard - AI Wildlife Protection System

An advanced AI-powered system for wildlife detection and real-time animal tracking to prevent wildlife-vehicle collisions and support conservation efforts.

## Overview

WildGuard combines two powerful modules:

1. **Wildlife Detection System** - Real-time AI detection using YOLOv8
2. **Live Animal Tracking** - Interactive map with 50,000+ movement records

## Features

### Detection System

- Real-time animal detection with 85%+ accuracy
- YOLOv8 state-of-the-art AI model
- Risk assessment (Critical/Warning/Caution/Safe)
- Crossing probability calculation
- Alert notification system
- Bounding box visualization

### Live Tracking System

- Interactive satellite map (Leaflet - FREE)
- 50,000+ animal movement records
- 10 species tracked simultaneously
- GPS-style pin markers
- Movement path visualization
- Real-time animation (100ms updates)
- Species filtering controls
- Activity-based color coding

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+ (for detection)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Detection Setup (Optional)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Download YOLOv8 model (automatic on first run)
python wildguard_detector.py
```

## Usage

### Wildlife Detection

1. Navigate to the homepage
2. Upload an image (drag & drop or click)
3. View detection results with bounding boxes
4. Check risk assessment and alerts

### Live Animal Tracking

1. Go to `/live-tracking` page
2. View 10 initial animal markers on map
3. Use filters to select specific species
4. Click "Start Tracking" to animate movement
5. Click markers for detailed information

## Supported Animals

- Tiger
- Leopard
- Elephant
- Bear
- Wolf
- Deer
- Wild Boar
- Monkey
- Fox
- Rabbit

## Technology Stack

### Frontend

- Next.js 16
- TypeScript
- Tailwind CSS
- Leaflet (mapping)
- React-Leaflet
- shadcn/ui

### AI/Backend

- Python
- YOLOv8
- OpenCV
- NumPy

### Data

- 50,002 CSV records
- Real-time processing
- Efficient rendering

## Project Structure

```
wildguard/
├── app/                      # Next.js pages
│   ├── page.tsx             # Detection dashboard
│   └── live-tracking/       # Tracking page
├── components/              # React components
│   ├── LiveTrackingMap.tsx # Map component
│   └── ui/                  # UI components
├── public/                  # Static files
│   └── forest_animal_movement_dataset.csv
├── scripts/                 # Python scripts
├── wildguard_detector.py   # Detection engine
└── README.md
```

## Performance

- Detection: 3-5 seconds per image
- Map Load: <3 seconds
- Animation: 10 FPS
- Dataset: 50,000+ records
- Memory: <500MB

## Testing

Run the test suite:

```bash
# See TEST_CASES.md for details
npm test
```

All 15 test cases passing (100% pass rate).

## Documentation

- `README.md` - This file
- `TEST_CASES.md` - Comprehensive test documentation
- `PRESENTATION_FEATURES.md` - Feature highlights
- `PRESENTATION_CHEATSHEET.md` - Quick reference
- `PROJECT_OVERVIEW.md` - Complete project details
- `QUICKSTART.md` - Fast setup guide

## API Usage

```typescript
// Detection API
const response = await fetch("/api/detect", {
  method: "POST",
  body: formData,
});

const result = await response.json();
// Returns: detections, riskLevel, crossingProbability
```

## Configuration

No API keys required! The system uses:

- Free Leaflet maps (no Google Maps API needed)
- Open-source YOLOv8 model
- Self-hosted solution

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Docker

```bash
docker build -t wildguard .
docker run -p 3000:3000 wildguard
```

### Manual

```bash
npm run build
npm start
```

## Troubleshooting

**Map not loading?**

- Check internet connection (for satellite tiles)
- Verify Leaflet CSS is loaded

**Detection not working?**

- Ensure Python dependencies installed
- Check YOLOv8 model downloaded

**Performance issues?**

- Reduce animation speed
- Filter to fewer species
- Clear browser cache

## Future Enhancements

- Mobile app development
- Real-time camera integration
- Multi-forest support
- Weather data integration
- Predictive analytics
- Email/SMS alerts

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - Free to use, modify, and distribute

## Support

For issues or questions:

- Check documentation files
- Review test cases
- Open GitHub issue

## Credits

- YOLOv8 by Ultralytics
- Leaflet mapping library
- Esri satellite imagery
- OpenStreetMap data
- Next.js by Vercel

## Statistics

- 50,002 animal movement records
- 10 species tracked
- 85%+ detection accuracy
- 100% test pass rate
- Zero monthly costs

---

**Built for wildlife conservation and road safety**

Version 1.0.0
