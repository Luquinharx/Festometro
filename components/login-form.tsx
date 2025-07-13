"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "./auth-provider"
import {
  Eye,
  EyeOff,
  Users,
  Calendar,
  CreditCard,
  Sparkles,
  Star,
  Heart,
  PartyPopper,
  AlertCircle,
  Loader2,
  Crown,
  Zap,
} from "lucide-react"

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [generalError, setGeneralError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })

  const { signIn, signUp } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpar erros quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
    setGeneralError("")
  }

  const validateForm = (isSignUp = false) => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória"
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres"
    }

    if (isSignUp) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirmação de senha é obrigatória"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Senhas não coincidem"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getErrorMessage = (error: any) => {
    console.log("🔍 Analyzing error:", error)
    if (!error?.code) {
      return "Erro desconhecido. Verifique sua conexão e tente novamente."
    }

    const errorMessages: { [key: string]: string } = {
      "auth/user-not-found": "Usuário não encontrado. Verifique o email ou crie uma conta.",
      "auth/wrong-password": "Senha incorreta. Tente novamente.",
      "auth/invalid-email": "Email inválido. Verifique o formato.",
      "auth/email-already-in-use": "Este email já está em uso. Tente fazer login.",
      "auth/weak-password": "Senha muito fraca. Use pelo menos 6 caracteres.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
      "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
      "auth/invalid-credential": "Credenciais inválidas. Verifique email e senha.",
      "auth/user-disabled": "Esta conta foi desabilitada.",
      "auth/operation-not-allowed": "Operação não permitida. Contate o suporte.",
      "auth/invalid-login-credentials": "Email ou senha incorretos.",
    }

    return errorMessages[error.code] || `Erro: ${error.message}`
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 Starting sign in process...")
    setGeneralError("")
    setLoading(true)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      console.log("📧 Email:", formData.email.trim())
      await signIn(formData.email.trim(), formData.password)
      console.log("✅ Login realizado com sucesso!")
    } catch (error: any) {
      console.error("❌ Login failed:", error)
      const errorMessage = getErrorMessage(error)
      setGeneralError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 Starting sign up process...")
    setGeneralError("")
    setLoading(true)

    if (!validateForm(true)) {
      setLoading(false)
      return
    }

    try {
      console.log("📧 Creating account for:", formData.email.trim())
      await signUp(formData.email.trim(), formData.password)
      console.log("✅ Conta criada com sucesso!")
    } catch (error: any) {
      console.error("❌ Sign up failed:", error)
      const errorMessage = getErrorMessage(error)
      setGeneralError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
    })
    setErrors({})
    setGeneralError("")
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem e Informações */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
        {/* Imagem de fundo de festa */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')`,
            filter: "blur(2px) brightness(0.7)",
          }}
        />

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20" />

        {/* Partículas decorativas */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            >
              <div className="w-2 h-2 bg-white/30 rounded-full" />
            </div>
          ))}
        </div>

        {/* Conteúdo do lado esquerdo */}
        <div className="relative z-10 p-12 flex flex-col justify-center h-full text-white">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center">
                <PartyPopper className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold">Festa Manager</h1>
              <h1 className="text-4xl font-bold">Festometrô</h1>
            </div>

            <p className="text-xl mb-8 text-white/90 leading-relaxed">
              Sua plataforma completa para gerenciar festas inesquecíveis
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gestão de Convidados</h3>
                  <p className="text-white/80">Controle completo da lista de presença</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Controle de Pagamentos</h3>
                  <p className="text-white/80">Acompanhe pagamentos e contribuições</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Planejamento Completo</h3>
                  <p className="text-white/80">Organize todos os detalhes do seu evento</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium">Experiência Premium</span>
              </div>
              <p className="text-sm text-white/80">Transforme suas celebrações em momentos mágicos e inesquecíveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
            {/* Header do formulário */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
              </h2>
              <p className="text-gray-600">
                {isLogin ? "Entre para gerenciar suas festas" : "Comece a criar eventos incríveis"}
              </p>
            </div>

            {/* Erro geral */}
            {generalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{generalError}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
              <button
                onClick={() => {
                  setIsLogin(true)
                  resetForm()
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  isLogin
                    ? "bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  resetForm()
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  !isLogin
                    ? "bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Cadastrar
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-white/50 ${
                    errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  }`}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-white/50 pr-12 ${
                      errors.password
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    }`}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-white/50 pr-12 ${
                        errors.confirmPassword
                          ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      }`}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              )}

              {!isLogin && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <p className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-600" />
                    Requisitos da senha:
                  </p>
                  <ul className="space-y-1 text-blue-700 text-sm">
                    <li className={`flex items-center gap-2 ${formData.password.length >= 6 ? "text-green-600" : ""}`}>
                      <span className="text-xs">•</span>
                      Mínimo de 6 caracteres {formData.password.length >= 6 ? "✓" : ""}
                    </li>
                    <li
                      className={`flex items-center gap-2 ${formData.password === formData.confirmPassword && formData.confirmPassword ? "text-green-600" : ""}`}
                    >
                      <span className="text-xs">•</span>
                      Senhas devem coincidir{" "}
                      {formData.password === formData.confirmPassword && formData.confirmPassword ? "✓" : ""}
                    </li>
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLogin
                    ? "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600"
                    : "bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isLogin ? "Entrando..." : "Criando conta..."}
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Entrar
                      </>
                    ) : (
                      <>
                        <Crown className="h-5 w-5" />
                        Criar Conta
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            {/* Dicas */}
            <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-800">Dicas</span>
              </div>
              <div className="space-y-1 text-sm text-purple-700">
                <p className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  Use um email válido para recuperação
                </p>
                <p className="flex items-center gap-2">
                  <Heart className="h-3 w-3" />
                  Senha segura com pelo menos 6 caracteres
                </p>
                <p className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Verifique sua conexão com a internet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
