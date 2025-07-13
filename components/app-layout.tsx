"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sparkles,
  Users,
  BarChart3,
  LogOut,
  Plus,
  Calendar,
  Star,
  Heart,
  Gift,
  UserPlus,
  Bell,
  Menu,
  Crown,
  ChevronDown,
  RefreshCw,
} from "lucide-react"
import { Dashboard } from "./dashboard"
import { PartyManager } from "./party-manager"
import { GuestManager } from "./guest-manager"
import { CollaboratorManager } from "./collaborator-manager"
import { InviteNotifications } from "./invite-notifications"
import {
  getParties,
  subscribeToInvites,
  testFirestoreConnection,
  checkFirestoreIndexes,
  debugListAllParties,
  type Party,
  type PartyInvite,
} from "@/lib/firestore"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

type View = "dashboard" | "parties" | "guests" | "collaborators"

export function AppLayout() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [parties, setParties] = useState<Party[]>([])
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [pendingInvites, setPendingInvites] = useState<PartyInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")

  useEffect(() => {
    if (user) {
      initializeApp()
    }
  }, [user])

  const initializeApp = async () => {
    try {
      console.log("🚀 [APP INIT] Starting app initialization...")

      // Testar conexão com Firestore
      setConnectionStatus("checking")
      const isConnected = await testFirestoreConnection()

      if (!isConnected) {
        setConnectionStatus("error")
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível conectar ao banco de dados.",
          variant: "destructive",
        })
        return
      }

      // Verificar índices do Firestore
      await checkFirestoreIndexes()

      setConnectionStatus("connected")
      console.log("✅ [APP INIT] Firestore connection verified")

      // Carregar dados
      await loadParties()
      setupInvitesSubscription()

      console.log("✅ [APP INIT] App initialization completed")
    } catch (error) {
      console.error("❌ [APP INIT] Initialization failed:", error)
      setConnectionStatus("error")

      // Se for erro de índice, mostrar mensagem específica
      if (error.message.includes("index")) {
        toast({
          title: "Configuração do Banco",
          description: "O sistema está configurando os índices necessários. Tente novamente em alguns minutos.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erro de Inicialização",
          description: "Erro ao inicializar a aplicação.",
          variant: "destructive",
        })
      }
    }
  }

  const loadParties = async () => {
    if (!user) return

    try {
      console.log("🎪 [LOAD PARTIES] Starting load for user:", user.uid)
      setLoading(true)

      const userParties = await getParties(user.uid)
      console.log("📋 [LOAD PARTIES] Parties loaded:", userParties.length)

      setParties(userParties)

      // Selecionar primeira festa se necessário
      if (userParties.length > 0) {
        if (!selectedParty || !userParties.find((p) => p.id === selectedParty.id)) {
          console.log("🎯 [LOAD PARTIES] Selecting party:", userParties[0].name)
          setSelectedParty(userParties[0])
        }
      } else {
        setSelectedParty(null)
      }

      console.log("✅ [LOAD PARTIES] Load completed successfully")
    } catch (error: any) {
      console.error("❌ [LOAD PARTIES] Error:", error)
      toast({
        title: "Erro ao carregar festas",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const setupInvitesSubscription = () => {
    if (!user?.email) return

    console.log("🔄 [INVITES SUB] Setting up subscription for:", user.email)
    const unsubscribe = subscribeToInvites(user.email, (invites) => {
      setPendingInvites(invites)
      console.log("📬 [INVITES SUB] Invites updated:", invites.length)
    })

    return unsubscribe
  }

  const handlePartyCreated = async (newParty: Party) => {
    try {
      console.log("🎉 [PARTY CREATED] Handling creation:", newParty.name)

      // Aguardar um pouco para garantir que o Firestore processou
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Recarregar todas as festas
      await loadParties()

      // Buscar a festa na lista atualizada
      const updatedParties = await getParties(user!.uid)
      const createdParty = updatedParties.find((p) => p.id === newParty.id)

      if (createdParty) {
        setSelectedParty(createdParty)
        setCurrentView("guests")

        toast({
          title: "Festa criada com sucesso! 🎉",
          description: `${createdParty.name} foi criada e está pronta para receber convidados.`,
        })

        console.log("✅ [PARTY CREATED] Party found and selected")
      } else {
        console.warn("⚠️ [PARTY CREATED] Party not found in updated list, forcing reload...")

        // Tentar novamente após mais tempo
        setTimeout(async () => {
          await loadParties()
          const retryParties = await getParties(user!.uid)
          const retryParty = retryParties.find((p) => p.id === newParty.id)

          if (retryParty) {
            setSelectedParty(retryParty)
            setCurrentView("guests")
            console.log("✅ [PARTY CREATED] Party found on retry")
          } else {
            console.error("❌ [PARTY CREATED] Party still not found, something is wrong")
            // Debug: listar todas as festas
            await debugListAllParties()
          }
        }, 2000)

        toast({
          title: "Festa criada!",
          description: "A festa foi criada. Carregando dados...",
        })
      }
    } catch (error) {
      console.error("❌ [PARTY CREATED] Error handling creation:", error)
      toast({
        title: "Festa criada",
        description: "A festa foi criada, mas houve um problema ao carregar. Tente atualizar a página.",
        variant: "destructive",
      })
    }
  }

  const handlePartyDeleted = (deletedPartyId: string) => {
    setParties((prev) => prev.filter((p) => p.id !== deletedPartyId))
    if (selectedParty?.id === deletedPartyId) {
      const remainingParties = parties.filter((p) => p.id !== deletedPartyId)
      setSelectedParty(remainingParties.length > 0 ? remainingParties[0] : null)
    }
  }

  const handleInviteAccepted = () => {
    loadParties()
    toast({
      title: "Convite aceito! 🎉",
      description: "Você agora pode gerenciar esta festa.",
    })
  }

  const handleInviteDeclined = () => {
    toast({
      title: "Convite recusado",
      description: "O convite foi recusado.",
    })
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      await loadParties()
      toast({
        title: "Dados atualizados",
        description: "As informações foram recarregadas.",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive",
      })
    }
  }

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Visão geral das suas festas",
    },
    {
      id: "parties",
      label: "Festas",
      icon: Sparkles,
      description: "Gerencie suas celebrações",
    },
    {
      id: "guests",
      label: "Convidados",
      icon: Users,
      description: "Lista de convidados",
      disabled: !selectedParty,
    },
    {
      id: "collaborators",
      label: "Colaboradores",
      icon: UserPlus,
      description: "Gerencie colaboradores",
      disabled: !selectedParty,
    },
  ]

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full"></div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sparkles className="h-6 w-6 text-blue-600" />
            </motion.div>
          </motion.div>
        </div>
      )
    }

    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1"
        >
          {currentView === "dashboard" && <Dashboard parties={parties} selectedParty={selectedParty} />}
          {currentView === "parties" && (
            <PartyManager
              parties={parties}
              onPartyCreated={handlePartyCreated}
              onPartyDeleted={handlePartyDeleted}
              onPartyUpdated={loadParties}
              selectedParty={selectedParty}
              onPartySelected={setSelectedParty}
            />
          )}
          {currentView === "guests" && selectedParty ? (
            <GuestManager party={selectedParty} />
          ) : currentView === "guests" ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center max-w-md mx-auto"
              >
                <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma festa selecionada</h3>
                <p className="text-gray-600 mb-6">Crie ou selecione uma festa para gerenciar os convidados</p>
                <Button onClick={() => setCurrentView("parties")} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Festa
                </Button>
              </motion.div>
            </div>
          ) : null}
          {currentView === "collaborators" && selectedParty ? (
            <CollaboratorManager party={selectedParty} onUpdate={loadParties} />
          ) : currentView === "collaborators" ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center max-w-md mx-auto"
              >
                <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma festa selecionada</h3>
                <p className="text-gray-600 mb-6">Selecione uma festa para gerenciar colaboradores</p>
                <Button onClick={() => setCurrentView("parties")} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Ver Festas
                </Button>
              </motion.div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Superior */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e Brand */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="relative"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute -top-1 -right-1"
                >
                  <Star className="h-4 w-4 text-yellow-500" />
                </motion.div>
              </motion.div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-dancing">
                  Festometrô
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-green-500"
                        : connectionStatus === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <span>
                    {connectionStatus === "connected"
                      ? "Online"
                      : connectionStatus === "error"
                        ? "Offline"
                        : "Conectando..."}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Menu Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => !item.disabled && setCurrentView(item.id as View)}
                  disabled={item.disabled}
                  whileHover={{ scale: item.disabled ? 1 : 1.05 }}
                  whileTap={{ scale: item.disabled ? 1 : 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    item.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : currentView === item.id
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title={item.disabled ? "Selecione uma festa primeiro" : item.description}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.disabled && (
                    <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-500">
                      Bloqueado
                    </Badge>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Festa Selecionada e Ações */}
            <div className="flex items-center gap-4">
              {/* Botão de Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="border-gray-300 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>

              {/* Festa Atual */}
              {selectedParty && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="hidden sm:flex items-center gap-2 border-gray-300 bg-transparent"
                    >
                      <Gift className="h-4 w-4 text-blue-600" />
                      <span className="max-w-32 truncate">{selectedParty.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="p-3 border-b">
                      <div className="font-semibold text-gray-900">{selectedParty.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {selectedParty.date.toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    {parties.map((party) => (
                      <DropdownMenuItem
                        key={party.id}
                        onClick={() => setSelectedParty(party)}
                        className={party.id === selectedParty.id ? "bg-blue-50" : ""}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Gift className="h-4 w-4 text-blue-600" />
                          <div className="flex-1 truncate">
                            <div className="font-medium">{party.name}</div>
                            <div className="text-xs text-gray-500">{party.date.toLocaleDateString("pt-BR")}</div>
                          </div>
                          {party.id === selectedParty.id && <Crown className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Notificações */}
              {pendingInvites.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="relative border-yellow-300 bg-yellow-50">
                      <Bell className="h-4 w-4 text-yellow-600" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {pendingInvites.length}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-3 border-b">
                      <div className="font-semibold text-gray-900">Convites Pendentes</div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <InviteNotifications
                        invites={pendingInvites}
                        onInviteAccepted={handleInviteAccepted}
                        onInviteDeclined={handleInviteDeclined}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Menu do Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-300 bg-transparent">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Heart className="w-3 h-3 text-white" />
                    </div>
                    <span className="hidden sm:inline ml-2 max-w-24 truncate">{user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="p-3 border-b">
                    <div className="font-medium text-gray-900">Conta</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menu Mobile */}
              <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden border-gray-300 bg-transparent">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {menuItems.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => {
                        if (!item.disabled) {
                          setCurrentView(item.id as View)
                          setMobileMenuOpen(false)
                        }
                      }}
                      disabled={item.disabled}
                      className={currentView === item.id ? "bg-blue-50" : ""}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.label}</span>
                      {item.disabled && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Bloqueado
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</main>
    </div>
  )
}
