"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("🔥 Setting up Firebase Auth...")

    // Set persistence
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("✅ Auth persistence set")
      })
      .catch((error) => {
        console.error("❌ Error setting persistence:", error)
      })

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log("🔄 Auth state changed:", user ? `User: ${user.email}` : "No user")
        setUser(user)
        setLoading(false)
      },
      (error) => {
        console.error("❌ Auth state change error:", error)
        setLoading(false)
      },
    )

    return () => {
      console.log("🧹 Cleaning up auth listener")
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 Attempting sign in for:", email)
      setLoading(true)

      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("✅ Sign in successful:", result.user.uid)

      return Promise.resolve()
    } catch (error: any) {
      console.error("❌ Sign in error:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      console.log("📝 Attempting sign up for:", email)
      setLoading(true)

      const result = await createUserWithEmailAndPassword(auth, email, password)
      console.log("✅ Sign up successful:", result.user.uid)

      return Promise.resolve()
    } catch (error: any) {
      console.error("❌ Sign up error:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log("🚪 Attempting sign out...")
      await signOut(auth)
      console.log("✅ Sign out successful")
    } catch (error: any) {
      console.error("❌ Sign out error:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
