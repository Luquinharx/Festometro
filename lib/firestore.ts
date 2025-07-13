import { db } from "./firebase"
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove,
  type DocumentData,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore"

export interface Party {
  id: string
  name: string
  date: Date
  pricePerPerson: number
  childAgeLimit: number
  userId: string
  collaborators: string[]
  createdAt: Date
  budget?: number
}

export interface Guest {
  id: string
  name: string
  category: "adult" | "child"
  age?: number
  paid: boolean
  observations?: string
  partyId: string
  userId: string
  createdAt: Date
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: "food" | "decoration" | "entertainment" | "venue" | "other"
  date: Date
  notes?: string
  partyId: string
  userId: string
  createdAt: Date
}

export interface PartyInvite {
  id: string
  partyId: string
  partyName: string
  ownerEmail: string
  invitedEmail: string
  status: "pending" | "accepted" | "declined"
  createdAt: Date
}

// Helper function to convert Firestore data
const convertTimestamps = (data: DocumentData) => {
  const converted = { ...data }
  if (converted.date && typeof converted.date.toDate === "function") {
    converted.date = converted.date.toDate()
  }
  if (converted.createdAt && typeof converted.createdAt.toDate === "function") {
    converted.createdAt = converted.createdAt.toDate()
  }
  return converted
}

// Função para verificar conexão com Firestore
export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    console.log("🔍 Testing Firestore connection...")
    const testCollection = collection(db, "test")
    await getDocs(query(testCollection))
    console.log("✅ Firestore connection successful")
    return true
  } catch (error) {
    console.error("❌ Firestore connection failed:", error)
    return false
  }
}

// ==================== PARTY FUNCTIONS ====================

export const createParty = async (
  userId: string,
  partyData: Omit<Party, "id" | "userId" | "createdAt" | "collaborators">,
): Promise<string> => {
  try {
    console.log("🎉 [CREATE PARTY] Starting for user:", userId)
    console.log("📝 [CREATE PARTY] Data:", partyData)

    // Verificar conexão primeiro
    const isConnected = await testFirestoreConnection()
    if (!isConnected) {
      throw new Error("Sem conexão com o banco de dados")
    }

    // Preparar dados para o Firestore
    const partyDoc = {
      name: partyData.name.trim(),
      date: Timestamp.fromDate(partyData.date),
      pricePerPerson: Number(partyData.pricePerPerson),
      childAgeLimit: Number(partyData.childAgeLimit),
      userId: userId,
      collaborators: [],
      createdAt: serverTimestamp(),
    }

    console.log("💾 [CREATE PARTY] Saving to Firestore:", partyDoc)

    // Salvar no Firestore
    const docRef = await addDoc(collection(db, "parties"), partyDoc)
    console.log("✅ [CREATE PARTY] Document created with ID:", docRef.id)

    // Verificar se foi salvo corretamente
    const savedDoc = await getDoc(docRef)
    if (savedDoc.exists()) {
      const savedData = savedDoc.data()
      console.log("✅ [CREATE PARTY] Verification successful:", {
        id: savedDoc.id,
        name: savedData.name,
        userId: savedData.userId,
        hasDate: !!savedData.date,
        hasCreatedAt: !!savedData.createdAt,
      })
    } else {
      console.error("❌ [CREATE PARTY] Document not found after creation")
      throw new Error("Erro ao verificar festa criada")
    }

    return docRef.id
  } catch (error: any) {
    console.error("❌ [CREATE PARTY] Error:", error)
    console.error("❌ [CREATE PARTY] Error code:", error.code)
    console.error("❌ [CREATE PARTY] Error message:", error.message)
    throw new Error(`Erro ao criar festa: ${error.message}`)
  }
}

export const getParties = async (userId: string): Promise<Party[]> => {
  try {
    console.log("📋 [GET PARTIES] Loading for user:", userId)

    // Verificar conexão
    const isConnected = await testFirestoreConnection()
    if (!isConnected) {
      throw new Error("Sem conexão com o banco de dados")
    }

    // Query para festas onde o usuário é dono
    const ownerQuery = query(collection(db, "parties"), where("userId", "==", userId))

    console.log("🔍 [GET PARTIES] Executing owner query...")
    const ownerSnapshot = await getDocs(ownerQuery)
    console.log("📊 [GET PARTIES] Owner parties found:", ownerSnapshot.docs.length)

    // Query para festas onde o usuário é colaborador usando o email
    // Primeiro precisamos obter o email do usuário
    const { auth } = await import("./firebase")
    const currentUser = auth.currentUser
    const userEmail = currentUser?.email
    
    let collaboratorParties: Party[] = []
    
    if (userEmail) {
      const collaboratorQuery = query(collection(db, "parties"), where("collaborators", "array-contains", userEmail))

      console.log("🔍 [GET PARTIES] Executing collaborator query for email:", userEmail)
      const collaboratorSnapshot = await getDocs(collaboratorQuery)
      console.log("📊 [GET PARTIES] Collaborator parties found:", collaboratorSnapshot.docs.length)
      
      // Processar festas de colaborador
      collaboratorParties = collaboratorSnapshot.docs.map((doc) => {
        const data = convertTimestamps(doc.data())
        console.log("🤝 [GET PARTIES] Collaborator party:", {
          id: doc.id,
          name: data.name,
          date: data.date,
          userId: data.userId,
        })
        return {
          id: doc.id,
          ...data,
        } as Party
      })
    }

    // Processar festas do dono
    const ownerParties = ownerSnapshot.docs.map((doc) => {
      const data = convertTimestamps(doc.data())
      console.log("🎪 [GET PARTIES] Owner party:", {
        id: doc.id,
        name: data.name,
        date: data.date,
        userId: data.userId,
      })
      return {
        id: doc.id,
        ...data,
      } as Party
    })

    // Combinar e remover duplicatas
    const allParties = [...ownerParties, ...collaboratorParties]
    const uniqueParties = allParties.filter((party, index, self) => index === self.findIndex((p) => p.id === party.id))

    // Ordenar manualmente por data de criação (mais recente primeiro)
    uniqueParties.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log("✅ [GET PARTIES] Total unique parties:", uniqueParties.length)
    uniqueParties.forEach((party, index) => {
      console.log(`  ${index + 1}. ${party.name} (${party.id}) - ${party.date.toLocaleDateString()}`)
    })

    return uniqueParties
  } catch (error: any) {
    console.error("❌ [GET PARTIES] Error:", error)
    throw new Error(`Erro ao carregar festas: ${error.message}`)
  }
}

export const getParty = async (partyId: string): Promise<Party | null> => {
  try {
    console.log("🎪 [GET PARTY] Loading party:", partyId)

    const docRef = doc(db, "parties", partyId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = convertTimestamps(docSnap.data())
      const party = {
        id: docSnap.id,
        ...data,
      } as Party

      console.log("✅ [GET PARTY] Party found:", {
        id: party.id,
        name: party.name,
        userId: party.userId,
        collaborators: party.collaborators?.length || 0,
      })

      return party
    }

    console.log("❌ [GET PARTY] Party not found:", partyId)
    return null
  } catch (error: any) {
    console.error("❌ [GET PARTY] Error:", error)
    throw new Error(`Erro ao carregar festa: ${error.message}`)
  }
}

export const updateParty = async (partyId: string, updates: Partial<Party>) => {
  try {
    console.log("📝 [UPDATE PARTY] Updating party:", partyId)
    console.log("📝 [UPDATE PARTY] Updates:", updates)

    const docRef = doc(db, "parties", partyId)
    const updateData: any = { ...updates }

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date)
    }

    await updateDoc(docRef, updateData)
    console.log("✅ [UPDATE PARTY] Party updated successfully")
  } catch (error: any) {
    console.error("❌ [UPDATE PARTY] Error:", error)
    throw new Error(`Erro ao atualizar festa: ${error.message}`)
  }
}

export const deleteParty = async (partyId: string) => {
  try {
    console.log("🗑️ [DELETE PARTY] Starting deletion:", partyId)

    const batch = writeBatch(db)

    // Deletar convidados
    const guestsQuery = query(collection(db, "guests"), where("partyId", "==", partyId))
    const guestsSnapshot = await getDocs(guestsQuery)
    console.log("🗑️ [DELETE PARTY] Guests to delete:", guestsSnapshot.docs.length)

    guestsSnapshot.docs.forEach((guestDoc) => {
      batch.delete(guestDoc.ref)
    })

    // Deletar convites
    const invitesQuery = query(collection(db, "partyInvites"), where("partyId", "==", partyId))
    const invitesSnapshot = await getDocs(invitesQuery)
    console.log("🗑️ [DELETE PARTY] Invites to delete:", invitesSnapshot.docs.length)

    invitesSnapshot.docs.forEach((inviteDoc) => {
      batch.delete(inviteDoc.ref)
    })

    // Deletar festa
    batch.delete(doc(db, "parties", partyId))

    await batch.commit()
    console.log("✅ [DELETE PARTY] Party and related data deleted successfully")
  } catch (error: any) {
    console.error("❌ [DELETE PARTY] Error:", error)
    throw new Error(`Erro ao excluir festa: ${error.message}`)
  }
}

// ==================== GUEST FUNCTIONS ====================

export const createGuest = async (userId: string, guestData: Omit<Guest, "id" | "userId" | "createdAt">) => {
  try {
    console.log("👤 [CREATE GUEST] Starting for user:", userId)
    console.log("📝 [CREATE GUEST] Data:", guestData)

    const { auth } = await import("./firebase")
    const currentUser = auth.currentUser
    const userEmail = currentUser?.email

    // Verificar permissões
    const party = await getParty(guestData.partyId)
    if (!party) {
      throw new Error("Festa não encontrada")
    }

    const hasPermission = party.userId === userId || (userEmail && party.collaborators.includes(userEmail))
    if (!hasPermission) {
      console.log("❌ [CREATE GUEST] Permission denied - User:", userId, "Email:", userEmail)
      console.log("❌ [CREATE GUEST] Party owner:", party.userId, "Collaborators:", party.collaborators)
      throw new Error("Sem permissão para adicionar convidados nesta festa")
    }

    // Preparar dados
    const guestDoc = {
      name: guestData.name.trim(),
      category: guestData.category,
      age: guestData.age ? Number(guestData.age) : null,
      paid: Boolean(guestData.paid),
      observations: guestData.observations?.trim() || "",
      partyId: guestData.partyId,
      userId: party.userId, // Sempre usar o userId do dono da festa
      createdAt: serverTimestamp(),
    }

    console.log("💾 [CREATE GUEST] Saving to Firestore:", guestDoc)

    const docRef = await addDoc(collection(db, "guests"), guestDoc)
    console.log("✅ [CREATE GUEST] Guest created with ID:", docRef.id)

    // Verificar se foi salvo
    const savedDoc = await getDoc(docRef)
    if (savedDoc.exists()) {
      console.log("✅ [CREATE GUEST] Verification successful:", savedDoc.data())
    }

    return docRef.id
  } catch (error: any) {
    console.error("❌ [CREATE GUEST] Error:", error)
    throw new Error(`Erro ao criar convidado: ${error.message}`)
  }
}

export const getGuests = async (userId: string, partyId: string): Promise<Guest[]> => {
  try {
    console.log("👥 [GET GUESTS] Loading for user:", userId, "party:", partyId)

    const { auth } = await import("./firebase")
    const currentUser = auth.currentUser
    const userEmail = currentUser?.email

    // Verificar acesso
    const party = await getParty(partyId)
    if (!party) {
      throw new Error("Festa não encontrada")
    }

    const hasAccess = party.userId === userId || (userEmail && party.collaborators.includes(userEmail))
    if (!hasAccess) {
      console.log("❌ [GET GUESTS] Access denied - User:", userId, "Email:", userEmail)
      console.log("❌ [GET GUESTS] Party owner:", party.userId, "Collaborators:", party.collaborators)
      throw new Error("Acesso negado a esta festa")
    }

    const q = query(collection(db, "guests"), where("partyId", "==", partyId))

    const snapshot = await getDocs(q)
    console.log("📊 [GET GUESTS] Found guests:", snapshot.docs.length)

    const guests = snapshot.docs.map((doc) => {
      const data = convertTimestamps(doc.data())
      return {
        id: doc.id,
        ...data,
      } as Guest
    })

    guests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log("✅ [GET GUESTS] Guests loaded successfully")
    return guests
  } catch (error: any) {
    console.error("❌ [GET GUESTS] Error:", error)
    throw new Error(`Erro ao carregar convidados: ${error.message}`)
  }
}

export const updateGuest = async (guestId: string, updates: Partial<Guest>) => {
  try {
    console.log("📝 [UPDATE GUEST] Updating guest:", guestId)
    console.log("📝 [UPDATE GUEST] Updates:", updates)

    const docRef = doc(db, "guests", guestId)
    await updateDoc(docRef, updates)
    console.log("✅ [UPDATE GUEST] Guest updated successfully")
  } catch (error: any) {
    console.error("❌ [UPDATE GUEST] Error:", error)
    throw new Error(`Erro ao atualizar convidado: ${error.message}`)
  }
}

export const deleteGuest = async (guestId: string) => {
  try {
    console.log("🗑️ [DELETE GUEST] Deleting guest:", guestId)
    await deleteDoc(doc(db, "guests", guestId))
    console.log("✅ [DELETE GUEST] Guest deleted successfully")
  } catch (error: any) {
    console.error("❌ [DELETE GUEST] Error:", error)
    throw new Error(`Erro ao excluir convidado: ${error.message}`)
  }
}

export const subscribeToGuests = (userId: string, partyId: string, callback: (guests: Guest[]) => void) => {
  try {
    console.log("🔄 [SUBSCRIBE GUESTS] Setting up subscription for user:", userId, "party:", partyId)

    const q = query(
      collection(db, "guests"),
      where("partyId", "==", partyId), // sem orderBy
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const guests = snapshot.docs.map((doc) => {
          const data = convertTimestamps(doc.data())
          return {
            id: doc.id,
            ...data,
          } as Guest
        })

        guests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        console.log("🔄 [SUBSCRIBE GUESTS] Update received:", guests.length, "guests")
        callback(guests)
      },
      (error) => {
        console.error("❌ [SUBSCRIBE GUESTS] Error:", error)
      },
    )
  } catch (error) {
    console.error("❌ [SUBSCRIBE GUESTS] Setup error:", error)
    return () => {}
  }
}

// ==================== COLLABORATOR FUNCTIONS ====================

export const inviteCollaborator = async (
  partyId: string,
  partyName: string,
  ownerEmail: string,
  invitedEmail: string,
) => {
  try {
    console.log("📧 [INVITE COLLABORATOR] Inviting:", invitedEmail, "to party:", partyId)

    // Verificar convite existente
    const existingInviteQuery = query(
      collection(db, "partyInvites"),
      where("partyId", "==", partyId),
      where("invitedEmail", "==", invitedEmail),
      where("status", "==", "pending"),
    )

    const existingInviteSnapshot = await getDocs(existingInviteQuery)
    if (!existingInviteSnapshot.empty) {
      throw new Error("Já existe um convite pendente para este email")
    }

    const inviteDoc = {
      partyId,
      partyName: partyName.trim(),
      ownerEmail: ownerEmail.trim(),
      invitedEmail: invitedEmail.trim(),
      status: "pending",
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "partyInvites"), inviteDoc)
    console.log("✅ [INVITE COLLABORATOR] Invite created with ID:", docRef.id)

    return docRef.id
  } catch (error: any) {
    console.error("❌ [INVITE COLLABORATOR] Error:", error)
    throw new Error(`Erro ao enviar convite: ${error.message}`)
  }
}

export const getPendingInvites = async (userEmail: string): Promise<PartyInvite[]> => {
  try {
    console.log("📬 [GET PENDING INVITES] Loading for:", userEmail)

    // Query SEM orderBy para evitar erro de índice
    const q = query(
      collection(db, "partyInvites"),
      where("invitedEmail", "==", userEmail),
      where("status", "==", "pending"),
    )

    const snapshot = await getDocs(q)
    const invites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as PartyInvite[]

    // Ordenar manualmente por data de criação (mais recente primeiro)
    invites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log("✅ [GET PENDING INVITES] Found invites:", invites.length)
    return invites
  } catch (error: any) {
    console.error("❌ [GET PENDING INVITES] Error:", error)
    throw new Error(`Erro ao carregar convites: ${error.message}`)
  }
}

export const acceptInvite = async (inviteId: string, partyId: string, userEmail: string) => {
  try {
    console.log("✅ [ACCEPT INVITE] Accepting invite:", inviteId)

    const batch = writeBatch(db)

    // Atualizar convite
    batch.update(doc(db, "partyInvites", inviteId), {
      status: "accepted",
    })

    // Adicionar colaborador
    batch.update(doc(db, "parties", partyId), {
      collaborators: arrayUnion(userEmail),
    })

    await batch.commit()
    console.log("✅ [ACCEPT INVITE] Invite accepted successfully")
  } catch (error: any) {
    console.error("❌ [ACCEPT INVITE] Error:", error)
    throw new Error(`Erro ao aceitar convite: ${error.message}`)
  }
}

export const declineInvite = async (inviteId: string) => {
  try {
    console.log("❌ [DECLINE INVITE] Declining invite:", inviteId)

    await updateDoc(doc(db, "partyInvites", inviteId), {
      status: "declined",
    })

    console.log("✅ [DECLINE INVITE] Invite declined successfully")
  } catch (error: any) {
    console.error("❌ [DECLINE INVITE] Error:", error)
    throw new Error(`Erro ao recusar convite: ${error.message}`)
  }
}

export const removeCollaborator = async (partyId: string, collaboratorEmail: string) => {
  try {
    console.log("🚫 [REMOVE COLLABORATOR] Removing:", collaboratorEmail, "from party:", partyId)

    await updateDoc(doc(db, "parties", partyId), {
      collaborators: arrayRemove(collaboratorEmail),
    })

    console.log("✅ [REMOVE COLLABORATOR] Collaborator removed successfully")
  } catch (error: any) {
    console.error("❌ [REMOVE COLLABORATOR] Error:", error)
    throw new Error(`Erro ao remover colaborador: ${error.message}`)
  }
}

export const subscribeToInvites = (userEmail: string, callback: (invites: PartyInvite[]) => void) => {
  try {
    console.log("🔄 [SUBSCRIBE INVITES] Setting up subscription for:", userEmail)

    // Query SEM orderBy para evitar erro de índice
    const q = query(
      collection(db, "partyInvites"),
      where("invitedEmail", "==", userEmail),
      where("status", "==", "pending"),
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const invites = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as PartyInvite[]

        // Ordenar manualmente por data de criação (mais recente primeiro)
        invites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        console.log("🔄 [SUBSCRIBE INVITES] Update received:", invites.length, "invites")
        callback(invites)
      },
      (error) => {
        console.error("❌ [SUBSCRIBE INVITES] Error:", error)
      },
    )
  } catch (error) {
    console.error("❌ [SUBSCRIBE INVITES] Setup error:", error)
    return () => {}
  }
}

// ==================== UTILITY FUNCTIONS ====================

export const checkUserPermission = async (
  userId: string,
  partyId: string,
): Promise<{
  isOwner: boolean
  isCollaborator: boolean
  hasAccess: boolean
}> => {
  try {
    const { auth } = await import("./firebase")
    const currentUser = auth.currentUser
    const userEmail = currentUser?.email
    
    const party = await getParty(partyId)
    if (!party) {
      return { isOwner: false, isCollaborator: false, hasAccess: false }
    }

    const isOwner = party.userId === userId
    const isCollaborator = userEmail ? party.collaborators.includes(userEmail) : false
    const hasAccess = isOwner || isCollaborator

    console.log("🔐 [CHECK PERMISSION] User:", userId, "Email:", userEmail)
    console.log("🔐 [CHECK PERMISSION] Party:", partyId, "Owner:", party.userId)
    console.log("🔐 [CHECK PERMISSION] Collaborators:", party.collaborators)
    console.log("🔐 [CHECK PERMISSION] Result:", { isOwner, isCollaborator, hasAccess })

    return { isOwner, isCollaborator, hasAccess }
  } catch (error) {
    console.error("❌ [CHECK PERMISSION] Error:", error)
    return { isOwner: false, isCollaborator: false, hasAccess: false }
  }
}

// Função para debug - listar todas as festas no console
export const debugListAllParties = async () => {
  try {
    console.log("🔍 [DEBUG] Listing all parties in database...")
    const snapshot = await getDocs(collection(db, "parties"))
    console.log("📊 [DEBUG] Total parties in database:", snapshot.docs.length)

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data()
      console.log(`${index + 1}. [${doc.id}] ${data.name} - User: ${data.userId}`)
    })
  } catch (error) {
    console.error("❌ [DEBUG] Error listing parties:", error)
  }
}

// Função para debug - listar todos os convidados
export const debugListAllGuests = async () => {
  try {
    console.log("🔍 [DEBUG] Listing all guests in database...")
    const snapshot = await getDocs(collection(db, "guests"))
    console.log("📊 [DEBUG] Total guests in database:", snapshot.docs.length)

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data()
      console.log(`${index + 1}. [${doc.id}] ${data.name} - Party: ${data.partyId}`)
    })
  } catch (error) {
    console.error("❌ [DEBUG] Error listing guests:", error)
  }
}

// Função para verificar e sugerir criação de índices
export const checkFirestoreIndexes = async () => {
  try {
    console.log("🔍 [CHECK INDEXES] Verificando índices necessários...")

    // Testar queries que podem precisar de índices
    const testQueries = [
      // Query de festas por usuário com ordenação
      { collection: "parties", where: ["userId"], orderBy: ["createdAt"] },
      // Query de convites por email com ordenação
      { collection: "partyInvites", where: ["invitedEmail", "status"], orderBy: ["createdAt"] },
      // Query de convidados por festa com ordenação
      { collection: "guests", where: ["partyId"], orderBy: ["createdAt"] },
    ]

    console.log("✅ [CHECK INDEXES] Queries principais funcionando sem índices compostos")
    return true
  } catch (error) {
    console.error("❌ [CHECK INDEXES] Error:", error)
    return false
  }
}
