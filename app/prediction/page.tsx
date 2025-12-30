"use client";

import { useState } from "react";
import SiteHeader from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface PredictionResult {
  risk_level: string;
  risk_score: number;
  probabilities: Record<string, number>;
  confidence: number;
  animal_type: string;
  timestamp: string;
  recommendations: string[];
}

export default function PredictionPage() {
  const [formData, setFormData] = useState({
    animal_type: "Wolf",
    location_x: "450.5",
    location_y: "680.2",
    movement_speed_mps: "9.5",
    activity: "Running",
    temperature_c: "25.0",
    is_near_water: true,
    steps_taken: "650",
    hour: "18",
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const animalTypes = [
    "Wolf", "Deer", "Boar", "Monkey", "Bear",
    "Leopard", "Fox", "Tiger", "Rabbit", "Elephant"
  ];

  const activities = [
    "Walking", "Running", "Resting", "Eating",
    "Drinking", "Exploring", "Chasing", "Hiding"
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        location_x: parseFloat(formData.location_x),
        location_y: parseFloat(formData.location_y),
        movement_speed_mps: parseFloat(formData.movement_speed_mps),
        temperature_c: parseFloat(formData.temperature_c),
        steps_taken: parseInt(formData.steps_taken),
        hour: parseInt(formData.hour),
      };

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Prediction failed");
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "warning": return "text-orange-600 bg-orange-50 border-orange-200";
      case "caution": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "safe": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical": return <XCircle className="h-8 w-8 text-red-600" />;
      case "warning": return <AlertTriangle className="h-8 w-8 text-orange-600" />;
      case "caution": return <Info className="h-8 w-8 text-yellow-600" />;
      case "safe": return <CheckCircle className="h-8 w-8 text-green-600" />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pb-16 pt-24 dark:from-slate-950 dark:to-background">
        <div className="container relative z-10 mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
              Animal Behavior{" "}
              <span className="text-blue-600">Prediction</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Predict wildlife crossing risk using machine learning trained on 50,000+ animal movement records
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Animal Data Input</CardTitle>
                <CardDescription>
                  Enter animal observation data to predict crossing risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="animal_type">Animal Type</Label>
                    <Select
                      value={formData.animal_type}
                      onValueChange={(value) => handleInputChange("animal_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {animalTypes.map((animal) => (
                          <SelectItem key={animal} value={animal}>
                            {animal}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity">Activity</Label>
                    <Select
                      value={formData.activity}
                      onValueChange={(value) => handleInputChange("activity", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activities.map((activity) => (
                          <SelectItem key={activity} value={activity}>
                            {activity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_x">Location X</Label>
                    <Input
                      id="location_x"
                      type="number"
                      step="0.1"
                      value={formData.location_x}
                      onChange={(e) => handleInputChange("location_x", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_y">Location Y</Label>
                    <Input
                      id="location_y"
                      type="number"
                      step="0.1"
                      value={formData.location_y}
                      onChange={(e) => handleInputChange("location_y", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="movement_speed_mps">Speed (m/s)</Label>
                    <Input
                      id="movement_speed_mps"
                      type="number"
                      step="0.1"
                      value={formData.movement_speed_mps}
                      onChange={(e) => handleInputChange("movement_speed_mps", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature_c">Temperature (°C)</Label>
                    <Input
                      id="temperature_c"
                      type="number"
                      step="0.1"
                      value={formData.temperature_c}
                      onChange={(e) => handleInputChange("temperature_c", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="steps_taken">Steps Taken</Label>
                    <Input
                      id="steps_taken"
                      type="number"
                      value={formData.steps_taken}
                      onChange={(e) => handleInputChange("steps_taken", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hour">Hour (0-23)</Label>
                    <Input
                      id="hour"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.hour}
                      onChange={(e) => handleInputChange("hour", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_near_water"
                    checked={formData.is_near_water}
                    onChange={(e) => handleInputChange("is_near_water", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_near_water" className="cursor-pointer">
                    Near Water Source
                  </Label>
                </div>

                <Button
                  onClick={handlePredict}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Predicting..." : "Predict Crossing Risk"}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Prediction Results */}
            <div className="space-y-6">
              {prediction ? (
                <>
                  <Card className={`border-2 ${getRiskColor(prediction.risk_level)}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Prediction Result</CardTitle>
                        {getRiskIcon(prediction.risk_level)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Risk Level</span>
                          <Badge className={getRiskColor(prediction.risk_level)}>
                            {prediction.risk_level.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Risk Score</span>
                          <span className="text-lg font-bold">
                            {(prediction.risk_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Confidence</span>
                          <span className="text-lg font-bold">
                            {(prediction.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Probability Distribution</h4>
                        {Object.entries(prediction.probabilities).map(([level, prob]) => (
                          <div key={level} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{level}</span>
                              <span>{(prob * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200">
                              <div
                                className={`h-2 rounded-full ${getRiskColor(level)}`}
                                style={{ width: `${prob * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {prediction.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="text-blue-600">•</span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="flex h-full items-center justify-center p-12">
                  <div className="text-center text-muted-foreground">
                    <Info className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>Enter animal data and click predict to see results</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
