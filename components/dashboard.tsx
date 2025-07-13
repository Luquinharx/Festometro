"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Calendar,
  Gift,
  Heart,
  Crown,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Filter,
  Sparkles,
  PartyPopper,
  Star,
  Zap,
  Baby,
  Search,
  Wallet,
  PiggyBank,
  Receipt,
  Target,
} from "lucide-react"
import { getGuests, createGuest, createExpense, type Party, type Guest } from "@/lib/firestore"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface DashboardProps {
  parties: Party[]
  selectedParty: Party | null
}

export function Dashboard({ parties, selectedParty }: DashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid" | "adults" | "children">("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [guestFormData, setGuestFormData] = useState({
    name: "",
    category: "adult" as "adult" | "child",
    age: "",
    paid: false,
    observations: "",
  })

  const [expenseFormData, setExpenseFormData] = useState({
    description: "",
    amount: "",
    category: "other" as "food" | "decoration" | "entertainment" | "venue" | "other",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    if (user && selectedParty) {
      loadGuests()
    } else {
      setGuests([])
      setLoading(false)
    }
  }, [user, selectedParty])

  const loadGuests = async () => {
    if (!user || !selectedParty) return
    try {
      setLoading(true)
      const partyGuests = await getGuests(user.uid, selectedParty.id)
      setGuests(partyGuests)
    } catch (error) {
      console.error("Erro ao carregar convidados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedParty) return

    try {
      const age = guestFormData.age ? parseInt(guestFormData.age) : undefined
      const isChild = guestFormData.category === "child" || (age !== undefined && age <= selectedParty.childAgeLimit)

      await createGuest(user.uid, {
        name: guestFormData.name,
        category: isChild ? "child" : "adult",
        age,
        paid: isChild ? true : guestFormData.paid,
        observations: guestFormData.observations,
        partyId: selectedParty.id,
      })

      setShowGuestDialog(false)
      setGuestFormData({
        name: "",
        category: "adult",
        age: "",
        paid: false,
        observations: "",
      })
      
      await loadGuests()

      toast({
        title: "Convidado adicionado! 🎉",
        description: `${guestFormData.name} foi adicionado à lista.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar convidado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedParty) return

    try {
      await createExpense(user.uid, {
        description: expenseFormData.description,
        amount: parseFloat(expenseFormData.amount),
        category: expenseFormData.category,
        date: new Date(expenseFormData.date),
        notes: expenseFormData.notes,
        partyId: selectedParty.id,
      })

      setShowExpenseDialog(false)
      setExpenseFormData({
        description: "",
        amount: "",
        category: "other",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      })

      toast({
        title: "Gasto registrado! 💰",
        description: `${expenseFormData.description} foi adicionado aos gastos.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao registrar gasto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const stats = {
    totalGuests: guests.length,
    adults: guests.filter((g) => g.category === "adult").length,
    children: guests.filter((g) => g.category === "child").length,
    paidGuests: guests.filter((g) => g.paid).length,
    unpaidGuests: guests.filter((g) => !g.paid && g.category === "adult").length,
    totalRevenue: guests.filter((g) => g.paid && g.category === "adult").length * (selectedParty?.pricePerPerson || 0),
    pendingRevenue:
      guests.filter((g) => !g.paid && g.category === "adult").length * (selectedParty?.pricePerPerson || 0),
    paymentPercentage:
      guests.filter((g) => g.category === "adult").length > 0
        ? Math.round(
            (guests.filter((g) => g.paid && g.category === "adult").length /
              guests.filter((g) => g.category === "adult").length) *
              100,
          )
        : 0,
  }

  const filteredGuests = guests.filter((guest) => {
    const matchesFilter = 
      filter === "all" ||
      (filter === "paid" && guest.paid) ||
      (filter === "unpaid" && !guest.paid && guest.category === "adult") ||
      (filter === "adults" && guest.category === "adult") ||
      (filter === "children" && guest.category === "child")
    
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-20 h-20 border-4 border-transparent border-t-[#FF90BB] rounded-full"></div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Gift className="h-8 w-8 text-[#FF90BB]" />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  if (!selectedParty) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <div className="w-24 h-24 bg-festometro-pink rounded-3xl flex items-center justify-center shadow-2xl">
                <PartyPopper className="h-12 w-12 text-white animate-bounce-soft" />
              </div>
            </motion.div>
            <h1 className="text-6xl font-bold text-gradient font-dancing mb-4">
              Bem-vindo ao Festometrô! ✨
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sua plataforma completa para organizar festas inesquecíveis com controle total de convidados e finanças
            </p>
          </motion.div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <Card className="glass-card hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total de Festas</p>
                      <p className="text-4xl font-bold text-festometro-pink">{parties.length}</p>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 bg-festometro-pink rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <Gift className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <Card className="glass-card hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Festas Ativas</p>
                      <p className="text-4xl font-bold text-festometro-blue">
                        {parties.filter((p) => p.date >= new Date()).length}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 bg-festometro-blue rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <Calendar className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <Card className="glass-card hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Convidados</p>
                      <p className="text-4xl font-bold text-festometro-purple">0</p>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="w-16 h-16 bg-festometro-purple rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <Users className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <Card className="glass-card hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Receita Total</p>
                      <p className="text-4xl font-bold text-festometro-green">R$ 0,00</p>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-16 h-16 bg-festometro-green rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <DollarSign className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Welcome Section */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card className="glass-card overflow-hidden">
              <div className="gradient-festometro p-8">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-4xl font-bold mb-4 font-dancing">
                      {parties.length === 0 ? "Crie sua primeira festa! 🎉" : "Selecione uma festa para começar! 🎊"}
                    </h2>
                    <p className="text-white/90 mb-6 text-lg max-w-2xl">
                      {parties.length === 0
                        ? "Comece criando sua primeira festa e descubra como é fácil organizar eventos inesquecíveis com controle total de convidados e finanças."
                        : "Escolha uma festa no menu superior para ver estatísticas detalhadas, gerenciar convidados e controlar os gastos."}
                    </p>
                    <div className="flex gap-4">
                      <Button className="bg-white text-[#FF90BB] hover:bg-white/90 font-semibold px-8 py-3 rounded-xl shadow-lg">
                        <Plus className="h-5 w-5 mr-2" />
                        {parties.length === 0 ? "Criar Primeira Festa" : "Nova Festa"}
                      </Button>
                      {parties.length > 0 && (
                        <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 rounded-xl">
                          <Sparkles className="h-5 w-5 mr-2" />
                          Ver Festas
                        </Button>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ float: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="hidden lg:block"
                  >
                    <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Crown className="h-20 w-20 text-white animate-scale-pulse" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            <Card className="glass-card hover-lift">
              <CardContent className="p-8 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 bg-festometro-pink rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Users className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gestão de Convidados</h3>
                <p className="text-gray-600">Controle completo da lista de presença com categorias e pagamentos</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardContent className="p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 bg-festometro-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <DollarSign className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Controle Financeiro</h3>
                <p className="text-gray-600">Gerencie orçamento, gastos e receitas com relatórios detalhados</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardContent className="p-8 text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="w-16 h-16 bg-festometro-purple rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Heart className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Colaboração</h3>
                <p className="text-gray-600">Convide colaboradores para ajudar na organização da festa</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-gradient font-dancing mb-2">Dashboard</h1>
            <p className="text-gray-600 text-lg">Visão geral da festa selecionada</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="glass-card border-0 hover:bg-white/70">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white text-gray-900">
                <DialogHeader>
                  <DialogTitle className="font-dancing text-xl">Filtrar Convidados</DialogTitle>
                  <DialogDescription>
                    Escolha como visualizar a lista de convidados
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={filter === "all" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("all")}
                      className={filter === "all" ? "btn-festometro" : ""}
                    >
                      Todos ({stats.totalGuests})
                    </Button>
                    <Button 
                      variant={filter === "paid" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("paid")}
                      className={filter === "paid" ? "btn-festometro" : ""}
                    >
                      Pagos ({stats.paidGuests})
                    </Button>
                    <Button 
                      variant={filter === "unpaid" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("unpaid")}
                      className={filter === "unpaid" ? "btn-festometro" : ""}
                    >
                      Pendentes ({stats.unpaidGuests})
                    </Button>
                    <Button 
                      variant={filter === "adults" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("adults")}
                      className={filter === "adults" ? "btn-festometro" : ""}
                    >
                      Adultos ({stats.adults})
                    </Button>
                    <Button 
                      variant={filter === "children" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setFilter("children")}
                      className={filter === "children" ? "btn-festometro" : ""}
                    >
                      Crianças ({stats.children})
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Buscar por nome</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Digite o nome do convidado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 input-festometro"
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
              <DialogTrigger asChild>
                <Button className="btn-festometro px-6 py-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Convidado
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white text-gray-900">
                <DialogHeader>
                  <DialogTitle className="font-dancing text-xl">Adicionar Convidado</DialogTitle>
                  <DialogDescription>
                    Adicione um novo convidado à festa
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateGuest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Convidado *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: João Silva"
                      value={guestFormData.name}
                      onChange={(e) => setGuestFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="input-festometro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={guestFormData.category}
                        onValueChange={(value: "adult" | "child") => setGuestFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="input-festometro">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-gray-900">
                          <SelectItem value="adult">Adulto</SelectItem>
                          <SelectItem value="child">Criança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Idade (opcional)</Label>
                      <Input
                        id="age"
                        type="number"
                        min="0"
                        max="120"
                        placeholder="Ex: 25"
                        value={guestFormData.age}
                        onChange={(e) => setGuestFormData(prev => ({ ...prev, age: e.target.value }))}
                        className="input-festometro"
                      />
                    </div>
                  </div>

                  {guestFormData.category === "adult" && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="paid"
                        checked={guestFormData.paid}
                        onChange={(e) => setGuestFormData(prev => ({ ...prev, paid: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="paid">Pagamento confirmado</Label>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações (opcional)</Label>
                    <Textarea
                      id="observations"
                      placeholder="Ex: Vegetariano, alergia a amendoim..."
                      value={guestFormData.observations}
                      onChange={(e) => setGuestFormData(prev => ({ ...prev, observations: e.target.value }))}
                      rows={3}
                      className="input-festometro"
                    />
                  </div>

                  {(guestFormData.category === "child" || 
                    (guestFormData.age && parseInt(guestFormData.age) <= selectedParty.childAgeLimit)) && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <Baby className="h-4 w-4 inline mr-1" />
                        Este convidado é considerado criança e não paga (até {selectedParty.childAgeLimit} anos)
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowGuestDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="btn-festometro">
                      Adicionar Convidado
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
              <DialogTrigger asChild>
                <Button className="btn-secondary px-6 py-3">
                  <Wallet className="h-4 w-4 mr-2" />
                  Lançar Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white text-gray-900">
                <DialogHeader>
                  <DialogTitle className="font-dancing text-xl">Registrar Gasto</DialogTitle>
                  <DialogDescription>
                    Adicione um novo gasto da festa
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Decoração de mesa"
                      value={expenseFormData.description}
                      onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      className="input-festometro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (R$) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 150.00"
                        value={expenseFormData.amount}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: e.target.value }))}
                        required
                        className="input-festometro"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={expenseFormData.date}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                        className="input-festometro"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={expenseFormData.category}
                      onValueChange={(value: "food" | "decoration" | "entertainment" | "venue" | "other") => 
                        setExpenseFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="input-festometro">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-gray-900">
                        <SelectItem value="food">🍕 Alimentação</SelectItem>
                        <SelectItem value="decoration">🎈 Decoração</SelectItem>
                        <SelectItem value="entertainment">🎵 Entretenimento</SelectItem>
                        <SelectItem value="venue">🏠 Local</SelectItem>
                        <SelectItem value="other">📦 Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ex: Comprado na loja X, desconto de 10%..."
                      value={expenseFormData.notes}
                      onChange={(e) => setExpenseFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="input-festometro"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowExpenseDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="btn-secondary">
                      Registrar Gasto
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Party Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-20 h-20 bg-festometro-pink rounded-3xl flex items-center justify-center shadow-lg"
                  >
                    <Gift className="h-10 w-10 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 font-dancing">{selectedParty.name}</h2>
                    <div className="flex items-center gap-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <span className="text-lg">{selectedParty.date.toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        <span className="text-lg">R$ {selectedParty.pricePerPerson.toFixed(2)}/pessoa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        <span className="text-lg">Crianças até {selectedParty.childAgeLimit} anos grátis</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Badge className="badge-festometro px-4 py-2 text-lg">
                  Festa Selecionada
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 bg-festometro-pink rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Users className="h-7 w-7 text-white" />
                  </motion.div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Convidados</p>
                  <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalGuests}</p>
                  <p className="text-sm text-gray-500">
                    {stats.adults} adultos • {stats.children} crianças
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-14 h-14 bg-festometro-blue rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <UserCheck className="h-7 w-7 text-white" />
                  </motion.div>
                  <div className="flex items-center gap-1 text-festometro-blue">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-sm font-medium">+{stats.paymentPercentage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Confirmações</p>
                  <p className="text-4xl font-bold text-gray-900 mb-1">{stats.paidGuests}</p>
                  <p className="text-sm text-gray-500">{stats.unpaidGuests} pendentes</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="w-14 h-14 bg-festometro-green rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <DollarSign className="h-7 w-7 text-white" />
                  </motion.div>
                  <div className="flex items-center gap-1 text-festometro-green">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-sm font-medium">+12%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Receita Confirmada</p>
                  <p className="text-4xl font-bold text-gray-900 mb-1">R$ {stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">R$ {stats.pendingRevenue.toFixed(2)} pendente</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-14 h-14 bg-festometro-orange rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <TrendingUp className="h-7 w-7 text-white" />
                  </motion.div>
                  <div className="flex items-center gap-1 text-festometro-orange">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="text-sm font-medium">{stats.paymentPercentage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Taxa de Confirmação</p>
                  <p className="text-4xl font-bold text-gray-900 mb-1">{stats.paymentPercentage}%</p>
                  <p className="text-sm text-gray-500">dos adultos confirmaram</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900 font-dancing">Receita da Festa</CardTitle>
                    <p className="text-sm text-gray-600">Acompanhe os pagamentos confirmados</p>
                  </div>
                  <Button variant="outline" size="sm" className="glass-card border-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Receita confirmada</span>
                    <span className="text-2xl font-bold text-festometro-blue">R$ {stats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          (stats.totalRevenue / (stats.totalRevenue + stats.pendingRevenue)) * 100,
                          100,
                        )}%`,
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-festometro-blue h-4 rounded-full"
                    ></motion.div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Receita pendente</span>
                    <span className="text-2xl font-bold text-festometro-pink">R$ {stats.pendingRevenue.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total esperado</span>
                      <span className="text-3xl font-bold text-gray-900">
                        R$ {(stats.totalRevenue + stats.pendingRevenue).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 font-dancing">Resumo Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FF90BB]/10 to-[#FFC1DA]/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-festometro-pink rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Adultos</span>
                  </div>
                  <span className="text-2xl font-bold text-festometro-pink">{stats.adults}</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FFC1DA]/10 to-[#FFE5CC]/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-festometro-purple rounded-xl flex items-center justify-center shadow-lg">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Crianças</span>
                  </div>
                  <span className="text-2xl font-bold text-festometro-purple">{stats.children}</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8ACCD5]/10 to-[#B8E6B8]/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-festometro-blue rounded-xl flex items-center justify-center shadow-lg">
                      <UserCheck className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Confirmados</span>
                  </div>
                  <span className="text-2xl font-bold text-festometro-blue">{stats.paidGuests}</span>
                </motion.div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Valor por pessoa</p>
                    <p className="text-3xl font-bold text-gray-900">R$ {selectedParty.pricePerPerson.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900 font-dancing">Lista de Convidados</CardTitle>
                  <p className="text-sm text-gray-600">
                    {filteredGuests.length} de {guests.length} convidados
                    {searchTerm && ` • Busca: "${searchTerm}"`}
                    {filter !== "all" && ` • Filtro: ${filter}`}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="glass-card border-0">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredGuests.length === 0 ? (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-gray-500 text-lg">
                    {guests.length === 0 ? "Nenhum convidado adicionado ainda" : "Nenhum convidado encontrado com os filtros aplicados"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredGuests.slice(0, 10).map((guest, index) => (
                      <motion.div
                        key={guest.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 hover:bg-white/50 rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                              guest.paid
                                ? "bg-festometro-blue"
                                : guest.category === "child"
                                  ? "bg-festometro-purple"
                                  : "bg-gray-100"
                            }`}
                          >
                            {guest.category === "child" ? (
                              <Heart className="h-5 w-5 text-white" />
                            ) : guest.paid ? (
                              <UserCheck className="h-5 w-5 text-white" />
                            ) : (
                              <Users className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{guest.name}</p>
                            <p className="text-sm text-gray-500">
                              {guest.category === "adult" ? "Adulto" : "Criança"}
                              {guest.age && ` • ${guest.age} anos`}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            guest.paid
                              ? "badge-success"
                              : guest.category === "child"
                                ? "badge-info"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                          }
                        >
                          {guest.category === "child" ? "Isento" : guest.paid ? "Pago" : "Pendente"}
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredGuests.length > 10 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-gray-500">
                        Mostrando 10 de {filteredGuests.length} convidados
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}