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
    selectedDecoration,
    setSelectedDecoration,
    decorations,
    removeDecoration,
    undo,
    redo,
    canUndo,
    canRedo,
    copyDecoration,
    pasteDecoration,
    duplicateDecoration,
  } = useAppStore()

  const handleDelete = () => {
    // Delete selected decoration (works globally, not just in grab mode)
    if (selectedDecoration) {
      removeDecoration(selectedDecoration.face, selectedDecoration.id)
      setSelectedDecoration(null)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Allow Ctrl+Z, Ctrl+C, Ctrl+V, Ctrl+D in text inputs
        if (e.key === 'z' || e.key === 'c' || e.key === 'v' || e.key === 'd') {
          if (e.ctrlKey || e.metaKey) {
            return // Let browser handle it
          }
        } else {
          return // Don't interfere with typing
        }
      }

      // Escape - Deselect and close tools
      if (e.key === 'Escape') {
        setSelectedSticker(null)
        setSelectedDecoration(null)
        setTool(null)
        return
      }

      // Delete/Backspace - Delete selected item
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDecoration) {
        e.preventDefault()
        handleDelete()
        return
      }

      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) {
          undo()
        }
        return
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (canRedo()) {
          redo()
        }
        return
      }

      // Ctrl+Y / Cmd+Y - Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        if (canRedo()) {
          redo()
        }
        return
      }

      // Ctrl+C / Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        if (selectedDecoration) {
          copyDecoration()
        }
        return
      }

      // Ctrl+V / Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteDecoration()
        return
      }

      // Ctrl+D / Cmd+D - Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        if (selectedDecoration) {
          duplicateDecoration()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setTool, setSelectedSticker, setSelectedDecoration, selectedDecoration, canUndo, canRedo, undo, redo, copyDecoration, pasteDecoration, duplicateDecoration])

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
      // Clear sticker selection when closing tool
      if (currentTool === 'sticker') {
        setSelectedSticker(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [currentTool, setTool, setSelectedSticker])

  const handleToolClick = (tool: 'sticker' | 'text' | 'draw' | 'grab') => {
    if (currentTool === tool) {
      setTool(null)
      // Clear selections when closing tool
      if (tool === 'sticker') {
        setSelectedSticker(null)
      }
      // Clear decoration selection when closing grab or text tool
      if (tool === 'grab' || tool === 'text') {
        setSelectedDecoration(null)
      }
    } else {
      setTool(tool)
      // Clear sticker selection when switching to a different tool
      if (currentTool === 'sticker') {
        setSelectedSticker(null)
      }
      // Clear decoration selection when switching away from grab or text tool
      if (currentTool === 'grab' || currentTool === 'text') {
        setSelectedDecoration(null)
      }
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
                <circle cx="9" cy="9" r="2"></circle>
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
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
          
          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionButton} ${currentTool === 'grab' ? styles.active : ''}`}
              onClick={() => handleToolClick('grab')}
              aria-label="Grab and move"
              title="Grab and move"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 9 2 12 5 15"></polyline>
                <polyline points="9 5 12 2 15 5"></polyline>
                <polyline points="15 19 12 22 9 19"></polyline>
                <polyline points="19 9 22 12 19 15"></polyline>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
            </button>
            <button
              className={styles.actionButton}
              onClick={undo}
              disabled={!canUndo()}
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"></path>
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
              </svg>
            </button>
            <button
              className={styles.actionButton}
              onClick={redo}
              disabled={!canRedo()}
              aria-label="Redo"
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6"></path>
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>
              </svg>
            </button>
            <button
              className={styles.actionButton}
              onClick={handleDelete}
              disabled={!selectedDecoration}
              aria-label="Delete selected decoration"
              title="Delete (Delete/Backspace)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>

          {currentTool && currentTool !== 'grab' && (
            <div 
              className={styles.toolDrawer}
              style={{
                top: currentTool === 'sticker' ? '0px' : 
                     currentTool === 'text' ? '52px' : 
                     '104px' // draw button position (52px text + 44px button + 8px gap)
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
