'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import styles from './DrawTool.module.css'

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Yellow', value: '#ffff00' },
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
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className={styles.hint}>
        Click and drag on the card to draw.
      </p>
    </div>
  )
}
