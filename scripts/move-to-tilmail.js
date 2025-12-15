const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, '..', 'out')
const tilmailDir = path.join(outDir, 'tilmail')

if (!fs.existsSync(outDir)) {
  console.log('No out directory found, skipping move-to-tilmail step.')
  process.exit(0)
}

// Ensure target directory exists
fs.mkdirSync(tilmailDir, { recursive: true })

const entries = fs.readdirSync(outDir)

for (const entry of entries) {
  if (entry === 'tilmail') continue

  const from = path.join(outDir, entry)
  const to = path.join(tilmailDir, entry)

  fs.renameSync(from, to)
}

console.log('Moved static export into out/tilmail for subpath hosting.')

