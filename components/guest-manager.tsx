"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
import { Plus, Search, Edit, Trash2, Users, UserCheck, Baby, CheckCircle, XCircle } from "lucide-react"
import { createGuest, updateGuest, deleteGuest, subscribeToGuests, type Party, type Guest } from "@/lib/firestore"
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

interface GuestManagerProps {
  party: Party
}

type FilterType = "all" | "paid" | "unpaid" | "adults" | "children"

export function GuestManager({ party }: GuestManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [guests, setGuests] = useState<Guest[]>([])
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")

  const [formData, setFormData] = useState({
    name: "",
    category: "adult" as "adult" | "child",
    age: "",
    paid: false,
    observations: "",
  })

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToGuests(user.uid, party.id, (guestList) => {
      setGuests(guestList)
    })

    return unsubscribe
  }, [user, party.id])

  useEffect(() => {
    let filtered = guests

    // Filtro por categoria/status
    switch (filter) {
      case "paid":
        filtered = filtered.filter((g) => g.paid)
        break
      case "unpaid":
        filtered = filtered.filter((g) => !g.paid && g.category === "adult")
        break
      case "adults":
        filtered = filtered.filter((g) => g.category === "adult")
        break
      case "children":
        filtered = filtered.filter((g) => g.category === "child")
        break
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    setFilteredGuests(filtered)
  }, [guests, filter, searchTerm])

  const resetForm = () => {
    setFormData({
      name: "",
      category: "adult",
      age: "",
      paid: false,
      observations: "",
    })
  }

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const age = formData.age ? Number.parseInt(formData.age) : undefined
      const isChild = formData.category === "child" || (age !== undefined && age <= party.childAgeLimit)

      await createGuest(user.uid, {
        name: formData.name,
        category: isChild ? "child" : "adult",
        age,
        paid: isChild ? true : formData.paid, // Crianças são automaticamente marcadas como pagas (isentas)
        observations: formData.observations,
        partyId: party.id,
      })

      setShowCreateDialog(false)
      resetForm()

      toast({
        title: "Convidado adicionado com sucesso!",
        description: `${formData.name} foi adicionado à lista.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar convidado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGuest) return

    setLoading(true)
    try {
      const age = formData.age ? Number.parseInt(formData.age) : undefined
      const isChild = formData.category === "child" || (age !== undefined && age <= party.childAgeLimit)

      await updateGuest(editingGuest.id, {
        name: formData.name,
        category: isChild ? "child" : "adult",
        age,
        paid: isChild ? true : formData.paid,
        observations: formData.observations,
      })

      setShowEditDialog(false)
      setEditingGuest(null)
      resetForm()

      toast({
        title: "Convidado atualizado com sucesso!",
        description: `${formData.name} foi atualizado.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar convidado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGuest = async (guest: Guest) => {
    try {
      await deleteGuest(guest.id)

      toast({
        title: "Convidado removido com sucesso!",
        description: `${guest.name} foi removido da lista.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao remover convidado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const togglePaymentStatus = async (guest: Guest) => {
    if (guest.category === "child") return // Crianças não podem ter status alterado

    try {
      await updateGuest(guest.id, { paid: !guest.paid })

      toast({
        title: guest.paid ? "Pagamento removido" : "Pagamento confirmado",
        description: `Status de ${guest.name} foi atualizado.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (guest: Guest) => {
    setEditingGuest(guest)
    setFormData({
      name: guest.name,
      category: guest.category,
      age: guest.age?.toString() || "",
      paid: guest.paid,
      observations: guest.observations || "",
    })
    setShowEditDialog(true)
  }

  const stats = {
    total: guests.length,
    adults: guests.filter((g) => g.category === "adult").length,
    children: guests.filter((g) => g.category === "child").length,
    paid: guests.filter((g) => g.paid).length,
    unpaid: guests.filter((g) => !g.paid && g.category === "adult").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Convidados - {party.name}</h2>
          <p className="text-gray-600">Gerencie a lista de convidados da sua festa</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Convidado
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900 font-dancing text-xl">Adicionar Convidado</DialogTitle>
              <DialogDescription className="text-gray-600">
                Adicione um novo convidado à lista da festa.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGuest} className="space-y-4 text-gray-900">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 font-medium">
                  Nome do Convidado *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-900 font-medium">
                    Categoria
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: "adult" | "child") => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      <SelectItem value="adult">Adulto</SelectItem>
                      <SelectItem value="child">Criança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-gray-900 font-medium">
                    Idade (opcional)
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Ex: 25"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>

              {formData.category === "adult" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="paid"
                    checked={formData.paid}
                    onChange={(e) => setFormData((prev) => ({ ...prev, paid: e.target.checked }))}
                    className="rounded border-gray-300 bg-white"
                  />
                  <Label htmlFor="paid" className="text-gray-900 font-medium">
                    Pagamento confirmado
                  </Label>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observations" className="text-gray-900 font-medium">
                  Observações (opcional)
                </Label>
                <Textarea
                  id="observations"
                  placeholder="Ex: Vegetariano, alergia a amendoim..."
                  value={formData.observations}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
                  rows={3}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              {(formData.category === "child" ||
                (formData.age && Number.parseInt(formData.age) <= party.childAgeLimit)) && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <Baby className="h-4 w-4 inline mr-1" />
                    Este convidado é considerado criança e não paga (até {party.childAgeLimit} anos)
                  </p>
                </div>
              )}

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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {loading ? "Adicionando..." : "Adicionar Convidado"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.adults}</div>
                <div className="text-xs text-gray-600">Adultos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Baby className="h-4 w-4 text-pink-600" />
              <div>
                <div className="text-2xl font-bold text-pink-600">{stats.children}</div>
                <div className="text-xs text-gray-600">Crianças</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
                <div className="text-xs text-gray-600">Pagos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.unpaid}</div>
                <div className="text-xs text-gray-600">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar convidado por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            Todos ({stats.total})
          </Button>
          <Button variant={filter === "paid" ? "default" : "outline"} size="sm" onClick={() => setFilter("paid")}>
            Pagos ({stats.paid})
          </Button>
          <Button variant={filter === "unpaid" ? "default" : "outline"} size="sm" onClick={() => setFilter("unpaid")}>
            Pendentes ({stats.unpaid})
          </Button>
          <Button variant={filter === "adults" ? "default" : "outline"} size="sm" onClick={() => setFilter("adults")}>
            Adultos ({stats.adults})
          </Button>
          <Button
            variant={filter === "children" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("children")}
          >
            Crianças ({stats.children})
          </Button>
        </div>
      </div>

      {/* Guest List */}
      {filteredGuests.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {guests.length === 0 ? "Nenhum convidado adicionado ainda" : "Nenhum convidado encontrado"}
          </h3>
          <p className="text-gray-600 mb-4">
            {guests.length === 0
              ? "Adicione o primeiro convidado à sua festa"
              : "Tente ajustar os filtros ou termo de busca"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuests.map((guest) => (
            <Card key={guest.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{guest.name}</h3>
                    {guest.age && <p className="text-sm text-gray-600">{guest.age} anos</p>}
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={guest.category === "adult" ? "default" : "secondary"}>
                      {guest.category === "adult" ? "Adulto" : "Criança"}
                    </Badge>
                    <Badge
                      variant={guest.paid ? "default" : "destructive"}
                      className={guest.paid ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {guest.category === "child" ? "Isento" : guest.paid ? "Pago" : "Pendente"}
                    </Badge>
                  </div>
                </div>

                {guest.observations && <p className="text-sm text-gray-600 mb-3 italic">"{guest.observations}"</p>}

                <div className="flex gap-2">
                  {guest.category === "adult" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePaymentStatus(guest)}
                      className={guest.paid ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                      {guest.paid ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Remover Pagamento
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar Pagamento
                        </>
                      )}
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={() => openEditDialog(guest)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover convidado</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover "{guest.name}" da lista de convidados? Esta ação não pode ser
                          desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteGuest(guest)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-dancing text-xl">Editar Convidado</DialogTitle>
            <DialogDescription className="text-gray-600">Atualize as informações do convidado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditGuest} className="space-y-4 text-gray-900">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-900 font-medium">
                Nome do Convidado *
              </Label>
              <Input
                id="edit-name"
                placeholder="Ex: João Silva"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-gray-900 font-medium">
                  Categoria
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "adult" | "child") => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="adult">Adulto</SelectItem>
                    <SelectItem value="child">Criança</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-age" className="text-gray-900 font-medium">
                  Idade (opcional)
                </Label>
                <Input
                  id="edit-age"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="Ex: 25"
                  value={formData.age}
                  onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>

            {formData.category === "adult" && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-paid"
                  checked={formData.paid}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paid: e.target.checked }))}
                  className="rounded border-gray-300 bg-white"
                />
                <Label htmlFor="edit-paid" className="text-gray-900 font-medium">
                  Pagamento confirmado
                </Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-observations" className="text-gray-900 font-medium">
                Observações (opcional)
              </Label>
              <Textarea
                id="edit-observations"
                placeholder="Ex: Vegetariano, alergia a amendoim..."
                value={formData.observations}
                onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
                rows={3}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            {(formData.category === "child" ||
              (formData.age && Number.parseInt(formData.age) <= party.childAgeLimit)) && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Baby className="h-4 w-4 inline mr-1" />
                  Este convidado é considerado criança e não paga (até {party.childAgeLimit} anos)
                </p>
              </div>
            )}

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
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
