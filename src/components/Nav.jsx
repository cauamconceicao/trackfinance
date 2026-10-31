import { House, ReceiptText, Target, User, Plus, CircleDollarSign } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useUI } from "../context/UIContext"
import { initials } from "../lib/format"

const NAV_LINKS = [
  { to: "/", icon: House, label: "Início" },
  { to: "/transactions", icon: ReceiptText, label: "Transações" },
  { to: "/goals", icon: Target, label: "Metas" },
  { to: "/settings", icon: User, label: "Perfil" },
]

export function Logo({ dark }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-full bg-lime flex items-center justify-center">
        <CircleDollarSign size={20} className="text-ink" strokeWidth={2.2} />
      </span>
      <span className={`font-display text-[17px] font-bold ${dark ? "text-white" : "text-ink"}`}>
        TrackFinance
      </span>
    </span>
  )
}

export default function Nav({ user }) {
  const { pathname } = useLocation()
  const { openSheet } = useUI()

  return (
    <>
      {/* Computador: barra de ícones em telas médias (notebook) e menu completo em telas largas */}
      <aside className="hidden md:flex w-[96px] xl:w-[240px] shrink-0 h-dvh sticky top-0 p-3 xl:p-4">
        <div className="flex-1 min-w-0 bg-ink rounded-[28px] p-3 xl:p-4 flex flex-col items-center xl:items-stretch">
          <Link to="/" aria-label="TrackFinance" className="xl:px-2 pt-1 pb-6 xl:pb-7">
            <span className="xl:hidden w-10 h-10 rounded-full bg-lime flex items-center justify-center">
              <CircleDollarSign size={21} className="text-ink" strokeWidth={2.2} />
            </span>
            <span className="hidden xl:block">
              <Logo dark />
            </span>
          </Link>
          <nav className="flex flex-col gap-1.5 w-full" aria-label="Menu principal">
            {NAV_LINKS.map(({ to, icon: Icon, label }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  title={label}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-center xl:justify-start gap-3 h-12 xl:px-4 rounded-full text-[15px] font-semibold transition
                    ${active ? "bg-lime text-ink" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  <Icon size={19} className="shrink-0" />
                  <span className="hidden xl:inline truncate">{label}</span>
                </Link>
              )
            })}
          </nav>

          <button
            onClick={() => openSheet("transaction")}
            title="Nova transação"
            aria-label="Nova transação"
            className="mt-5 w-12 xl:w-full flex items-center justify-center gap-2 h-12 rounded-full bg-lime xl:bg-white/10 text-ink xl:text-white font-semibold hover:brightness-95 xl:hover:bg-white/15 transition"
          >
            <Plus size={19} className="xl:text-lime shrink-0" />
            <span className="hidden xl:inline">Nova transação</span>
          </button>

          <div className="flex-1" />

          <Link
            to="/settings"
            title={user.email}
            className="w-full min-w-0 flex items-center justify-center xl:justify-start gap-3 xl:p-2 rounded-2xl hover:bg-white/5 transition"
          >
            <span className="w-10 h-10 rounded-full bg-lime text-ink flex items-center justify-center text-sm font-bold shrink-0">
              {initials(user.name, user.email)}
            </span>
            <span className="hidden xl:block min-w-0">
              <span className="block text-sm font-semibold text-white truncate">{user.name ?? "Minha conta"}</span>
              <span className="block text-xs text-white/50 truncate">{user.email}</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Celular: menu flutuante */}
      <nav
        aria-label="Menu principal"
        className="md:hidden fixed z-50 inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto max-w-md bg-ink rounded-full p-2 flex items-center justify-between shadow-xl shadow-ink/20">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`h-12 flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all
                  ${active ? "bg-lime text-ink px-5" : "text-white/55 w-14 hover:text-white"}`}
              >
                <Icon size={19} />
                {active && <span>{label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
