'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import StickerPicker from './StickerPicker'
import TextTool from './TextTool'
import DrawTool from './DrawTool'
import styles from './Toolbar.module.css'

export default function Toolbar() {
  const {
    mode,
    setMode,
    currentTool,
    setTool,
    setShowSendModal,
    setSelectedSticker,
    setSelectedDecoration,
  } = useAppStore()

  // ESC key to exit active modes and deselect stickers/decorations
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSticker(null)
        setSelectedDecoration(null)
        setTool(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setTool, setSelectedSticker, setSelectedDecoration])

  // Click outside to close drawers (but not on canvas)
  useEffect(() => {
    if (!currentTool) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Don't close if clicking on canvas or inside toolbar/drawer
      if (target.closest('canvas') || target.closest(`.${styles.rightToolbar}`) || target.closest(`.${styles.toolDrawer}`)) {
        return
      }
      setTool(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [currentTool, setTool])

  const handleToolClick = (tool: 'sticker' | 'text' | 'draw') => {
    if (currentTool === tool) {
      setTool(null)
    } else {
      setTool(tool)
    }
  }

  return (
    <>
      {/* Right Toolbar - Tools */}
      <div className={styles.rightToolbar}>
        <div className={styles.toolbarContent}>
          <div className={styles.toolButtons}>
            <button
              className={`${styles.toolButton} ${currentTool === 'sticker' ? styles.active : ''}`}
              onClick={() => handleToolClick('sticker')}
              aria-label="Add Sticker"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
            <button
              className={`${styles.toolButton} ${currentTool === 'text' ? styles.active : ''}`}
              onClick={() => handleToolClick('text')}
              aria-label="Add Text"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                <line x1="9" y1="20" x2="15" y2="20"></line>
                <line x1="12" y1="4" x2="12" y2="20"></line>
              </svg>
            </button>
            <button
              className={`${styles.toolButton} ${currentTool === 'draw' ? styles.active : ''}`}
              onClick={() => handleToolClick('draw')}
              aria-label="Draw On"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </svg>
            </button>
          </div>

          {currentTool && (
            <div 
              className={styles.toolDrawer}
              style={{
                top: currentTool === 'sticker' ? '0px' : 
                     currentTool === 'text' ? '52px' : 
                     '116px' // draw button position (adjusted for better alignment)
              }}
            >
              {currentTool === 'sticker' && <StickerPicker />}
              {currentTool === 'text' && <TextTool />}
              {currentTool === 'draw' && <DrawTool />}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar - Actions */}
      <div className={styles.bottomToolbar}>
        <div className={styles.bottomToolbarContent}>
          <div className={styles.viewButtons}>
            <button
              className={`${styles.viewButton} ${mode === 'front' ? styles.active : ''}`}
              onClick={() => setMode('front')}
            >
              Front
            </button>
            <button
              className={`${styles.viewButton} ${mode === 'back' ? styles.active : ''}`}
              onClick={() => setMode('back')}
            >
              Back
            </button>
          </div>
          <button
            className={styles.sendButton}
            onClick={() => setShowSendModal(true)}
          >
            Send
          </button>
        </div>
      </div>
    </>
  )
}
