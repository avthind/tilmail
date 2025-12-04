'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import styles from './DrawTool.module.css'

const COLORS = [
  { name: 'Dark Gray', value: '#4A4A4A' },
  { name: 'Pastel Blue', value: '#A8D5E2' },
  { name: 'Dark Green', value: '#6BA689' },
  { name: 'Dark Yellow', value: '#D9C88F' },
  { name: 'Pastel Red', value: '#FFB3BA' },
]

const SIZES = [
  { name: 'Thin', value: 2 },
  { name: 'Medium', value: 4 },
  { name: 'Thick', value: 8 },
]

export default function DrawTool() {
  const { drawSettings, setDrawSettings } = useAppStore()
  const [color, setColor] = useState(drawSettings.color)
  const [lineWidth, setLineWidth] = useState(drawSettings.lineWidth)
  
  // Update store when settings change
  useEffect(() => {
    setDrawSettings({ color, lineWidth })
  }, [color, lineWidth, setDrawSettings])

  return (
    <div className={styles.drawTool}>
      <p className={styles.hint}>
        Click and drag to draw.
      </p>
      <div className={styles.colorPicker}>
        {COLORS.map((c) => (
          <button
            key={c.value}
            className={`${styles.colorButton} ${color === c.value ? styles.active : ''}`}
            style={{ backgroundColor: c.value }}
            onClick={() => setColor(c.value)}
            aria-label={c.name}
            title={c.name}
          />
        ))}
      </div>
      <div className={styles.sizePicker}>
        {SIZES.map((s) => (
          <button
            key={s.value}
            className={`${styles.sizeButton} ${lineWidth === s.value ? styles.active : ''}`}
            onClick={() => setLineWidth(s.value)}
            aria-label={s.name}
            title={s.name}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s.value} strokeLinecap="round">
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
