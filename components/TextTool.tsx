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
  { name: 'Pastel Black', value: '#808080' },
  { name: 'Pastel Blue', value: '#A8D5E2' },
  { name: 'Pastel Green', value: '#B5E5CF' },
  { name: 'Pastel Yellow', value: '#FDF5BF' },
  { name: 'Pastel Red', value: '#FFB3BA' },
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
      <p className={styles.hint}>
        Click to place and double-click to edit.
      </p>
      <div className={styles.controls}>
        <div className={styles.colorPicker}>
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
        <div className={styles.sizeButtons}>
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              className={`${styles.sizeButton} ${fontSize === size.value ? styles.active : ''}`}
              onClick={() => updateSettings(undefined, size.value)}
              aria-label={size.name}
              title={size.name}
            >
              <svg 
                width={size.value === 16 ? "7" : size.value === 24 ? "9" : "12"} 
                height={size.value === 16 ? "7" : size.value === 24 ? "9" : "12"} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                <line x1="9" y1="20" x2="15" y2="20"></line>
                <line x1="12" y1="4" x2="12" y2="20"></line>
              </svg>
            </button>
          ))}
          {FONT_WEIGHTS.filter(weight => weight.value !== 'normal').map((weight) => (
            <button
              key={weight.value}
              className={`${styles.weightButton} ${
                (weight.value === 'underline' && textDecoration === 'underline') ||
                (weight.value !== 'underline' && fontWeight === weight.value)
                  ? styles.active
                  : ''
              }`}
              onClick={() => handleFontWeight(weight.value)}
              aria-label={weight.name}
              title={weight.name}
            >
              {weight.value === 'bold' ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                  <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                </svg>
              ) : weight.value === 'italic' ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="4" x2="10" y2="4"></line>
                  <line x1="14" y1="20" x2="5" y2="20"></line>
                  <line x1="15" y1="4" x2="9" y2="20"></line>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4v6a6 6 0 0 0 12 0V4"></path>
                  <line x1="4" y1="20" x2="20" y2="20"></line>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
