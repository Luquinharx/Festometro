"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Mail } from "lucide-react"
import { acceptInvite, declineInvite, type PartyInvite } from "@/lib/firestore"
import { motion, AnimatePresence } from "framer-motion"

interface InviteNotificationsProps {
  invites: PartyInvite[]
  onInviteAccepted: () => void
  onInviteDeclined: () => void
}

export function InviteNotifications({ invites, onInviteAccepted, onInviteDeclined }: InviteNotificationsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAcceptInvite = async (invite: PartyInvite) => {
    setLoading(invite.id)
    try {
      await acceptInvite(invite.id, invite.partyId, invite.invitedEmail)
      onInviteAccepted()
      toast({
        title: "Convite aceito! 🎉",
        description: `Você agora pode gerenciar a festa "${invite.partyName}".`,
      })
    } catch (error) {
      toast({
        title: "Erro ao aceitar convite",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDeclineInvite = async (invite: PartyInvite) => {
    setLoading(invite.id)
    try {
      await declineInvite(invite.id)
      onInviteDeclined()
      toast({
        title: "Convite recusado",
        description: `Convite para "${invite.partyName}" foi recusado.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao recusar convite",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  if (invites.length === 0) return null

  return (
    <div className="space-y-3 p-3">
      <AnimatePresence>
        {invites.map((invite, index) => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: index * 0.1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{invite.partyName}</div>
                <div className="text-xs text-gray-600">de {invite.ownerEmail}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAcceptInvite(invite)}
                disabled={loading === invite.id}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
              >
                {loading === invite.id ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Check className="h-3 w-3" />
                  </motion.div>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Aceitar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeclineInvite(invite)}
                disabled={loading === invite.id}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-xs h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Recusar
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
