"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  Upload,
  PiggyBank,
  CreditCard,
  Receipt,
  Target
} from "lucide-react"
import { 
  createExpense, 
  updateExpense, 
  deleteExpense, 
  subscribeToExpenses,
  updatePartyBudget,
  type Party, 
  type Expense 
} from "@/lib/firestore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { motion, AnimatePresence } from "framer-motion"

interface FinanceManagerProps {
  party: Party
}

type FilterType = "all" | "food" | "decoration" | "entertainment" | "venue" | "other"

const expenseCategories = [
  { value: "food", label: "Alimentação", icon: "🍕", color: "from-orange-500 to-red-500" },
  { value: "decoration", label: "Decoração", icon: "🎈", color: "from-pink-500 to-purple-500" },
  { value: "entertainment", label: "Entretenimento", icon: "🎵", color: "from-blue-500 to-cyan-500" },
  { value: "venue", label: "Local", icon: "🏠", color: "from-green-500 to-emerald-500" },
  { value: "other", label: "Outros", icon: "📦", color: "from-gray-500 to-slate-500" },
]

export function FinanceManager({ party }: FinanceManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBudgetDialog, setShowBudgetDialog] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [budgetAmount, setBudgetAmount] = useState(party.budget || 0)

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "other" as FilterType,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToExpenses(user.uid, party.id, (expenseList) => {
      setExpenses(expenseList)
    })

    return unsubscribe
  }, [user, party.id])

  useEffect(() => {
    let filtered = expenses

    // Filtro por categoria
    if (filter !== "all") {
      filtered = filtered.filter((e) => e.category === filter)
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter((e) => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredExpenses(filtered)
  }, [expenses, filter, searchTerm])

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "other",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    })
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      await createExpense(user.uid, {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date),
        notes: formData.notes,
        partyId: party.id,
      })

      setShowCreateDialog(false)
      resetForm()

      toast({
        title: "Gasto adicionado com sucesso! 💰",
        description: `${formData.description} foi registrado.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar gasto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return

    setLoading(true)
    try {
      await updateExpense(editingExpense.id, {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date),
        notes: formData.notes,
      })

      setShowEditDialog(false)
      setEditingExpense(null)
      resetForm()

      toast({
        title: "Gasto atualizado com sucesso!",
        description: `${formData.description} foi atualizado.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar gasto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id)

      toast({
        title: "Gasto removido com sucesso!",
        description: `${expense.description} foi removido.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao remover gasto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateBudget = async () => {
    try {
      await updatePartyBudget(party.id, budgetAmount)
      setShowBudgetDialog(false)
      
      toast({
        title: "Orçamento atualizado!",
        description: `Orçamento definido para R$ ${budgetAmount.toFixed(2)}.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar orçamento",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category as FilterType,
      date: expense.date.toISOString().split("T")[0],
      notes: expense.notes || "",
    })
    setShowEditDialog(true)
  }

  const stats = {
    totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    expenseCount: expenses.length,
    budget: party.budget || 0,
    remaining: (party.budget || 0) - expenses.reduce((sum, expense) => sum + expense.amount, 0),
    categoryBreakdown: expenseCategories.map(cat => ({
      ...cat,
      amount: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0),
      count: expenses.filter(e => e.category === cat.value).length,
    })),
  }

  const budgetPercentage = stats.budget > 0 ? (stats.totalExpenses / stats.budget) * 100 : 0

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-4xl font-bold text-gradient font-dancing">Financeiro - {party.name}</h2>
          <p className="text-gray-600 text-lg mt-2">Controle todos os gastos da sua festa</p>
        </div>

        <div className="flex gap-3">
          <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="glass-card border-0 hover:bg-white/70">
                  <Target className="h-5 w-5 mr-2" />
                  Definir Orçamento
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-dancing text-xl">Definir Orçamento</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Defina o orçamento total para esta festa.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-gray-900 font-medium">
                    Orçamento Total (R$) *
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 5000.00"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBudgetDialog(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateBudget}
                    className="btn-magical text-white font-semibold"
                  >
                    Salvar Orçamento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={resetForm} className="btn-magical text-white px-6 py-3">
                  <Plus className="h-5 w-5 mr-2" />
                  Novo Gasto
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-dancing text-xl">Adicionar Gasto</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Registre um novo gasto da festa.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateExpense} className="space-y-4 text-gray-900">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-900 font-medium">
                    Descrição *
                  </Label>
                  <Input
                    id="description"
                    placeholder="Ex: Decoração de mesa"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-900 font-medium">
                      Valor (R$) *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex: 150.00"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-gray-900 font-medium">
                      Data *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-900 font-medium">
                    Categoria
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: FilterType) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-900 font-medium">
                    Observações (opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Ex: Comprado na loja X, desconto de 10%..."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-magical text-white font-semibold"
                  >
                    {loading ? "Adicionando..." : "Adicionar Gasto"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="glass-card border-0 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <PiggyBank className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <div className="text-2xl font-bold text-green-600">R$ {stats.budget.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Orçamento Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <TrendingDown className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <div className="text-2xl font-bold text-red-600">R$ {stats.totalExpenses.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Gasto</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className={`w-12 h-12 bg-gradient-to-r ${stats.remaining >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-red-500'} rounded-2xl flex items-center justify-center shadow-lg`}
              >
                <Wallet className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <div className={`text-2xl font-bold ${stats.remaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  R$ {Math.abs(stats.remaining).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.remaining >= 0 ? 'Restante' : 'Excedido'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Receipt className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.expenseCount}</div>
                <div className="text-sm text-gray-600">Gastos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Progress */}
      {stats.budget > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-gray-900 font-dancing text-xl flex items-center gap-2">
                <Target className="h-6 w-6" />
                Progresso do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Utilizado</span>
                  <span className="text-lg font-bold text-gray-900">
                    {budgetPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-4 rounded-full transition-all duration-500 ${
                      budgetPercentage <= 70 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : budgetPercentage <= 90
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : 'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">R$ 0</span>
                  <span className="text-gray-600">R$ {stats.budget.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Category Breakdown */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {stats.categoryBreakdown.map((category, index) => (
          <motion.div
            key={category.value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="glass-card border-0 hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center text-lg`}>
                      {category.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{category.label}</div>
                      <div className="text-sm text-gray-600">{category.count} gastos</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">R$ {category.amount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {stats.totalExpenses > 0 ? ((category.amount / stats.totalExpenses) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar gastos por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card border-0"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter("all")}
            className={filter === "all" ? "btn-magical text-white" : "glass-card border-0"}
          >
            Todos ({expenses.length})
          </Button>
          {expenseCategories.map((cat) => {
            const count = expenses.filter(e => e.category === cat.value).length
            return (
              <Button 
                key={cat.value}
                variant={filter === cat.value ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilter(cat.value as FilterType)}
                className={filter === cat.value ? "btn-magical text-white" : "glass-card border-0"}
              >
                {cat.icon} {cat.label} ({count})
              </Button>
            )
          })}
        </div>
      </motion.div>

      {/* Expense List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="h-20 w-20 text-gray-400 mx-auto mb-6 animate-bounce-soft" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4 font-dancing">
              {expenses.length === 0 ? "Nenhum gasto registrado ainda" : "Nenhum gasto encontrado"}
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              {expenses.length === 0
                ? "Adicione o primeiro gasto da sua festa"
                : "Tente ajustar os filtros ou termo de busca"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredExpenses.map((expense, index) => {
                const category = expenseCategories.find(c => c.value === expense.category)
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-card border-0 hover-lift">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-gradient-to-r ${category?.color || 'from-gray-500 to-slate-500'} rounded-xl flex items-center justify-center text-lg`}>
                              {category?.icon || '📦'}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{expense.description}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{expense.date.toLocaleDateString("pt-BR")}</span>
                                </div>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                  {category?.label || 'Outros'}
                                </Badge>
                              </div>
                              {expense.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic">"{expense.notes}"</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">
                                R$ {expense.amount.toFixed(2)}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(expense)}
                                  className="glass-card border-0 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </motion.div>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 glass-card border-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white border border-gray-200">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-900">Remover gasto</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600">
                                      Tem certeza que deseja remover "{expense.description}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteExpense(expense)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-dancing text-xl">Editar Gasto</DialogTitle>
            <DialogDescription className="text-gray-600">Atualize as informações do gasto.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditExpense} className="space-y-4 text-gray-900">
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-gray-900 font-medium">
                Descrição *
              </Label>
              <Input
                id="edit-description"
                placeholder="Ex: Decoração de mesa"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount" className="text-gray-900 font-medium">
                  Valor (R$) *
                </Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 150.00"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-date" className="text-gray-900 font-medium">
                  Data *
                </Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-gray-900 font-medium">
                Categoria
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: FilterType) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-gray-900 font-medium">
                Observações (opcional)
              </Label>
              <Textarea
                id="edit-notes"
                placeholder="Ex: Comprado na loja X, desconto de 10%..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="btn-magical text-white font-semibold"
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}