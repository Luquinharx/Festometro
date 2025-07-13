"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Calendar, DollarSign, Users, Edit, Trash2, PartyPopper } from "lucide-react"
import { createParty, updateParty, deleteParty, type Party } from "@/lib/firestore"
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

interface PartyManagerProps {
  parties: Party[]
  onPartyCreated: (party: Party) => void
  onPartyDeleted: (partyId: string) => void
  onPartyUpdated: () => void
  selectedParty: Party | null
  onPartySelected: (party: Party) => void
}

export function PartyManager({
  parties,
  onPartyCreated,
  onPartyDeleted,
  onPartyUpdated,
  selectedParty,
  onPartySelected,
}: PartyManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    pricePerPerson: 50,
    childAgeLimit: 7,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      pricePerPerson: 50,
      childAgeLimit: 7,
    })
  }

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const partyId = await createParty(user.uid, {
        name: formData.name,
        date: new Date(formData.date),
        pricePerPerson: formData.pricePerPerson,
        childAgeLimit: formData.childAgeLimit,
      })

      const newParty: Party = {
        id: partyId,
        name: formData.name,
        date: new Date(formData.date),
        pricePerPerson: formData.pricePerPerson,
        childAgeLimit: formData.childAgeLimit,
        userId: user.uid,
        createdAt: new Date(),
      }

      onPartyCreated(newParty)
      setShowCreateDialog(false)
      resetForm()

      toast({
        title: "Festa criada com sucesso!",
        description: `A festa "${formData.name}" foi criada.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao criar festa",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingParty) return

    setLoading(true)
    try {
      await updateParty(editingParty.id, {
        name: formData.name,
        date: new Date(formData.date),
        pricePerPerson: formData.pricePerPerson,
        childAgeLimit: formData.childAgeLimit,
      })

      onPartyUpdated()
      setShowEditDialog(false)
      setEditingParty(null)
      resetForm()

      toast({
        title: "Festa atualizada com sucesso!",
        description: `A festa "${formData.name}" foi atualizada.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar festa",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteParty = async (party: Party) => {
    try {
      await deleteParty(party.id)
      onPartyDeleted(party.id)

      toast({
        title: "Festa excluída com sucesso!",
        description: `A festa "${party.name}" foi excluída.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir festa",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (party: Party) => {
    setEditingParty(party)
    setFormData({
      name: party.name,
      date: party.date.toISOString().split("T")[0],
      pricePerPerson: party.pricePerPerson,
      childAgeLimit: party.childAgeLimit,
    })
    setShowEditDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Minhas Festas</h2>
          <p className="text-gray-600">Gerencie suas festas e eventos</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Festa
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900 font-dancing text-xl">Criar Nova Festa</DialogTitle>
              <DialogDescription className="text-gray-600">
                Preencha os dados da sua festa para começar a gerenciar os convidados.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateParty} className="space-y-4 text-gray-900">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 font-medium">
                  Nome da Festa *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Aniversário da Maria"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-gray-900 font-medium">
                  Data da Festa *
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-900 font-medium">
                    Valor por Pessoa (R$)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerPerson}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, pricePerPerson: Number.parseFloat(e.target.value) || 0 }))
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childAge" className="text-gray-900 font-medium">
                    Idade limite criança
                  </Label>
                  <Input
                    id="childAge"
                    type="number"
                    min="0"
                    max="18"
                    value={formData.childAgeLimit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, childAgeLimit: Number.parseInt(e.target.value) || 0 }))
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                Crianças até {formData.childAgeLimit} anos não pagam
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
                  className="btn-festometro"
                >
                  {loading ? "Criando..." : "Criar Festa"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {parties.length === 0 ? (
        <div className="text-center py-12">
          <PartyPopper className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma festa criada ainda</h3>
          <p className="text-gray-600 mb-4">Crie sua primeira festa para começar a gerenciar convidados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map((party) => (
            <Card
              key={party.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedParty?.id === party.id ? "ring-2 ring-pink-400 shadow-lg" : ""
              }`}
              onClick={() => onPartySelected(party)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{party.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {party.date.toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </div>
                  {selectedParty?.id === party.id && <Badge className="bg-pink-400">Selecionada</Badge>}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>R$ {party.pricePerPerson.toFixed(2)}/pessoa</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Até {party.childAgeLimit} anos grátis</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditDialog(party)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir festa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a festa "{party.name}"? Esta ação não pode ser desfeita e todos
                          os convidados serão removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteParty(party)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
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

      {/* Dialog de edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-dancing text-xl">Editar Festa</DialogTitle>
            <DialogDescription className="text-gray-600">Atualize os dados da sua festa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditParty} className="space-y-4 text-gray-900">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-900 font-medium">
                Nome da Festa *
              </Label>
              <Input
                id="edit-name"
                placeholder="Ex: Aniversário da Maria"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date" className="text-gray-900 font-medium">
                Data da Festa *
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-gray-900 font-medium">
                  Valor por Pessoa (R$)
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerPerson}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pricePerPerson: Number.parseFloat(e.target.value) || 0 }))
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-childAge" className="text-gray-900 font-medium">
                  Idade limite criança
                </Label>
                <Input
                  id="edit-childAge"
                  type="number"
                  min="0"
                  max="18"
                  value={formData.childAgeLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, childAgeLimit: Number.parseInt(e.target.value) || 0 }))
                  }
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              Crianças até {formData.childAgeLimit} anos não pagam
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
                className="btn-festometro"
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