'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AnimalData {
  record_id: number;
  animal_type: string;
  date: string;
  time: string;
  location_x: number;
  location_y: number;
  movement_speed_mps: number;
  activity: string;
  temperature_c: number;
  is_near_water: boolean;
  steps_taken: number;
}

interface LiveTrackingMapProps {
  selectedAnimals: string[];
  isPlaying: boolean;
  animalColors: Record<string, string>;
}

// Nallamalla Forest approximate center coordinates
const NALLAMALLA_CENTER: [number, number] = [16.4833, 79.0167];

// Convert CSV coordinates (0-1000) to lat/lng offsets
const convertToLatLng = (x: number, y: number): [number, number] => {
  // Map 0-1000 range to approximately 0.5 degree range (about 55km)
  const latOffset = (y - 500) / 1000 * 0.5;
  const lngOffset = (x - 500) / 1000 * 0.5;
  
  return [
    NALLAMALLA_CENTER[0] + latOffset,
    NALLAMALLA_CENTER[1] + lngOffset
  ];
};

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

// Create custom pin icon
const createPinIcon = (color: string = '#EF4444') => {
  if (typeof window === 'undefined') return undefined;
  
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position: relative; width: 30px; height: 40px;">
        <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow-${color.replace('#', '')}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.4"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <!-- Pin shape -->
          <path d="M15 0C9.5 0 5 4.5 5 10c0 7.5 10 25 10 25s10-17.5 10-25c0-5.5-4.5-10-10-10z" 
                fill="${color}" 
                stroke="#ffffff" 
                stroke-width="2"
                filter="url(#shadow-${color.replace('#', '')})"
          />
          <!-- Inner circle -->
          <circle cx="15" cy="10" r="4" fill="#ffffff" opacity="0.9"/>
        </svg>
      </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });
};

export default function LiveTrackingMap({ 
  selectedAnimals, 
  isPlaying,
  animalColors 
}: LiveTrackingMapProps) {
  const [animalData, setAnimalData] = useState<AnimalData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnimals, setCurrentAnimals] = useState<Record<string, AnimalData>>({});
  const [animalPaths, setAnimalPaths] = useState<Record<string, [number, number][]>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load CSV data
  useEffect(() => {
    fetch('/forest_animal_movement_dataset.csv')
      .then(res => res.text())
      .then(data => {
        const lines = data.split('\n').slice(1); // Skip header
        const parsed: AnimalData[] = [];
        
        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 11) {
            parsed.push({
              record_id: parseInt(parts[0]),
              animal_type: parts[1],
              date: parts[2],
              time: parts[3],
              location_x: parseFloat(parts[4]),
              location_y: parseFloat(parts[5]),
              movement_speed_mps: parseFloat(parts[6]),
              activity: parts[7],
              temperature_c: parseFloat(parts[8]),
              is_near_water: parts[9] === 'True',
              steps_taken: parseInt(parts[10])
            });
          }
        });
        
        setAnimalData(parsed);
      });
  }, []);

  // Animation playback
  useEffect(() => {
    if (isPlaying && animalData.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= animalData.length) {
            return 0; // Loop back
          }
          return next;
        });
      }, 100); // Update every 100ms for smooth animation
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, animalData]);

  // Update current animal positions and paths
  useEffect(() => {
    if (animalData.length > 0) {
      setCurrentAnimals(() => {
        const newAnimals: Record<string, AnimalData> = {};
        
        if (currentIndex === 0) {
          // At start, show the first position of each unique animal
          const animalFirstPositions: Record<string, AnimalData> = {};
          animalData.forEach(data => {
            if (!animalFirstPositions[data.animal_type]) {
              animalFirstPositions[data.animal_type] = data;
            }
          });
          
          Object.entries(animalFirstPositions).forEach(([type, data]) => {
            if (selectedAnimals.length === 0 || selectedAnimals.includes(type)) {
              newAnimals[`${type}-initial`] = data;
            }
          });
        } else {
          // During animation, show recent positions (last 50 records)
          for (let i = Math.max(0, currentIndex - 50); i <= currentIndex; i++) {
            const data = animalData[i];
            if (data && (selectedAnimals.length === 0 || selectedAnimals.includes(data.animal_type))) {
              newAnimals[`${data.animal_type}-${i}`] = data;
            }
          }
        }
        
        return newAnimals;
      });
      
      // Build paths for tracking
      if (currentIndex > 0) {
        setAnimalPaths(() => {
          const paths: Record<string, [number, number][]> = {};
          
          // Group data by animal type and build paths
          const animalGroups: Record<string, AnimalData[]> = {};
          for (let i = 0; i <= currentIndex; i++) {
            const data = animalData[i];
            if (data && (selectedAnimals.length === 0 || selectedAnimals.includes(data.animal_type))) {
              if (!animalGroups[data.animal_type]) {
                animalGroups[data.animal_type] = [];
              }
              animalGroups[data.animal_type].push(data);
            }
          }
          
          // Create path for each animal (last 20 positions)
          Object.entries(animalGroups).forEach(([type, positions]) => {
            const recentPositions = positions.slice(-20);
            paths[type] = recentPositions.map(p => 
              convertToLatLng(p.location_x, p.location_y)
            );
          });
          
          return paths;
        });
      }
    }
  }, [currentIndex, animalData, selectedAnimals]);

  const getMarkerColor = (animal: AnimalData) => {
    // Color based on activity
    if (animal.activity === 'Running' || animal.activity === 'Chasing') {
      return '#EF4444'; // Red
    } else if (animal.activity === 'Resting') {
      return '#10B981'; // Green
    } else if (animal.activity === 'Eating' || animal.activity === 'Drinking') {
      return '#F59E0B'; // Yellow
    } else if (animal.is_near_water) {
      return '#3B82F6'; // Blue
    }
    return animalColors[animal.animal_type] || '#6B7280';
  };

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={NALLAMALLA_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* Satellite imagery from Esri */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        {/* Labels overlay */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.3}
        />

        {/* Render animal tracking paths */}
        {Object.entries(animalPaths).map(([animalType, path]) => {
          if (path.length < 2) return null;
          
          return (
            <Polyline
              key={`path-${animalType}`}
              positions={path}
              pathOptions={{
                color: animalColors[animalType] || '#6B7280',
                weight: 3,
                opacity: 0.6,
                dashArray: '5, 10'
              }}
            />
          );
        })}

        {/* Render animal markers */}
        {Object.values(currentAnimals).map((animal, idx) => {
          const position = convertToLatLng(animal.location_x, animal.location_y);
          const color = getMarkerColor(animal);
          const pinIcon = createPinIcon(color);
          
          return (
            <Marker
              key={`${animal.animal_type}-${animal.record_id}-${idx}`}
              position={position}
              icon={pinIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <h3 className="font-bold text-base">
                        {animal.animal_type}
                      </h3>
                      <p className="text-xs text-gray-500">
                        ID: {animal.record_id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activity:</span>
                      <span className="font-semibold">{animal.activity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-semibold">{animal.movement_speed_mps.toFixed(2)} m/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <span className="font-semibold">{animal.temperature_c.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Steps:</span>
                      <span className="font-semibold">{animal.steps_taken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Near Water:</span>
                      <span className={`font-semibold ${animal.is_near_water ? 'text-blue-600' : 'text-gray-400'}`}>
                        {animal.is_near_water ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold text-xs">{animal.date} {animal.time}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-[1000]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600">Active Animals:</span>
              <span className="ml-2 font-bold text-green-600">
                {Object.keys(currentAnimals).length}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Progress:</span>
              <span className="ml-2 font-bold text-blue-600">
                {currentIndex} / {animalData.length}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {isPlaying ? '▶ Playing' : '⏸ Paused'}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${animalData.length > 0 ? (currentIndex / animalData.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
