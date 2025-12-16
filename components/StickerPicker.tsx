'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import styles from './StickerPicker.module.css'

type StickerCategory = 'christmas' | 'food' | 'animals' | 'more'

interface StickerFile {
  category: StickerCategory
  files: string[]
}

// Stickers organized by folder/category
const STICKER_FILES: StickerFile[] = [
  {
    category: 'christmas',
    files: [
      'Tiny Little Xmas Parade - Baby Mitten.png',
      'Tiny Little Xmas Parade - Cute Poinsettia.png',
      'Tiny Little Xmas Parade - Cutie Tree.png',
      'Tiny Little Xmas Parade - Glowy Candle.png',
      'Tiny Little Xmas Parade - Grumpy Cookie.png',
      'Tiny Little Xmas Parade - Happy Bag.png',
      'Tiny Little Xmas Parade - Happy Glass.png',
      'Tiny Little Xmas Parade - Jingly Bell.png',
      'Tiny Little Xmas Parade - Joyful Crown.png',
      'Tiny Little Xmas Parade - Merry Xmas Hat.png',
      'Tiny Little Xmas Parade - Playful Gingerbread Man.png',
      'Tiny Little Xmas Parade - Sad Xmas Sphere.png',
      'Tiny Little Xmas Parade - Shining Xmas Light.png',
      'Tiny Little Xmas Parade - Smiling Star.png',
      'Tiny Little Xmas Parade - Sweet Candy Cane.png',
      'Tiny Little Xmas Parade - Sweet Cherries.png',
      'Tiny Little Xmas Parade - Tiny Gift.png',
      'Tiny Little Xmas Parade - Xmas Boot.png',
    ],
  },
  {
    category: 'food',
    files: [
      'Isometric Stickers - Acai.png',
      'Isometric Stickers - Beef.png',
      'Isometric Stickers - Coffee.png',
      'Isometric Stickers - Cup of Coffee.png',
      'Isometric Stickers - Enchliladas.png',
      'Isometric Stickers - French Bread.png',
      'Isometric Stickers - Glass of Water.png',
      'Isometric Stickers - Lentil.png',
      'Isometric Stickers - Omelette.png',
      'Isometric Stickers - Pizza.png',
      'Isometric Stickers - Ramen.png',
      'Isometric Stickers - Salad.png',
      'Isometric Stickers - Scrambled Eggs.png',
      'Isometric Stickers - Tacos.png',
    ],
  },
  {
    category: 'animals',
    files: [
      'Fuzzy Friends - Artsy Cat.png',
      'Fuzzy Friends - Bee.png',
      'Fuzzy Friends - Bird.png',
      'Fuzzy Friends - Butterfly.png',
      'Fuzzy Friends - Curious Bunny.png',
      'Fuzzy Friends - Elegant Giraffe.png',
      'Fuzzy Friends - Little Elephant.png',
      'Fuzzy Friends - Mouse.png',
      'Fuzzy Friends - Playful Fox.png',
      'Fuzzy Friends - Romantic Bear.png',
      'Fuzzy Friends - Sweet Koala.png',
    ],
  },
  {
    category: 'more',
    files: [
      'Fuzzy Friends - Balloon.png',
      'Fuzzy Friends - Cloud.png',
      'Fuzzy Friends - Daisy.png',
      'Fuzzy Friends - Flower.png',
      'Fuzzy Friends - Leaf.png',
      'Fuzzy Friends - Roses.png',
      'Isometric Stickers - Angry.png',
      'Isometric Stickers - Cactus.png',
      'Isometric Stickers - Fiddle Leaf Fig.png',
      'Isometric Stickers - Gift.png',
      'Isometric Stickers - Heart Eyes.png',
      'Isometric Stickers - Instant Camera.png',
      'Isometric Stickers - Lipstick.png',
      'Isometric Stickers - Microphone.png',
      'Isometric Stickers - Paper Airplane.png',
      'Isometric Stickers - Sad.png',
      'Isometric Stickers - Smile.png',
      'Isometric Stickers - Weights.png',
    ],
  },
]

// Helper function to generate a clean name from filename
const generateName = (filename: string): string => {
  // Remove file extension
  let name = filename.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '')
  // Remove common prefixes like "Tiny Little Xmas Parade - " or "Isometric Stickers - " or "Fuzzy Friends - "
  name = name.replace(/^(Tiny Little Xmas Parade|Isometric Stickers|Fuzzy Friends)\s*-\s*/i, '')
  return name.trim()
}

// Helper function to generate ID from filename
const generateId = (filename: string, category: StickerCategory): string => {
  const name = generateName(filename)
  // Convert to lowercase, replace spaces and special chars with hyphens
  return `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
}

// Generate STICKERS array from folder structure
const STICKERS = STICKER_FILES.flatMap(({ category, files }) =>
  files.map((filename) => ({
    id: generateId(filename, category),
    name: generateName(filename),
    file: `/stickers/${category}/${filename}`,
    category: category as StickerCategory,
  }))
)

const CATEGORIES: { id: StickerCategory; label: string }[] = [
  { id: 'christmas', label: 'Christmas' },
  { id: 'food', label: 'Food' },
  { id: 'animals', label: 'Animals' },
  { id: 'more', label: 'More' },
]

// Export function to get sticker data for placement
export const getStickerData = (id: string) => {
  const sticker = STICKERS.find(s => s.id === id)
  if (!sticker) return null
  return {
    url: sticker.file,
    color: '#ffffff', // Not used for image files, but kept for compatibility
    scale: 0.6,
  }
}

export default function StickerPicker() {
  const { setSelectedSticker, selectedSticker, currentTool } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState<StickerCategory>('christmas')

  const handleStickerClick = (stickerId: string) => {
    // Industry standard: clicking the same sticker again deselects it
    // Clicking a different sticker selects it
    // This allows easy deselection without needing ESC
    if (selectedSticker === stickerId) {
      setSelectedSticker(null)
    } else {
    setSelectedSticker(stickerId)
    }
  }

  // Filter stickers by selected category
  const filteredStickers = STICKERS.filter(sticker => sticker.category === selectedCategory)

  return (
    <div className={styles.stickerPicker}>
      <p className={styles.hint}>
        Click on card to place sticker.
      </p>
      <div className={styles.categoryTabs}>
        {CATEGORIES.map((category) => {
          const categoryStickerCount = STICKERS.filter(s => s.category === category.id).length
          return (
            <button
              key={category.id}
              className={`${styles.categoryTab} ${
                selectedCategory === category.id ? styles.categoryTabActive : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
              disabled={categoryStickerCount === 0}
              title={categoryStickerCount === 0 ? 'No stickers in this category' : `${category.label} (${categoryStickerCount})`}
            >
              {category.label}
            </button>
          )
        })}
      </div>
      <div className={styles.stickerGrid}>
        {filteredStickers.length > 0 ? (
          filteredStickers.map((sticker) => (
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
                src={sticker.file}
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
          ))
        ) : (
          <div className={styles.emptyCategory}>
            No stickers in this category yet
          </div>
        )}
      </div>
    </div>
  )
}
