"use client";

import { useState, useEffect } from "react";
import LiveTrackingMap from "@/components/LiveTrackingMap";
import SiteHeader from "@/components/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export default function LiveTrackingPage() {
  const animalTypes = [
    "Tiger",
    "Leopard",
    "Elephant",
    "Bear",
    "Wolf",
    "Deer",
    "Boar",
    "Monkey",
    "Fox",
    "Rabbit",
  ];
  
  // Auto-select all animals on load
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>(animalTypes);
  const [animalStats, setAnimalStats] = useState<Record<string, number>>({});

  const animalColors: Record<string, string> = {
    Tiger: "#FF6B35",
    Leopard: "#F7931E",
    Elephant: "#4ECDC4",
    Bear: "#8B4513",
    Wolf: "#6C757D",
    Deer: "#95E1D3",
    Boar: "#A0522D",
    Monkey: "#DDA15E",
    Fox: "#E76F51",
    Rabbit: "#F4A261",
  };

  useEffect(() => {
    // Load CSV and calculate stats
    fetch("/forest_animal_movement_dataset.csv")
      .then((res) => res.text())
      .then((data) => {
        const lines = data.split("\n").slice(1); // Skip header
        const stats: Record<string, number> = {};

        lines.forEach((line) => {
          const parts = line.split(",");
          if (parts.length > 1) {
            const animal = parts[1];
            stats[animal] = (stats[animal] || 0) + 1;
          }
        });

        setAnimalStats(stats);
      });
  }, []);

  const toggleAnimal = (animal: string) => {
    setSelectedAnimals((prev) =>
      prev.includes(animal)
        ? prev.filter((a) => a !== animal)
        : [...prev, animal]
    );
  };

  const selectAll = () => {
    setSelectedAnimals(animalTypes);
  };

  const clearAll = () => {
    setSelectedAnimals([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Site Navigation Header */}
      <SiteHeader />
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">
            Nallamalla ForestTracking
          </h1>
          <p className="text-green-100 text-lg">
            Real-time wildlife movement monitoring system
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Animal Filter */}
            <Card className="shadow-lg border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Filter className="w-5 h-5" />
                  Animal Filter
                </CardTitle>
                <CardDescription>Select animals to track</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex gap-2 mb-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAll}
                    className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAll}
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Clear
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {animalTypes.map((animal) => (
                    <button
                      key={animal}
                      onClick={() => toggleAnimal(animal)}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                        selectedAnimals.includes(animal)
                          ? "border-green-500 bg-green-50 shadow-md"
                          : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: animalColors[animal] }}
                        />
                        <span className="font-medium text-gray-800">
                          {animal}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {animalStats[animal] || 0}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="shadow-lg border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-green-800">
                  Activity Legend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Near Water</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Running/Chasing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Resting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Eating/Drinking</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="shadow-2xl border-green-200 overflow-hidden">
              <div className="h-[800px] relative">
                <LiveTrackingMap
                  selectedAnimals={selectedAnimals}
                  animalColors={animalColors}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
