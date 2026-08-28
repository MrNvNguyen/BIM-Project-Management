/**
 * Generate OneCAD/BIM PWA icons + mono mask from brand mark art.
 *
 * Source priority:
 *   1. public/brand/onecad-icon-source.png  (square app icon — drop file here)
 *   2. auto-crop from public/brand/onecad-mark.png (wordmark fallback)
 *
 * Usage: node scripts/gen-pwa-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const brandDir = join(root, 'public', 'brand')
mkdirSync(brandDir, { recursive: true })

const sourceIcon = join(brandDir, 'onecad-icon-source.png')
const wordmarkPath = join(brandDir, 'onecad-mark.png')
const markOut = join(brandDir, 'onecad-icon.png')

async function loadSquareMark() {
  if (existsSync(sourceIcon)) {
    console.log('Using square source:', sourceIcon)
    return sharp(readFileSync(sourceIcon)).ensureAlpha().png().toBuffer()
  }

  if (existsSync(markOut)) {
    console.log('Using existing mark:', markOut)
    return readFileSync(markOut)
  }

  if (!existsSync(wordmarkPath)) {
    throw new Error('Missing brand art. Add public/brand/onecad-icon-source.png (square icon) or onecad-mark.png')
  }

  console.log('Cropping mark from wordmark:', wordmarkPath)
  const raw = readFileSync(wordmarkPath)
  const meta = await sharp(raw).rotate().metadata()
  const cropW = Math.min(Math.round(meta.width * 0.34), meta.width)
  return sharp(raw)
    .rotate()
    .resize(cropW, meta.height, { fit: 'cover', position: 'left' })
    .trim({ threshold: 12 })
    .ensureAlpha()
    .png()
    .toBuffer()
}

const markBuf = await loadSquareMark()
writeFileSync(markOut, markBuf)
console.log('Wrote', markOut, 'bytes=', markBuf.length)

async function composeIcon(size, { badge = false, pad = 0.12 } = {}) {
  const inset = Math.round(size * pad)
  const inner = size - inset * 2
  const logoMax = badge ? inner : Math.round(inner * (badge ? 1 : 0.78))
  const logo = await sharp(markBuf)
    .resize(logoMax, logoMax, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer()
  const logoMeta = await sharp(logo).metadata()
  const lx = Math.round((size - logoMeta.width) / 2)
  const logoArea = badge ? inner : Math.round(inner * 0.78)
  const ly = Math.round(inset + (logoArea - logoMeta.height) / 2)

  const radius = Math.round(size * 0.2)
  const bg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" fill="#ffffff"/>
    </svg>`
  )

  let layers = [{ input: logo, left: lx, top: ly }]
  if (!badge) {
    layers.push({
      input: Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="${size - inset * 0.42}" text-anchor="middle"
            font-family="Segoe UI, system-ui, sans-serif" font-size="${Math.round(size * 0.08)}"
            font-weight="700" fill="#006e36">BIM</text>
        </svg>`
      ),
      left: 0,
      top: 0,
    })
  }

  return sharp(bg).composite(layers).png().toBuffer()
}

async function composeMonoMask(size = 512) {
  const logo = await sharp(markBuf)
    .resize(size, size, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer()

  return sharp(logo)
    .greyscale()
    .linear(1.15, -15)
    .threshold(40)
    .negate()
    .png()
    .toBuffer()
}

const jobs = [
  ['public/icon-192.png', () => composeIcon(192)],
  ['public/icon-512.png', () => composeIcon(512)],
  ['public/badge-72.png', () => composeIcon(72, { badge: true, pad: 0.1 })],
  ['public/brand/onecad-mark-mono.png', () => composeMonoMask(512)],
]

for (const [rel, fn] of jobs) {
  const buf = await fn()
  const dest = join(root, rel)
  writeFileSync(dest, buf)
  const sha = createHash('sha256').update(buf).digest('hex').slice(0, 16)
  console.log(`Wrote ${rel} bytes=${buf.length} sha16=${sha}`)
}
