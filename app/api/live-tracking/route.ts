import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cache for the dataset
let cachedData: any[] | null = null;
let lastLoadTime = 0;

// Configuration constants to avoid hardcoding logic parameters
const CACHE_STALE_TIME_MS = 1000 * 60 * 60; // 1 hour
const UPDATE_INTERVAL_MS = 2000;           // Simulation update every 2 seconds

// Helper to load and parse CSV
function getAnimalData() {
  const now = Date.now();
  if (cachedData && now - lastLoadTime < CACHE_STALE_TIME_MS) {
    return cachedData;
  }

  try {
    const filePath = path.join(process.cwd(), "public", "forest_animal_movement_dataset.csv");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    
    // Parse CSV line by line
    const lines = fileContent.split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(",");
      if (values.length !== headers.length) continue;
      
      const record: any = {};
      
      // Dynamic mapping based on headers to avoid hardcoded indices
      headers.forEach((header, index) => {
        const value = values[index];
        
        // Parse numbers/booleans dynamically
        if (header.includes('location') || header.includes('speed') || header.includes('temp')) {
          record[header] = parseFloat(value);
        } else if (header.includes('id') || header.includes('steps')) {
          record[header] = parseInt(value);
        } else if (header.includes('water')) {
          record[header] = value.toLowerCase() === "true";
        } else {
          record[header] = value;
        }
      });
      
      data.push(record);
    }
    
    cachedData = data;
    lastLoadTime = now;
    return data;
  } catch (error) {
    console.error("Error reading CSV:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const allData = getAnimalData();
    
    if (!allData.length) {
      return NextResponse.json({ error: "No data available" }, { status: 500 });
    }

    // Group animals by type
    const animalGroups: Record<string, any[]> = {};
    allData.forEach(item => {
      const type = item.animal_type;
      if (!animalGroups[type]) {
        animalGroups[type] = [];
      }
      animalGroups[type].push(item);
    });

    const currentPositions = [];
    const timestamp = Date.now();
    
    for (const [type, positions] of Object.entries(animalGroups)) {
      if (positions.length === 0) continue;
      
      // Calculate index based on time with animal-specific offsets
      const offset = type.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 1000;
      const totalTime = timestamp + offset;
      
      // Dynamic index calculation based on positions available for this specific animal
      const index = Math.floor((totalTime / UPDATE_INTERVAL_MS) % positions.length);
      
      currentPositions.push(positions[index]);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      animals: currentPositions
    });
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
