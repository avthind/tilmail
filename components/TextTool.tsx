'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import styles from './TextTool.module.css'

const FONTS = [
  { name: 'Handwriting', value: '"Comic Sans MS", "Comic Sans", cursive' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Sans-serif', value: 'Arial, sans-serif' },
]

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Yellow', value: '#ffff00' },
]

const FONT_SIZES = [
  { name: 'Small', value: 16 },
  { name: 'Medium', value: 24 },
  { name: 'Large', value: 36 },
]

const FONT_WEIGHTS = [
  { name: 'Regular', value: 'normal' },
  { name: 'Bold', value: 'bold' },
  { name: 'Italics', value: 'italic' },
  { name: 'Underline', value: 'underline' },
]

export default function TextTool() {
  const { textSettings, setTextSettings } = useAppStore()
  const [fontFamily, setFontFamily] = useState(textSettings.fontFamily)
  const [fontSize, setFontSize] = useState(textSettings.fontSize || 24)
  const [color, setColor] = useState(textSettings.color || COLORS[0].value)
  const [fontWeight, setFontWeight] = useState(textSettings.fontWeight || 'normal')
  const [textDecoration, setTextDecoration] = useState(textSettings.textDecoration || 'none')

  const updateSettings = (
    newFontFamily?: string,
    newFontSize?: number,
    newColor?: string,
    newFontWeight?: string,
    newTextDecoration?: string
  ) => {
    const updated = {
      fontFamily: newFontFamily ?? fontFamily,
      fontSize: newFontSize ?? fontSize,
      color: newColor ?? color,
      fontWeight: newFontWeight ?? fontWeight,
      textDecoration: newTextDecoration ?? textDecoration,
    }
    setFontFamily(updated.fontFamily)
    setFontSize(updated.fontSize)
    setColor(updated.color)
    setFontWeight(updated.fontWeight)
    setTextDecoration(updated.textDecoration)
    setTextSettings({
      ...updated,
      fontWeight: updated.fontWeight,
      textDecoration: updated.textDecoration,
    })
  }

  const handleFontWeight = (weight: string) => {
    if (weight === 'underline') {
      updateSettings(undefined, undefined, undefined, 'normal', 'underline')
    } else {
      updateSettings(undefined, undefined, undefined, weight, 'none')
    }
  }

  return (
    <div className={styles.textTool}>
      <div className={styles.controls}>
        <label className={styles.label}>
          Font:
          <select
            value={fontFamily}
            onChange={(e) => updateSettings(e.target.value)}
            className={styles.select}
          >
            {FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Size:
          <div className={styles.sizeButtons}>
            {FONT_SIZES.map((size) => (
              <button
                key={size.value}
                className={`${styles.sizeButton} ${fontSize === size.value ? styles.active : ''}`}
                onClick={() => updateSettings(undefined, size.value)}
              >
                {size.name}
              </button>
            ))}
          </div>
        </label>
        <div className={styles.colorPicker}>
          <label className={styles.label}>Color:</label>
          {COLORS.map((c) => (
            <button
              key={c.value}
              className={`${styles.colorButton} ${color === c.value ? styles.active : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => updateSettings(undefined, undefined, c.value)}
              aria-label={c.name}
              title={c.name}
            />
          ))}
        </div>
        <label className={styles.label}>
          Style:
          <div className={styles.weightButtons}>
            {FONT_WEIGHTS.map((weight) => (
              <button
                key={weight.value}
                className={`${styles.weightButton} ${
                  (weight.value === 'underline' && textDecoration === 'underline') ||
                  (weight.value !== 'underline' && fontWeight === weight.value)
                    ? styles.active
                    : ''
                }`}
                onClick={() => handleFontWeight(weight.value)}
              >
                {weight.name}
              </button>
            ))}
          </div>
        </label>
      </div>
      <p className={styles.hint}>
        Click to place, double-click to edit, drag to move.
      </p>
      <div className={styles.preview}>
        <span
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            color,
            fontWeight,
            textDecoration: textDecoration === 'underline' ? 'underline' : 'none',
            fontStyle: fontWeight === 'italic' ? 'italic' : 'normal',
          }}
        >
          Preview Text
        </span>
      </div>
    </div>
  )
}
