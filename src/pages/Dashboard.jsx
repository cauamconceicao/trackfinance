import { useState, useEffect } from "react"
import { Plus, Trash2, TrendingUp, TrendingDown, LogIn } from "lucide-react"
import Card from "../components/Card"
import ExpenseChart from "../components/ExpenseChart"
import { supabase } from "../supabase"

export default function Dashboard({ user }) {
  const [transactions, setTransactions] = useState([])
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
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
      setCategory("")
    }
    setLoading(false)
  }

  async function removeTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (!error) fetchTransactions()
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + t.amount, 0)

  const balance = income + expenses

  function formatBRL(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao TrackFinance</h2>
          <p className="text-zinc-400 mb-8">Faça login para ver seu painel financeiro</p>
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-3 bg-white text-zinc-900 font-semibold px-6 py-3 rounded-xl hover:bg-zinc-100 transition mx-auto"
          >
            <LogIn size={18} />
            Entrar com Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Olá, {user.user_metadata?.full_name?.split(" ")[0] ?? "seja bem-vindo"} 👋
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Aqui está um resumo das suas finanças</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card title="Saldo Total" amount={formatBRL(balance)} type="balance" />
        <Card title="Receitas" amount={formatBRL(income)} type="income" />
        <Card title="Despesas" amount={formatBRL(Math.abs(expenses))} type="expense" />
      </div>

      {/* Gráfico */}
      <ExpenseChart transactions={transactions} />

      {/* Formulário */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mt-6">
        <h2 className="text-base font-semibold text-white mb-4">Nova Transação</h2>
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
          <input
            type="text"
            placeholder="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
          />
        </div>
        <button
          onClick={addTransaction}
          disabled={loading || !title || !amount}
          className="mt-3 flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      {/* Lista de transações */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mt-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Transações Recentes
          <span className="ml-2 text-xs font-normal text-zinc-500">
            ({transactions.length})
          </span>
        </h2>

        {transactions.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">
            Nenhuma transação ainda. Adicione a primeira acima!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between bg-zinc-800/60 hover:bg-zinc-800 px-4 py-3 rounded-xl transition group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${transaction.amount > 0 ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"}`}
                  >
                    {transaction.amount > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{transaction.title}</p>
                    {transaction.category && (
                      <p className="text-xs text-zinc-500">{transaction.category}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={`text-sm font-semibold ${
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
    </div>
  )
}
