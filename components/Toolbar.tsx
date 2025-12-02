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
    isEnvelopeOpen,
    openEnvelope,
    closeEnvelope,
    setShowSendModal,
  } = useAppStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  // ESC key to exit active modes
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTool(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setTool])

  // Click outside to close drawers
  useEffect(() => {
    if (!currentTool) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`.${styles.rightToolbar}`) && !target.closest(`.${styles.toolDrawer}`)) {
        setTool(null)
      }
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
      <div className={`${styles.rightToolbar} ${isCollapsed ? styles.collapsed : ''}`}>
        <button
          className={styles.collapseButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle toolbar"
        >
          {isCollapsed ? '▶' : '◀'}
        </button>

        {!isCollapsed && (
          <div className={styles.toolbarContent}>
            <div className={styles.toolButtons}>
              <button
                className={`${styles.toolButton} ${currentTool === 'sticker' ? styles.active : ''}`}
                onClick={() => handleToolClick('sticker')}
                onMouseEnter={() => setShowTooltip('sticker')}
                onMouseLeave={() => setShowTooltip(null)}
                aria-label="Stickers"
              >
                <span className={styles.toolIcon}>🖼</span>
                {showTooltip === 'sticker' && (
                  <span className={styles.tooltip}>Stickers</span>
                )}
              </button>
              <button
                className={`${styles.toolButton} ${currentTool === 'text' ? styles.active : ''}`}
                onClick={() => handleToolClick('text')}
                onMouseEnter={() => setShowTooltip('text')}
                onMouseLeave={() => setShowTooltip(null)}
                aria-label="Text"
              >
                <span className={styles.toolIcon}>✏️</span>
                {showTooltip === 'text' && (
                  <span className={styles.tooltip}>Text</span>
                )}
              </button>
              <button
                className={`${styles.toolButton} ${currentTool === 'draw' ? styles.active : ''}`}
                onClick={() => handleToolClick('draw')}
                onMouseEnter={() => setShowTooltip('draw')}
                onMouseLeave={() => setShowTooltip(null)}
                aria-label="Draw"
              >
                <span className={styles.toolIcon}>🖍</span>
                {showTooltip === 'draw' && (
                  <span className={styles.tooltip}>Draw</span>
                )}
              </button>
            </div>

            {currentTool && (
              <div className={styles.toolDrawer}>
                {currentTool === 'sticker' && <StickerPicker />}
                {currentTool === 'text' && <TextTool />}
                {currentTool === 'draw' && <DrawTool />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Toolbar - Actions */}
      <div className={styles.bottomToolbar}>
        <div className={styles.bottomToolbarContent}>
          <div className={styles.viewButtons}>
            <button
              className={`${styles.viewButton} ${mode === 'envelope-front' ? styles.active : ''}`}
              onClick={() => {
                if (isEnvelopeOpen) {
                  closeEnvelope()
                }
                setMode('envelope-front')
              }}
            >
              Front
            </button>
            <button
              className={`${styles.viewButton} ${mode === 'envelope-back' ? styles.active : ''}`}
              onClick={() => {
                if (isEnvelopeOpen) {
                  closeEnvelope()
                }
                setMode('envelope-back')
              }}
            >
              Back
            </button>
            <button
              className={`${styles.viewButton} ${mode === 'postcard' ? styles.active : ''}`}
              onClick={() => {
                if (isEnvelopeOpen) {
                  closeEnvelope()
                  setMode('envelope-front')
                } else {
                  openEnvelope()
                  setMode('postcard')
                }
              }}
            >
              Card
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
