#!/usr/bin/env python3
"""
WildGuard - Animal Behavior Prediction System
Uses machine learning to predict animal crossing risk based on historical movement data
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import json
from datetime import datetime
import os

class AnimalBehaviorPredictor:
    """
    Predicts animal crossing risk based on environmental and behavioral features
    """
    
    def __init__(self, dataset_path='public/forest_animal_movement_dataset.csv'):
        self.dataset_path = dataset_path
        self.model = None
        self.label_encoders = {}
        self.feature_columns = []
        self.risk_thresholds = {
            'critical': 0.75,
            'warning': 0.50,
            'caution': 0.25,
            'safe': 0.0
        }
        
    def load_and_prepare_data(self):
        """Load and prepare the dataset for training"""
        print("📊 Loading dataset...")
        df = pd.read_csv(self.dataset_path)
        
        print(f"✅ Loaded {len(df)} records")
        print(f"📋 Columns: {list(df.columns)}")
        print(f"🦁 Animal types: {df['animal_type'].unique()}")
        
        # Feature Engineering
        print("\n🔧 Engineering features...")
        
        # Time-based features
        df['hour'] = pd.to_datetime(df['time']).dt.hour
        df['is_dawn_dusk'] = df['hour'].apply(lambda x: 1 if (5 <= x <= 7) or (17 <= x <= 19) else 0)
        df['is_night'] = df['hour'].apply(lambda x: 1 if x < 6 or x > 20 else 0)
        
        # Movement features
        df['is_fast_moving'] = (df['movement_speed_mps'] > 7).astype(int)
        df['is_very_active'] = df['steps_taken'].apply(lambda x: 1 if x > 600 else 0)
        
        # Environmental features
        df['is_hot'] = (df['temperature_c'] > 30).astype(int)
        df['is_cold'] = (df['temperature_c'] < 15).astype(int)
        
        # Create risk label based on multiple factors
        # High risk: Fast moving + near water + dawn/dusk + specific activities
        df['crossing_risk'] = 0.0
        
        # Risk factors
        df.loc[df['is_fast_moving'] == 1, 'crossing_risk'] += 0.2
        df.loc[df['is_near_water'] == True, 'crossing_risk'] += 0.15
        df.loc[df['is_dawn_dusk'] == 1, 'crossing_risk'] += 0.25
        df.loc[df['activity'].isin(['Running', 'Chasing']), 'crossing_risk'] += 0.3
        df.loc[df['activity'] == 'Exploring', 'crossing_risk'] += 0.1
        
        # Animal-specific risk (predators more likely to cross)
        high_risk_animals = ['Wolf', 'Tiger', 'Leopard', 'Bear']
        df.loc[df['animal_type'].isin(high_risk_animals), 'crossing_risk'] += 0.15
        
        # Cap at 1.0
        df['crossing_risk'] = df['crossing_risk'].clip(0, 1.0)
        
        # Create categorical risk level
        df['risk_level'] = pd.cut(df['crossing_risk'], 
                                   bins=[0, 0.25, 0.5, 0.75, 1.0],
                                   labels=['safe', 'caution', 'warning', 'critical'])
        
        print(f"\n📊 Risk Distribution:")
        print(df['risk_level'].value_counts())
        
        return df
    
    def prepare_features(self, df):
        """Prepare features for model training"""
        # Drop any rows with NaN values
        df = df.dropna()
        
        # Convert boolean to int
        df['is_near_water'] = df['is_near_water'].astype(int)
        
        # Encode categorical variables
        categorical_cols = ['animal_type', 'activity']
        
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col])
            else:
                df[f'{col}_encoded'] = self.label_encoders[col].transform(df[col])
        
        # Select features
        self.feature_columns = [
            'location_x', 'location_y', 'movement_speed_mps', 
            'temperature_c', 'is_near_water', 'steps_taken',
            'hour', 'is_dawn_dusk', 'is_night', 'is_fast_moving',
            'is_very_active', 'is_hot', 'is_cold',
            'animal_type_encoded', 'activity_encoded'
        ]
        
        X = df[self.feature_columns]
        y = df['risk_level']
        
        # Drop any remaining NaN
        mask = ~(X.isna().any(axis=1) | y.isna())
        X = X[mask]
        y = y[mask]
        
        return X, y
    
    def train_model(self):
        """Train the prediction model"""
        print("\n🚀 Training model...")
        
        # Load data
        df = self.load_and_prepare_data()
        X, y = self.prepare_features(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"\n📚 Training set: {len(X_train)} samples")
        print(f"🧪 Test set: {len(X_test)} samples")
        
        # Train Random Forest
        print("\n🌲 Training Random Forest Classifier...")
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\n✅ Model Accuracy: {accuracy:.2%}")
        print("\n📊 Classification Report:")
        print(classification_report(y_test, y_pred))
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n🎯 Top 10 Important Features:")
        print(feature_importance.head(10))
        
        return accuracy
    
    def predict_single(self, animal_data):
        """
        Predict crossing risk for a single animal observation
        
        Parameters:
        -----------
        animal_data : dict
            Dictionary containing animal features:
            - animal_type: str
            - location_x: float
            - location_y: float
            - movement_speed_mps: float
            - activity: str
            - temperature_c: float
            - is_near_water: bool
            - steps_taken: int
            - hour: int (0-23)
        
        Returns:
        --------
        dict: Prediction results with risk level and probability
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train_model() first.")
        
        # Create DataFrame from input
        df = pd.DataFrame([animal_data])
        
        # Engineer features
        df['is_dawn_dusk'] = df['hour'].apply(lambda x: 1 if (5 <= x <= 7) or (17 <= x <= 19) else 0)
        df['is_night'] = df['hour'].apply(lambda x: 1 if x < 6 or x > 20 else 0)
        df['is_fast_moving'] = (df['movement_speed_mps'] > 7).astype(int)
        df['is_very_active'] = df['steps_taken'].apply(lambda x: 1 if x > 600 else 0)
        df['is_hot'] = (df['temperature_c'] > 30).astype(int)
        df['is_cold'] = (df['temperature_c'] < 15).astype(int)
        
        # Encode categorical
        for col in ['animal_type', 'activity']:
            df[f'{col}_encoded'] = self.label_encoders[col].transform(df[col])
        
        # Prepare features
        X = df[self.feature_columns]
        
        # Predict
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        # Get probability for each class
        classes = self.model.classes_
        prob_dict = {cls: float(prob) for cls, prob in zip(classes, probabilities)}
        
        # Calculate overall risk score
        risk_scores = {'safe': 0.1, 'caution': 0.35, 'warning': 0.65, 'critical': 0.9}
        overall_risk = sum(prob_dict.get(level, 0) * score for level, score in risk_scores.items())
        
        return {
            'risk_level': prediction,
            'risk_score': overall_risk,
            'probabilities': prob_dict,
            'confidence': float(max(probabilities)),
            'animal_type': animal_data['animal_type'],
            'timestamp': datetime.now().isoformat()
        }
    
    def save_model(self, path='models/animal_behavior_model.pkl'):
        """Save trained model and encoders"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'label_encoders': self.label_encoders,
            'feature_columns': self.feature_columns,
            'risk_thresholds': self.risk_thresholds
        }
        
        joblib.dump(model_data, path)
        print(f"\n💾 Model saved to {path}")
    
    def load_model(self, path='models/animal_behavior_model.pkl'):
        """Load trained model and encoders"""
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        
        model_data = joblib.load(path)
        self.model = model_data['model']
        self.label_encoders = model_data['label_encoders']
        self.feature_columns = model_data['feature_columns']
        self.risk_thresholds = model_data['risk_thresholds']
        
        print(f"✅ Model loaded from {path}")


def main():
    """Main training and evaluation pipeline"""
    print("=" * 60)
    print("🐾 WildGuard Animal Behavior Prediction System")
    print("=" * 60)
    
    # Initialize predictor
    predictor = AnimalBehaviorPredictor()
    
    # Train model
    accuracy = predictor.train_model()
    
    # Save model
    predictor.save_model()
    
    # Test prediction
    print("\n" + "=" * 60)
    print("🧪 Testing Prediction")
    print("=" * 60)
    
    test_data = {
        'animal_type': 'Wolf',
        'location_x': 450.5,
        'location_y': 680.2,
        'movement_speed_mps': 9.5,
        'activity': 'Running',
        'temperature_c': 25.0,
        'is_near_water': True,
        'steps_taken': 650,
        'hour': 18  # Dawn/Dusk
    }
    
    result = predictor.predict_single(test_data)
    
    print(f"\n🦊 Animal: {result['animal_type']}")
    print(f"⚠️  Risk Level: {result['risk_level'].upper()}")
    print(f"📊 Risk Score: {result['risk_score']:.2%}")
    print(f"🎯 Confidence: {result['confidence']:.2%}")
    print(f"\n📈 Probabilities:")
    for level, prob in result['probabilities'].items():
        print(f"  {level:10s}: {prob:.2%}")
    
    print("\n" + "=" * 60)
    print("✅ Training Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
