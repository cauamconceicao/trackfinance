import { LogOut, User, Mail, Shield } from "lucide-react"

export default function Settings({ user, onLogout }) {
  const avatarLetters = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : user?.email?.[0]?.toUpperCase() ?? "?"

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
        className="w-full flex items-center justify-center gap-2 bg-red-950/50 hover:bg-red-950 border border-red-900/50 text-red-400 text-sm font-medium px-5 py-3 rounded-2xl transition"
      >
        <LogOut size={16} />
        Sair da conta
      </button>
    </div>
  )
}
