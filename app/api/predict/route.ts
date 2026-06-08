import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const requiredFields = [
      "animal_type",
      "location_x",
      "location_y",
      "movement_speed_mps",
      "activity",
      "temperature_c",
      "is_near_water",
      "steps_taken",
      "hour",
    ];

    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Call Python prediction script
    const scriptPath = path.join(process.cwd(), "predict_api.py");
    const venvPythonPath = process.platform === "win32"
      ? path.join(process.cwd(), "venv", "Scripts", "python.exe")
      : path.join(process.cwd(), "venv", "bin", "python3");

    return new Promise((resolve) => {
      // Use venv python if it exists, otherwise fallback to system python
      const pythonExe = fs.existsSync(venvPythonPath) ? venvPythonPath : (process.platform === "win32" ? "python" : "python3");
      const python = spawn(pythonExe, [scriptPath]);

      let dataString = "";
      let errorString = "";

      // Send input data to Python script
      python.stdin.write(JSON.stringify(body));
      python.stdin.end();

      python.stdout.on("data", (data) => {
        dataString += data.toString();
      });

      python.stderr.on("data", (data) => {
        errorString += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          console.error("Python script error:", errorString);
          resolve(
            NextResponse.json(
              {
                error: "Prediction failed",
                details: errorString,
              },
              { status: 500 }
            )
          );
          return;
        }

        try {
          const result = JSON.parse(dataString);
          resolve(NextResponse.json(result));
        } catch (error) {
          console.error("Failed to parse Python output:", dataString);
          resolve(
            NextResponse.json(
              { error: "Invalid prediction response" },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to get sample predictions or model info
export async function GET() {
  return NextResponse.json({
    message: "Animal Behavior Prediction API",
    version: "1.2.0",
    model: "Voting Ensemble (HGB + RF + ET)",
    accuracy: "96.06%",
    endpoints: {
      POST: "/api/predict",
      description: "Predict animal crossing risk based on behavioral data",
    },
    required_fields: [
      "animal_type",
      "location_x",
      "location_y",
      "movement_speed_mps",
      "activity",
      "temperature_c",
      "is_near_water",
      "steps_taken",
      "hour",
    ],
    animal_types: [
      "Wolf",
      "Deer",
      "Boar",
      "Monkey",
      "Bear",
      "Leopard",
      "Fox",
      "Tiger",
      "Rabbit",
      "Elephant",
    ],
    activities: [
      "Walking",
      "Running",
      "Resting",
      "Eating",
      "Drinking",
      "Exploring",
      "Chasing",
      "Hiding",
    ],
  });
}
