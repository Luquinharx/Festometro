"use client"

import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/login-form"
import { AppLayout } from "@/components/app-layout"
import { useEffect } from "react"

export default function Home() {
  const { user, loading } = useAuth()

  useEffect(() => {
    console.log("Page render - User:", user ? "Logged in" : "Not logged in", "Loading:", loading)
  }, [user, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-400 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log("Rendering login form")
    return <LoginForm />
  }

  console.log("Rendering app layout")
  return <AppLayout />
}
