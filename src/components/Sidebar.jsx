import { LayoutDashboard, Receipt, Target, Settings, LogOut } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export default function Sidebar({ user, onLogout }) {
  const location = useLocation()

  const mainLinks = [
    { to: "/", icon: <LayoutDashboard size={18} />, label: "Painel" },
    { to: "/transactions", icon: <Receipt size={18} />, label: "Transações" },
    { to: "/goals", icon: <Target size={18} />, label: "Metas" },
    { to: "/settings", icon: <Settings size={18} />, label: "Configurações" },
  ]

  const avatarLetters = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : user?.email?.[0]?.toUpperCase() ?? "?"

  function NavLink({ to, icon, label }) {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
          ${active
            ? "bg-green-950 text-green-400"
            : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
          }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-green-400 rounded-r-full" />
        )}
        {icon}
        {label}
      </Link>
    )
  }

  return (
    <>
      {/* Sidebar desktop */}
      <div className="hidden md:flex w-60 min-h-screen bg-zinc-950 border-r border-zinc-800/60 p-4 flex-col shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
            <LayoutDashboard size={15} className="text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            TrackFinance
          </span>
        </div>

        {/* Nav */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 mb-2">
            Menu
          </p>
          <nav className="flex flex-col gap-0.5">
            {mainLinks.map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
          </nav>
        </div>

        <div className="flex-1" />

        {/* Usuário */}
        {user && (
          <div className="border-t border-zinc-800/60 pt-4 flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-green-950 border border-green-800/50 flex items-center justify-center text-xs font-bold text-green-400 shrink-0">
              {avatarLetters}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {user.user_metadata?.full_name ?? "Usuário"}
              </p>
              <p className="text-[11px] text-zinc-600 truncate">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sair"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-950/60 transition-all shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom navbar mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur border-t border-zinc-800/60 flex items-center justify-around px-1 py-2">
        {mainLinks.map(({ to, icon, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all
                ${active ? "text-green-400" : "text-zinc-500"}`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
