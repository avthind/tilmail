'use client'

import { useAppStore } from '@/store/appStore'
import styles from './StickerPicker.module.css'

const STICKERS = [
  { id: 'heart', name: 'Heart', color: '#ff6b6b' },
  { id: 'star', name: 'Star', color: '#ffd93d' },
  { id: 'smile', name: 'Smile', color: '#ffa500' },
  { id: 'flower', name: 'Flower', color: '#ff69b4' },
  { id: 'balloon', name: 'Balloon', color: '#4ecdc4' },
]

// Generate sticker SVG data URL
const getStickerSVG = (id: string, color: string): string => {
  const svgs: Record<string, string> = {
    heart: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 50c-8-6-20-16-20-24 0-6 4-10 10-10 3 0 6 2 10 6 4-4 7-6 10-6 6 0 10 4 10 10 0 8-12 18-20 24z" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`,
    star: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4l8 18 20 2-15 14 4 20-17-11-17 11 4-20-15-14 20-2z" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`,
    smile: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="24" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="24" cy="26" r="3" fill="#fff"/>
      <circle cx="40" cy="26" r="3" fill="#fff"/>
      <path d="M20 38 Q32 44 44 38" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`,
    flower: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="12" fill="${color}" stroke="#fff" stroke-width="2"/>
      <ellipse cx="32" cy="16" rx="8" ry="12" fill="${color}" stroke="#fff" stroke-width="2"/>
      <ellipse cx="32" cy="48" rx="8" ry="12" fill="${color}" stroke="#fff" stroke-width="2"/>
      <ellipse cx="16" cy="32" rx="12" ry="8" fill="${color}" stroke="#fff" stroke-width="2"/>
      <ellipse cx="48" cy="32" rx="12" ry="8" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`,
    balloon: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="28" rx="14" ry="18" fill="${color}" stroke="#fff" stroke-width="2"/>
      <path d="M32 46 L32 58 M28 54 L32 58 L36 54" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,
  }
  return `data:image/svg+xml;base64,${btoa(svgs[id] || '')}`
}

// Export function to get sticker data for placement
export const getStickerData = (id: string) => {
  const sticker = STICKERS.find(s => s.id === id)
  if (!sticker) return null
  return {
    url: getStickerSVG(id, sticker.color),
    color: sticker.color,
    scale: 0.15,
  }
}

export default function StickerPicker() {
  const { setSelectedSticker, selectedSticker } = useAppStore()

  return (
    <div className={styles.stickerPicker}>
      <div className={styles.stickerGrid}>
        {STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            className={`${styles.stickerButton} ${
              selectedSticker === sticker.id ? styles.selected : ''
            }`}
            onClick={() => setSelectedSticker(selectedSticker === sticker.id ? null : sticker.id)}
            aria-label={`Select ${sticker.name} sticker`}
          >
            <img
              src={getStickerSVG(sticker.id, sticker.color)}
              alt={sticker.name}
              className={styles.stickerImage}
            />
          </button>
        ))}
      </div>
      <p className={styles.hint}>
        Tap to add sticker. Drag to move. Pinch to resize/rotate (mobile).
      </p>
    </div>
  )
}
