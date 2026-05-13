import { useState, useEffect } from "react"
import { Trash2, TrendingUp, TrendingDown, Search } from "lucide-react"
import { supabase } from "../supabase"

export default function Transactions({ user }) {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (user) fetchTransactions()
  }, [user])

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (data) setTransactions(data)
    if (error) console.log(error)
  }

  async function removeTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (!error) fetchTransactions()
  }

  function formatBRL(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const filtered = transactions.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.category ?? "").toLowerCase().includes(search.toLowerCase())
  )

  if (!user) return <p className="p-8 text-zinc-400">Carregando...</p>

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Transações</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {transactions.length} transações no total
        </p>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por descrição ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-16">
          {search ? "Nenhuma transação encontrada." : "Nenhuma transação ainda."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-3.5 rounded-2xl transition group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    ${transaction.amount > 0 ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"}`}
                >
                  {transaction.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{transaction.title}</p>
                  {transaction.category && (
                    <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {transaction.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p
                  className={`text-sm font-bold ${
                    transaction.amount > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {formatBRL(transaction.amount)}
                </p>
                <button
                  onClick={() => removeTransaction(transaction.id)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-950/60 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
