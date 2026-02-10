'use client';

import { useEffect, useState } from 'react';
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
      <div style="position: relative; width: 30px; height: 40px; transition: transform 0.5s linear;">
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
  animalColors 
}: LiveTrackingMapProps) {
  const [currentAnimals, setCurrentAnimals] = useState<Record<string, AnimalData>>({});
  const [animalPaths, setAnimalPaths] = useState<Record<string, [number, number][]>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Poll for live data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/live-tracking');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data.animals) {
          setIsConnected(true);
          setLastUpdated(new Date().toLocaleTimeString());
          
          setCurrentAnimals(prevAnimals => {
            const newAnimals = { ...prevAnimals };
            // Note: We need to use functional updates for paths too, but since they are separate states,
            // we'll update paths below.
            
            data.animals.forEach((animal: AnimalData) => {
               newAnimals[animal.animal_type] = animal;
            });

            return newAnimals;
          });

          // Update paths
          setAnimalPaths(prevPaths => {
             const newPaths = { ...prevPaths };
             data.animals.forEach((animal: AnimalData) => {
                const pos = convertToLatLng(animal.location_x, animal.location_y);
                
                if (!newPaths[animal.animal_type]) {
                    newPaths[animal.animal_type] = [];
                }
                
                const path = newPaths[animal.animal_type];
                const lastPos = path.length > 0 ? path[path.length - 1] : null;
                
                // Only add if position changed
                if (!lastPos || lastPos[0] !== pos[0] || lastPos[1] !== pos[1]) {
                    path.push(pos);
                    // Keep last 50 points
                    if (path.length > 50) path.shift();
                }
             });
             return newPaths;
          });

        }
      } catch (err) {
        console.error("Error fetching live data:", err);
        setIsConnected(false);
      }
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 2000); // 2s polling
    
    return () => clearInterval(interval);
  }, []); 

  const getMarkerColor = (animal: AnimalData) => {
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
          <p className="text-gray-600">Connecting to satellite...</p>
        </div>
      </div>
    );
  }

  // Filter animals for display
  const displayedAnimals = Object.values(currentAnimals).filter(
    a => selectedAnimals.length === 0 || selectedAnimals.includes(a.animal_type)
  );

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={NALLAMALLA_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.3}
        />

        {/* Render animal tracking paths */}
        {Object.entries(animalPaths).map(([animalType, path]) => {
          if (selectedAnimals.length > 0 && !selectedAnimals.includes(animalType)) return null;
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
        {displayedAnimals.map((animal) => {
          const position = convertToLatLng(animal.location_x, animal.location_y);
          const color = getMarkerColor(animal);
          const pinIcon = createPinIcon(color);
          
          return (
            <Marker
              key={animal.animal_type}
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
                      <div className="flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-green-600">LIVE TRACKING</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Sensor ID: {animal.record_id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold">{animal.activity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-semibold">{animal.movement_speed_mps.toFixed(2)} m/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temp:</span>
                      <span className="font-semibold">{animal.temperature_c.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Near Water:</span>
                      <span className={`font-semibold ${animal.is_near_water ? 'text-blue-600' : 'text-gray-400'}`}>
                        {animal.is_near_water ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Live Status Overlay - Right Top */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000] border border-green-100 flex flex-col items-end">
        <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-gray-800">{isConnected ? 'LIVE FEED ACTIVE' : 'CONNECTING...'}</span>
            <span className={`relative flex h-3 w-3`}>
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
        </div>
        <div className="text-[10px] text-gray-500 mt-1 font-mono">
            UPDATED: {lastUpdated}
        </div>
      </div>

    </div>
  );
}
