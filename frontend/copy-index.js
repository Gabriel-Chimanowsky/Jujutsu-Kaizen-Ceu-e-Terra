import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourcePath = path.resolve(__dirname, '../static/dist/index.html')
const destPath = path.resolve(__dirname, '../templates/index.html')

try {
  // Ensure target templates folder exists
  const destDir = path.dirname(destPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  // Copy the index.html
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath)
    console.log(`[SUCCESS] Copied compiled SPA bundle: ${sourcePath} -> ${destPath}`)
  } else {
    console.error(`[ERROR] Compiled bundle NOT found at: ${sourcePath}. Did Vite run successfully?`)
    process.exit(1)
  }
} catch (err) {
  console.error('[ERROR] Failed to copy index.html:', err)
  process.exit(1)
}
