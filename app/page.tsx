'use client'

import CardCanvas from '@/components/CardCanvas'
import Toolbar from '@/components/Toolbar'
import SendModal from '@/components/SendModal'
import { useAppStore } from '@/store/appStore'
import styles from './page.module.css'

export default function Home() {
  const { showSendModal, setShowSendModal } = useAppStore()

  return (
    <main className={styles.main}>
      <CardCanvas />
      <Toolbar />
      {showSendModal && (
        <SendModal onClose={() => setShowSendModal(false)} />
      )}
    </main>
  )
}

