import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { spawn } from "child_process"
import fs from "fs"

/**
 * WildGuard - Image Detection API
 * Handles multi-part file uploads and executes the Python detection suite
 */
export async function POST(request: NextRequest) {
  let tempFilePath = ""
  
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const customSpeed = formData.get("vehicleSpeed")?.toString()

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Prepare temporary storage for the image
    const buffer = Buffer.from(await file.arrayBuffer())
    const tempDir = tmpdir()
    const fileName = `wildguard-upload-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    tempFilePath = join(tempDir, fileName)
    
    await writeFile(tempFilePath, buffer)

    // Dynamic environment paths
    const projectRoot = process.cwd()
    const pythonScript = join(projectRoot, "detect_cli.py")
    
    // Check for venv python, fallback to system python
    const venvPath = process.platform === "win32"
      ? join(projectRoot, "venv", "Scripts", "python.exe")
      : join(projectRoot, "venv", "bin", "python3")
    const pythonExe = fs.existsSync(venvPath) ? venvPath : (process.platform === "win32" ? "python" : "python3")

    // Execute detection with optional parameters
    const args = [pythonScript, tempFilePath]
    if (customSpeed) args.push(customSpeed)

    const detectionResult = await runDetectionProcess(pythonExe, args)
    
    return NextResponse.json(detectionResult)

  } catch (error) {
    console.error("Critical detection error:", error)
    return NextResponse.json({ 
      error: "Detection failed", 
      details: error instanceof Error ? error.message : "Internal system failure" 
    }, { status: 500 })
  } finally {
    // Immediate cleanup of sensitive/large temp data
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await unlink(tempFilePath)
      } catch (e) {
        console.error("Cleanup warning:", e)
      }
    }
  }
}

/**
 * Manages the external Python process execution and output parsing
 */
function runDetectionProcess(pythonPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const process = spawn(pythonPath, args)
    
    let stdoutData = ""
    let stderrData = ""

    process.stdout.on("data", (data) => {
      stdoutData += data.toString()
    })

    process.stderr.on("data", (data) => {
      stderrData += data.toString()
    })

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Process terminated with code ${code}. Error: ${stderrData.trim()}`))
        return
      }

      try {
        // Find the JSON block in stdout in case of library warnings printed to stdout
        const jsonMatch = stdoutData.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error("No valid JSON output received from detection script")
        }
        
        const result = JSON.parse(jsonMatch[0])
        if (result.error) {
          reject(new Error(result.error))
        } else {
          resolve(result)
        }
      } catch (e) {
        reject(new Error("Response parsing failed: " + (e instanceof Error ? e.message : "Format error")))
      }
    })

    process.on("error", (err) => {
      reject(new Error("Process spawn failure: " + err.message))
    })
  })
}
