import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { FaceDecorations } from '@/store/appStore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)

export interface CardData {
  decorations: FaceDecorations
  createdAt: number
  userId?: string
}

export async function saveCard(decorations: FaceDecorations): Promise<string> {
  const cardData: CardData = {
    decorations,
    createdAt: Date.now(),
  }

  const docRef = await addDoc(collection(db, 'cards'), cardData)
  return docRef.id
}

export async function loadCard(cardId: string): Promise<CardData | null> {
  const docRef = doc(db, 'cards', cardId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data() as CardData
  }
  return null
}

export async function uploadImage(file: File): Promise<string> {
  const storageRef = ref(storage, `images/${Date.now()}_${file.name}`)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}

