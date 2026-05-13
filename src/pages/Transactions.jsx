import { useState, useEffect } from "react"
import { Plus, Trash2, TrendingUp, TrendingDown, Search } from "lucide-react"
import { supabase } from "../supabase"

const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Moradia",
  "Salário",
  "Investimento",
  "Outros",
]

export default function Transactions({ user }) {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("Todas")
  const [filterType, setFilterType] = useState("Todas")
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [loading, setLoading] = useState(false)

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

  async function addTransaction() {
    if (!title || !amount) return
    setLoading(true)
    const { error } = await supabase.from("transactions").insert([
      { title, amount: Number(amount), category, user_id: user.id },
    ])
    if (!error) {
      fetchTransactions()
      setTitle("")
      setAmount("")
      setCategory(CATEGORIES[0])
      setShowForm(false)
    }
    setLoading(false)
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

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.category ?? "").toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      filterCategory === "Todas" || t.category === filterCategory
    const matchType =
      filterType === "Todas" ||
      (filterType === "Receitas" && t.amount > 0) ||
      (filterType === "Despesas" && t.amount < 0)
    return matchSearch && matchCategory && matchType
  })

  if (!user) return <p className="p-8 text-zinc-400">Carregando...</p>

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {transactions.length} transações no total
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Nova
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-6">
          <p className="text-sm font-medium text-zinc-300 mb-3">Nova Transação</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Descrição"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
            />
            <input
              type="number"
              placeholder="Valor (negativo = despesa)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={addTransaction}
              disabled={loading || !title || !amount}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              <Plus size={16} />
              {loading ? "Adicionando..." : "Adicionar"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
        >
          {["Todas", ...CATEGORIES].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
        >
          {["Todas", "Receitas", "Despesas"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-16">
          {search || filterCategory !== "Todas" || filterType !== "Todas"
            ? "Nenhuma transação encontrada."
            : "Nenhuma transação ainda."}
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
                <p className={`text-sm font-bold ${transaction.amount > 0 ? "text-green-400" : "text-red-400"}`}>
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