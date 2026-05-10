import { Link } from "react-router-dom"

export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-zinc-900 text-white p-6">
      <h1 className="text-3xl font-bold">
        TrackFinance
      </h1>

      <div className="flex flex-col gap-10 mt-16 text-2xl">
        <Link
          to="/"
          className="hover:text-green-400 transition"
        >
          Painel
        </Link>

        <Link
          to="/transactions"
          className="hover:text-green-400 transition"
        >
          Transações
        </Link>

        <Link
          to="/goals"
          className="hover:text-green-400 transition"
        >
          Metas
        </Link>

        <Link
          to="/settings"
          className="hover:text-green-400 transition"
        >
          Configurações
        </Link>
      </div>
    </div>
  )
}