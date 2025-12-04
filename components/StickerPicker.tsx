'use client'

import { useAppStore } from '@/store/appStore'
import styles from './StickerPicker.module.css'

const STICKERS = [
  { id: 'heart', name: 'Heart', color: '#ff6b6b' },
  { id: 'star', name: 'Star', color: '#ffd93d' },
  { id: 'smile', name: 'Smile', color: '#ffa500' },
  { id: 'flower', name: 'Flower', color: '#ff69b4' },
  { id: 'balloon', name: 'Balloon', color: '#4ecdc4' },
  { id: 'cake', name: 'Cake', color: '#ff9f9f' },
  { id: 'gift', name: 'Gift', color: '#ff6b9d' },
  { id: 'party', name: 'Party Hat', color: '#ffd93d' },
  { id: 'music', name: 'Music Note', color: '#a8d5e2' },
  { id: 'rainbow', name: 'Rainbow', color: '#ff6b6b' },
  { id: 'sun', name: 'Sun', color: '#ffd93d' },
  { id: 'moon', name: 'Moon', color: '#c4c4ff' },
  { id: 'butterfly', name: 'Butterfly', color: '#ff9f9f' },
  { id: 'cloud', name: 'Cloud', color: '#e0e0e0' },
  { id: 'lightning', name: 'Lightning', color: '#ffd93d' },
  { id: 'fire', name: 'Fire', color: '#ff6b6b' },
  { id: 'diamond', name: 'Diamond', color: '#a8d5e2' },
  { id: 'clover', name: 'Clover', color: '#b5e5cf' },
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
    cake: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="32" width="32" height="20" rx="2" fill="${color}" stroke="#fff" stroke-width="2"/>
      <rect x="20" y="24" width="24" height="8" rx="2" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="28" cy="20" r="2" fill="#fff"/>
      <circle cx="36" cy="20" r="2" fill="#fff"/>
      <circle cx="32" cy="16" r="2" fill="#fff"/>
    </svg>`,
    gift: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="24" width="24" height="28" rx="2" fill="${color}" stroke="#fff" stroke-width="2"/>
      <rect x="20" y="38" width="24" height="4" fill="#fff" opacity="0.8"/>
      <rect x="30" y="24" width="4" height="28" fill="#fff" opacity="0.8"/>
      <path d="M32 20 L32 24 M28 22 L36 22" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    party: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8 L28 32 L32 28 L36 32 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="32" cy="40" r="12" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="26" cy="36" r="2" fill="#fff"/>
      <circle cx="38" cy="36" r="2" fill="#fff"/>
      <path d="M24 44 Q32 48 40 44" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,
    music: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 16 L20 40 Q20 48 28 48 Q36 48 36 40 L36 20 L48 16 L48 36 Q48 44 40 44 Q32 44 32 36" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="28" cy="48" r="4" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="40" cy="44" r="4" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`,
    rainbow: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 40 Q32 20 56 40" stroke="#ff6b6b" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M10 44 Q32 26 54 44" stroke="#ffd93d" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M12 48 Q32 32 52 48" stroke="#b5e5cf" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M14 52 Q32 38 50 52" stroke="#a8d5e2" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>`,
    sun: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="16" fill="${color}" stroke="#fff" stroke-width="2"/>
      <line x1="32" y1="8" x2="32" y2="4" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="32" y1="60" x2="32" y2="56" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="8" y1="32" x2="4" y2="32" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="60" y1="32" x2="56" y2="32" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="18" y1="18" x2="15" y2="15" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="46" y1="46" x2="49" y2="49" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="46" y1="18" x2="49" y2="15" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <line x1="18" y1="46" x2="15" y2="49" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    moon: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 12 Q20 20 20 32 Q20 44 32 52 Q44 44 44 32 Q44 20 32 12 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="40" cy="24" r="4" fill="#fff" opacity="0.3"/>
      <circle cx="36" cy="28" r="2" fill="#fff" opacity="0.2"/>
    </svg>`,
    butterfly: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="32" rx="12" ry="16" fill="${color}" stroke="#fff" stroke-width="2"/>
      <ellipse cx="44" cy="32" rx="12" ry="16" fill="${color}" stroke="#fff" stroke-width="2"/>
      <ellipse cx="32" cy="28" rx="4" ry="8" fill="${color}" stroke="#fff" stroke-width="2"/>
      <line x1="32" y1="20" x2="32" y2="44" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      <circle cx="28" cy="24" r="2" fill="#fff"/>
      <circle cx="36" cy="24" r="2" fill="#fff"/>
    </svg>`,
    cloud: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 40 Q12 40 12 32 Q12 24 20 24 Q22 18 28 18 Q34 18 36 24 Q44 24 44 32 Q44 40 36 40 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="24" cy="28" r="3" fill="#fff" opacity="0.3"/>
      <circle cx="36" cy="30" r="2" fill="#fff" opacity="0.3"/>
    </svg>`,
    lightning: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8 L24 32 L32 28 L40 52 L32 48 L24 56 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`,
    fire: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 56 Q28 52 28 48 Q28 44 32 40 Q36 36 36 32 Q36 28 32 24 Q28 20 28 16 Q28 12 32 8 Q36 12 36 16 Q36 20 40 24 Q44 28 44 32 Q44 36 40 40 Q36 44 36 48 Q36 52 32 56 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <path d="M28 40 Q32 36 36 40" fill="#ffd93d" opacity="0.6"/>
    </svg>`,
    diamond: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8 L48 32 L32 56 L16 32 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <path d="M32 8 L32 56 M16 32 L48 32" stroke="#fff" stroke-width="1.5" opacity="0.5"/>
    </svg>`,
    clover: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="8" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="20" cy="24" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="44" cy="24" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="20" cy="40" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="44" cy="40" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>
      <line x1="32" y1="32" x2="32" y2="56" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
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
  const { setSelectedSticker, selectedSticker, currentTool } = useAppStore()

  const handleStickerClick = (stickerId: string) => {
    // Industry standard: clicking a sticker selects it (doesn't toggle)
    // User can place multiple instances by clicking on canvas
    setSelectedSticker(stickerId)
  }

  return (
    <div className={styles.stickerPicker}>
      {selectedSticker ? (
        <p className={styles.hint}>
          Click on card to place. Press ESC to cancel.
        </p>
      ) : (
        <p className={styles.hint}>
          Select a sticker and click on card to place.
        </p>
      )}
      <div className={styles.stickerGrid}>
        {STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            className={`${styles.stickerButton} ${
              selectedSticker === sticker.id ? styles.selected : ''
            }`}
            onClick={() => handleStickerClick(sticker.id)}
            aria-label={`Select ${sticker.name} sticker`}
            title={selectedSticker === sticker.id ? `${sticker.name} selected - Click on card to place` : `Select ${sticker.name}`}
          >
            <img
              src={getStickerSVG(sticker.id, sticker.color)}
              alt={sticker.name}
              className={styles.stickerImage}
            />
            {selectedSticker === sticker.id && (
              <div className={styles.checkmark}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
