import { useState } from "react"
import { LogOut, User, Mail, Shield, Trash2 } from "lucide-react"
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore"
import { db } from "../firebase"

export default function Settings({ user, onLogout }) {
  const [deleting, setDeleting] = useState(false)
  const avatarLetters = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : user?.email?.[0]?.toUpperCase() ?? "?"

  async function deleteAllTransactions() {
    const confirmed = window.confirm(
      "Isso vai apagar TODAS as suas transações (manuais e importadas) permanentemente. Deseja continuar?"
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const q = query(collection(db, "transactions"), where("userId", "==", user.id))
      const snapshot = await getDocs(q)
      const docs = snapshot.docs
      const CHUNK_SIZE = 450
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db)
        for (const d of docs.slice(i, i + CHUNK_SIZE)) {
          batch.delete(d.ref)
        }
        await batch.commit()
      }
      window.alert(`${docs.length} transações apagadas.`)
    } catch (error) {
      console.log(error)
      window.alert("Não foi possível apagar as transações. Tente novamente.")
    }
    setDeleting(false)
  }

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-500 text-sm mt-1">Gerencie sua conta</p>
      </div>

      {/* Card de perfil */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-4">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-950 border border-green-900/50 flex items-center justify-center text-lg font-bold text-green-400 shrink-0">
              {avatarLetters}
            </div>
            <div>
              <p className="font-semibold text-white">
                {user?.user_metadata?.full_name ?? "Usuário"}
              </p>
              <p className="text-sm text-zinc-400 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-zinc-800">
          <div className="flex items-center gap-3 px-6 py-4">
            <User size={16} className="text-zinc-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Nome</p>
              <p className="text-sm text-white mt-0.5">
                {user?.user_metadata?.full_name ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <Mail size={16} className="text-zinc-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">E-mail</p>
              <p className="text-sm text-white mt-0.5">{user?.email ?? "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <Shield size={16} className="text-zinc-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-500">Autenticação</p>
              <p className="text-sm text-white mt-0.5">Google OAuth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-950/50 hover:bg-red-950 border border-red-900/50 text-red-400 text-sm font-medium px-5 py-3 rounded-2xl transition mb-8"
      >
        <LogOut size={16} />
        Sair da conta
      </button>

      {/* Zona de perigo */}
      <div className="border border-red-900/40 rounded-2xl p-5">
        <p className="text-sm font-semibold text-red-400 mb-1">Zona de perigo</p>
        <p className="text-xs text-zinc-500 mb-4">
          Apaga permanentemente todas as transações da sua conta (manuais e importadas).
        </p>
        <button
          onClick={deleteAllTransactions}
          disabled={deleting}
          className="flex items-center gap-2 bg-transparent hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed border border-red-900/50 text-red-400 text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <Trash2 size={15} />
          {deleting ? "Apagando..." : "Apagar todas as transações"}
        </button>
      </div>
    </div>
  )
}
