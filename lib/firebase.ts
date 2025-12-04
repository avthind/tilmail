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

// Convert nested arrays to Firestore-compatible format
function sanitizeForFirestore(data: any): any {
  if (Array.isArray(data)) {
    // Check if it's a nested array (array of arrays)
    if (data.length > 0 && Array.isArray(data[0])) {
      // Convert nested array to object with numeric keys
      return data.reduce((acc: any, item: any, index: number) => {
        // Recursively sanitize each inner array
        acc[index] = Array.isArray(item) 
          ? item.reduce((innerAcc: any, innerItem: any, innerIndex: number) => {
              innerAcc[innerIndex] = innerItem
              return innerAcc
            }, {})
          : item
        return acc
      }, {})
    }
    // Regular array - check if any element is an array
    const hasNestedArrays = data.some(item => Array.isArray(item))
    if (hasNestedArrays) {
      // Convert to object
      return data.reduce((acc: any, item: any, index: number) => {
        acc[index] = sanitizeForFirestore(item)
        return acc
      }, {})
    }
    // Simple array of primitives - keep as array
    return data
  } else if (data && typeof data === 'object') {
    // Recursively sanitize object properties
    const sanitized: any = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeForFirestore(data[key])
      }
    }
    return sanitized
  }
  return data
}

// Convert Firestore format back to nested arrays
function desanitizeFromFirestore(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => desanitizeFromFirestore(item))
  } else if (data && typeof data === 'object') {
    // Check if it's a converted nested array (object with numeric keys)
    const keys = Object.keys(data)
    const isNestedArray = keys.length > 0 && keys.every(key => /^\d+$/.test(key))
    
    if (isNestedArray) {
      // Convert back to nested array
      const maxIndex = Math.max(...keys.map(k => parseInt(k)))
      return Array.from({ length: maxIndex + 1 }, (_, i) => 
        desanitizeFromFirestore(data[i.toString()])
      )
    }
    
    // Regular object
    const desanitized: any = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        desanitized[key] = desanitizeFromFirestore(data[key])
      }
    }
    return desanitized
  }
  return data
}

export async function saveCard(decorations: FaceDecorations): Promise<string> {
  // Sanitize decorations to convert nested arrays to Firestore-compatible format
  const sanitizedDecorations = sanitizeForFirestore(decorations)
  
  const cardData: CardData = {
    decorations: sanitizedDecorations as FaceDecorations,
    createdAt: Date.now(),
  }

  const docRef = await addDoc(collection(db, 'cards'), cardData)
  return docRef.id
}

export async function loadCard(cardId: string): Promise<CardData | null> {
  const docRef = doc(db, 'cards', cardId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const data = docSnap.data() as CardData
    // Desanitize decorations to convert back to nested arrays
    return {
      ...data,
      decorations: desanitizeFromFirestore(data.decorations) as FaceDecorations
    }
  }
  return null
}

export async function uploadImage(file: File): Promise<string> {
  const storageRef = ref(storage, `images/${Date.now()}_${file.name}`)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}

