import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDExZFvgvl8jafN8G9ObRVxT9rYJMQ1A3I",
  authDomain: "festa-c11b9.firebaseapp.com",
  projectId: "festa-c11b9",
  storageBucket: "festa-c11b9.firebasestorage.app",
  messagingSenderId: "778475701419",
  appId: "1:778475701419:web:a1fbb26fa95362dadce3ee",
  measurementId: "G-DX8J69KQ4H",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication
export const auth = getAuth(app)

// Initialize Cloud Firestore
export const db = getFirestore(app)

// Configuração para desenvolvimento (descomente se usar emulators)
// if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099')
//     connectFirestoreEmulator(db, 'localhost', 8080)
//     console.log('🔧 Firebase Emulators connected')
//   } catch (error) {
//     console.log('⚠️ Emulators already connected or not available')
//   }
// }

console.log("🔥 Firebase initialized successfully")
console.log("📊 Project ID:", firebaseConfig.projectId)
console.log("🔐 Auth Domain:", firebaseConfig.authDomain)

export default app
