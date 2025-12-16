import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { spawn } from "child_process"
import path from "path"

// This uses the local YOLO Python script for accurate wildlife detection
export async function POST(request: NextRequest) {
  let tempFilePath = ""
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size)

    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer())
    const tempDir = tmpdir()
    const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    tempFilePath = join(tempDir, fileName)
    
    console.log("Saving file to:", tempFilePath)
    await writeFile(tempFilePath, buffer)

    // Run Python detection script
    const projectRoot = process.cwd()
    const pythonScript = join(projectRoot, "detect_cli.py")
    const pythonPath = join(projectRoot, "venv", "bin", "python")

    console.log("Project root:", projectRoot)
    console.log("Python path:", pythonPath)
    console.log("Script path:", pythonScript)

    const detectionResult = await runPythonScript(pythonPath, pythonScript, tempFilePath)
    
    console.log("Detection successful:", detectionResult)
    return NextResponse.json(detectionResult)

  } catch (error) {
    console.error("Detection error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Detection failed: " + errorMessage }, { status: 500 })
  } finally {
    // Cleanup temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
        console.log("Cleaned up temp file:", tempFilePath)
      } catch (e) {
        console.error("Failed to delete temp file:", e)
      }
    }
  }
}

function runPythonScript(pythonPath: string, scriptPath: string, imagePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log("Spawning Python process:", pythonPath, [scriptPath, imagePath])
    const process = spawn(pythonPath, [scriptPath, imagePath])
    
    let stdoutData = ""
    let stderrData = ""

    process.stdout.on("data", (data) => {
      const output = data.toString()
      console.log("Python stdout:", output)
      stdoutData += output
    })

    process.stderr.on("data", (data) => {
      const error = data.toString()
      console.error("Python stderr:", error)
      stderrData += error
    })

    process.on("close", (code) => {
      console.log("Python process exited with code:", code)
      
      if (code !== 0) {
        console.error("Python script error:", stderrData)
        reject(new Error(`Python script exited with code ${code}: ${stderrData || "No error message"}`))
        return
      }

      try {
        console.log("Parsing Python output:", stdoutData.substring(0, 200))
        const result = JSON.parse(stdoutData)
        if (result.error) {
          reject(new Error(result.error))
        } else {
          resolve(result)
        }
      } catch (e) {
        console.error("Failed to parse Python output:", stdoutData)
        reject(new Error("Failed to parse detection results: " + (e instanceof Error ? e.message : "Unknown error")))
      }
    })

    process.on("error", (err) => {
      console.error("Failed to start Python process:", err)
      reject(new Error("Failed to start Python process: " + err.message))
    })
  })
}
