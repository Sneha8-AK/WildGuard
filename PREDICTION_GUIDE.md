# 🐾 WildGuard Animal Behavior Prediction System

## Overview

The WildGuard Prediction System uses **machine learning** to predict wildlife crossing risks based on historical animal movement data. The system analyzes 50,000+ animal movement records to provide real-time risk assessments.

## 🎯 Features

- **ML-Powered Predictions**: Random Forest classifier with 91.25% accuracy
- **Real-time Risk Assessment**: Instant predictions based on animal behavior
- **Multi-factor Analysis**: Considers 15+ features including:
  - Animal type and activity
  - Location and movement speed
  - Environmental conditions (temperature, water proximity)
  - Time-based patterns (dawn/dusk, night)
  - Movement characteristics (speed, steps taken)

## 📊 Dataset

**File**: `public/forest_animal_movement_dataset.csv`

**Records**: 50,000+ animal observations

**Animal Types**: Wolf, Deer, Boar, Monkey, Bear, Leopard, Fox, Tiger, Rabbit, Elephant

**Features**:

- `location_x`, `location_y`: Spatial coordinates
- `movement_speed_mps`: Speed in meters per second
- `activity`: Current behavior (Walking, Running, Resting, Eating, Drinking, Exploring, Chasing, Hiding)
- `temperature_c`: Temperature in Celsius
- `is_near_water`: Proximity to water sources
- `steps_taken`: Activity level indicator
- `date`, `time`: Temporal information

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install pandas scikit-learn joblib

# Install Node.js packages
npm install
```

### 2. Train the Model

```bash
# Activate virtual environment
source venv/bin/activate

# Train the model (takes ~30 seconds)
python3 animal_behavior_predictor.py
```

This will:

- Load and analyze the dataset
- Engineer features
- Train a Random Forest classifier
- Save the model to `models/animal_behavior_model.pkl`
- Display accuracy metrics and feature importance

### 3. Run the Application

```bash
npm run dev
```

Navigate to:

- **Prediction Page**: http://localhost:3000/prediction
- **Main Dashboard**: http://localhost:3000
- **Live Tracking**: http://localhost:3000/live-tracking

## 🧠 Model Details

### Architecture

- **Algorithm**: Random Forest Classifier
- **Estimators**: 100 trees
- **Max Depth**: 15
- **Features**: 15 engineered features

### Performance

- **Accuracy**: 91.25%
- **Precision**: 93% (macro avg)
- **Recall**: 84% (macro avg)

### Risk Levels

1. **CRITICAL** (75-100%): Immediate action required
2. **WARNING** (50-75%): High caution advised
3. **CAUTION** (25-50%): Moderate risk detected
4. **SAFE** (0-25%): Low risk conditions

### Feature Importance (Top 5)

1. Activity Type (29.1%)
2. Animal Type (15.9%)
3. Dawn/Dusk Period (14.3%)
4. Near Water (12.5%)
5. Movement Speed (8.6%)

## 📡 API Usage

### Endpoint

`POST /api/predict`

### Request Body

```json
{
  "animal_type": "Wolf",
  "location_x": 450.5,
  "location_y": 680.2,
  "movement_speed_mps": 9.5,
  "activity": "Running",
  "temperature_c": 25.0,
  "is_near_water": true,
  "steps_taken": 650,
  "hour": 18
}
```

### Response

```json
{
  "risk_level": "critical",
  "risk_score": 0.779,
  "confidence": 0.5367,
  "probabilities": {
    "caution": 0.0174,
    "critical": 0.5367,
    "safe": 0.0,
    "warning": 0.446
  },
  "animal_type": "Wolf",
  "timestamp": "2024-12-30T08:00:00",
  "recommendations": [
    "Immediate action required",
    "Activate warning systems",
    "Reduce vehicle speed to minimum",
    "Deploy wildlife barriers if available",
    "Alert nearby drivers"
  ]
}
```

## 🎨 Frontend Features

### Prediction Page (`/prediction`)

**Input Form**:

- Animal type selector (10 species)
- Activity selector (8 behaviors)
- Location coordinates
- Movement speed
- Temperature
- Steps taken
- Hour of day (0-23)
- Water proximity checkbox

**Results Display**:

- Risk level badge with color coding
- Risk score percentage
- Confidence level
- Probability distribution chart
- Actionable recommendations

**Visual Indicators**:

- 🔴 Critical: Red
- 🟠 Warning: Orange
- 🟡 Caution: Yellow
- 🟢 Safe: Green

## 🔧 Technical Implementation

### Python Components

**`animal_behavior_predictor.py`**:

- Main ML model class
- Feature engineering
- Model training and evaluation
- Prediction interface

**`predict_api.py`**:

- API bridge script
- Reads JSON from stdin
- Returns predictions to Node.js

### Next.js Components

**`app/api/predict/route.ts`**:

- API endpoint handler
- Spawns Python process
- Handles request/response

**`app/prediction/page.tsx`**:

- User interface
- Form handling
- Results visualization

## 📈 Risk Calculation

The system calculates risk based on multiple weighted factors:

```python
risk_score = 0.0

# Movement factors
if is_fast_moving: risk_score += 0.2
if activity in ['Running', 'Chasing']: risk_score += 0.3
if activity == 'Exploring': risk_score += 0.1

# Environmental factors
if is_near_water: risk_score += 0.15
if is_dawn_dusk: risk_score += 0.25

# Animal-specific risk
if animal_type in ['Wolf', 'Tiger', 'Leopard', 'Bear']:
    risk_score += 0.15
```

## 🎯 Use Cases

1. **Wildlife Conservation**: Monitor animal behavior patterns
2. **Road Safety**: Predict crossing risks for drivers
3. **Research**: Analyze animal movement trends
4. **Park Management**: Optimize visitor safety measures
5. **Emergency Response**: Prioritize high-risk situations

## 🔄 Model Retraining

To retrain with updated data:

```bash
# Update the CSV file
# Then run:
source venv/bin/activate
python3 animal_behavior_predictor.py
```

The model will automatically:

- Load new data
- Retrain with updated parameters
- Save the new model
- Display updated metrics

## 📊 Example Predictions

### High Risk Scenario

```
Animal: Wolf
Activity: Running
Speed: 9.5 m/s
Time: 18:00 (dusk)
Near Water: Yes
→ Risk: CRITICAL (77.9%)
```

### Low Risk Scenario

```
Animal: Rabbit
Activity: Resting
Speed: 0.5 m/s
Time: 14:00 (afternoon)
Near Water: No
→ Risk: SAFE (5.2%)
```

## 🛠️ Troubleshooting

### Model Not Found

If you see "Model not found" error:

```bash
source venv/bin/activate
python3 animal_behavior_predictor.py
```

### Python Dependencies

If packages are missing:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### API Errors

Check that:

1. Virtual environment is activated
2. Model is trained and saved
3. Python 3 is available in PATH
4. All dependencies are installed

## 📝 Future Enhancements

- [ ] Real-time data streaming
- [ ] Historical trend analysis
- [ ] Multi-animal scenario predictions
- [ ] Weather integration
- [ ] Mobile app support
- [ ] Alert notification system
- [ ] Integration with camera systems

## 🤝 Contributing

To add new features or improve predictions:

1. Update dataset with new observations
2. Add new features in `prepare_features()`
3. Retrain model
4. Update API schema
5. Test predictions

## 📄 License

MIT License - See LICENSE file for details

---

**Built with**: Python, scikit-learn, Next.js, TypeScript, TailwindCSS

**Powered by**: Machine Learning, Random Forest, Real-time Analytics
