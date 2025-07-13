"use client"

import type React from "react"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Mail, Trash2, Crown, Users, Send, Shield } from "lucide-react"
import { inviteCollaborator, removeCollaborator, type Party } from "@/lib/firestore"
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
import { motion } from "framer-motion"

interface CollaboratorManagerProps {
  party: Party
  onUpdate: () => void
}

export function CollaboratorManager({ party, onUpdate }: CollaboratorManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const isOwner = party.userId === user?.uid

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return

    setLoading(true)
    try {
      // Validações
      if (!inviteEmail.trim()) {
        toast({
          title: "Email obrigatório",
          description: "Por favor, insira um email válido.",
          variant: "destructive",
        })
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido.",
          variant: "destructive",
        })
        return
      }

      // Verificar se o email já é colaborador
      if (party.collaborators.includes(inviteEmail.trim())) {
        toast({
          title: "Email já é colaborador",
          description: "Este email já tem acesso a esta festa.",
          variant: "destructive",
        })
        return
      }

      // Verificar se não é o próprio dono
      if (inviteEmail.trim() === user.email) {
        toast({
          title: "Não é possível convidar a si mesmo",
          description: "Você já é o dono desta festa.",
          variant: "destructive",
        })
        return
      }

      await inviteCollaborator(party.id, party.name, user.email, inviteEmail.trim())

      setShowInviteDialog(false)
      setInviteEmail("")

      toast({
        title: "Convite enviado! 📧",
        description: `Um convite foi enviado para ${inviteEmail.trim()}.`,
      })
    } catch (error: any) {
      console.error("Error inviting collaborator:", error)
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorEmail: string) => {
    try {
      await removeCollaborator(party.id, collaboratorEmail)
      onUpdate()

      toast({
        title: "Colaborador removido",
        description: `${collaboratorEmail} foi removido da festa.`,
      })
    } catch (error) {
      console.error("Error removing collaborator:", error)
      toast({
        title: "Erro ao remover colaborador",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-dancing">Colaboradores - {party.name}</h2>
          <p className="text-gray-600 text-lg">Gerencie quem pode ajudar a organizar sua festa</p>
        </div>

        {isOwner && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Convidar Colaborador
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-dancing text-xl">Convidar Colaborador</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Convide alguém para ajudar a gerenciar esta festa. Eles poderão adicionar e gerenciar convidados.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteCollaborator} className="space-y-4 text-gray-900">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 font-medium">
                    Email do Colaborador *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colaborador@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
                    required
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Permissões do Colaborador:</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Visualizar e gerenciar convidados</li>
                    <li>• Adicionar novos convidados</li>
                    <li>• Marcar pagamentos como confirmados</li>
                    <li>• Ver estatísticas da festa</li>
                  </ul>
                </motion.div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteDialog(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="mr-2"
                        >
                          <Send className="h-4 w-4" />
                        </motion.div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Convite
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Crown className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">1</div>
                <div className="text-sm text-gray-600">Proprietário</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Users className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{party.collaborators.length}</div>
                <div className="text-sm text-gray-600">Colaboradores</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Shield className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <div className="text-2xl font-bold text-green-600">{1 + party.collaborators.length}</div>
                <div className="text-sm text-gray-600">Total da Equipe</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de colaboradores */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 font-dancing text-xl flex items-center gap-2">
              <Users className="h-6 w-6" />
              Equipe da Festa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Proprietário */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Crown className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <div className="font-semibold text-gray-900">{user?.email}</div>
                  <div className="text-sm text-gray-600">Proprietário da festa</div>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">Proprietário</Badge>
            </motion.div>

            {/* Colaboradores */}
            {party.collaborators.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum colaborador ainda</h3>
                <p className="text-gray-500">
                  {isOwner
                    ? "Convide pessoas para ajudar a gerenciar esta festa"
                    : "Apenas o proprietário pode convidar colaboradores"}
                </p>
              </motion.div>
            ) : (
              party.collaborators.map((collaboratorEmail, index) => (
                <motion.div
                  key={collaboratorEmail}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.2 }}
                      className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Mail className="h-5 w-5 text-white" />
                    </motion.div>
                    <div>
                      <div className="font-semibold text-gray-900">{collaboratorEmail}</div>
                      <div className="text-sm text-gray-600">Colaborador</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                      Colaborador
                    </Badge>
                    {isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border border-gray-200">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900">Remover colaborador</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                              Tem certeza que deseja remover "{collaboratorEmail}" como colaborador desta festa? Eles
                              perderão acesso imediatamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveCollaborator(collaboratorEmail)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Informações sobre permissões */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 font-dancing text-xl flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Sobre as Permissões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Proprietário</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Controle total da festa</li>
                  <li>• Convidar/remover colaboradores</li>
                  <li>• Editar informações da festa</li>
                  <li>• Excluir a festa</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Colaborador</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Gerenciar convidados</li>
                  <li>• Ver estatísticas</li>
                  <li>• Confirmar pagamentos</li>
                  <li>• Adicionar observações</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
