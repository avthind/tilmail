'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import EnvelopeScene from '@/components/EnvelopeScene'
import CardCanvas from '@/components/CardCanvas'
import Toolbar from '@/components/Toolbar'
import SendModal from '@/components/SendModal'
import { useAppStore } from '@/store/appStore'
import styles from './page.module.css'

export default function Home() {
  const { showSendModal, setShowSendModal } = useAppStore()

  return (
    <main className={styles.main}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <EnvelopeScene />
        </Suspense>
      </Canvas>
      <CardCanvas />
      <Toolbar />
      {showSendModal && (
        <SendModal onClose={() => setShowSendModal(false)} />
      )}
    </main>
  )
}

