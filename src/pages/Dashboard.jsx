import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, LogIn, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import Card from "../components/Card"
import ExpenseChart from "../components/ExpenseChart"
import CategoryChart from "../components/CategoryChart"
import { supabase } from "../supabase"

export default function Dashboard({ user }) {
  const [transactions, setTransactions] = useState([])

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

  function formatBRL(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + t.amount, 0)

  const balance = income + expenses

  // Categoria com maior gasto
  const topCategory = (() => {
    const grouped = transactions
      .filter((t) => t.amount < 0)
      .reduce((acc, t) => {
        const cat = t.category || "Outros"
        acc[cat] = (acc[cat] || 0) + Math.abs(t.amount)
        return acc
      }, {})
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1])
    return sorted[0] ?? null
  })()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Bem-vindo ao TrackFinance
          </h2>
          <p className="text-zinc-400 mb-8">
            Faça login para ver seu painel financeiro
          </p>
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
        <p className="text-zinc-500 text-sm mt-1">
          Aqui está um resumo das suas finanças
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card title="Saldo Total" amount={formatBRL(balance)} type="balance" />
        <Card title="Receitas" amount={formatBRL(income)} type="income" />
        <Card title="Despesas" amount={formatBRL(Math.abs(expenses))} type="expense" />
      </div>

      {/* Card de destaque — top categoria */}
      {topCategory && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Maior gasto do período</p>
            <p className="text-sm font-semibold text-white">{topCategory[0]}</p>
          </div>
          <p className="text-sm font-bold text-red-400">
            {formatBRL(topCategory[1])}
          </p>
        </div>
      )}

      {/* Gráficos lado a lado em telas grandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ExpenseChart transactions={transactions} />
        <CategoryChart transactions={transactions} />
      </div>

      {/* Últimas transações */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Últimas Transações
            <span className="ml-2 text-xs font-normal text-zinc-500">
              ({transactions.length})
            </span>
          </h2>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-green-400 transition"
          >
            Ver todas
            <ArrowRight size={13} />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">
            Nenhuma transação ainda. Vá em Transações para adicionar!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between bg-zinc-800/60 hover:bg-zinc-800 px-4 py-3 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${transaction.amount > 0 ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"}`}
                  >
                    {transaction.amount > 0
                      ? <TrendingUp size={15} />
                      : <TrendingDown size={15} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {transaction.title}
                    </p>
                    {transaction.category && (
                      <p className="text-xs text-zinc-500">{transaction.category}</p>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-semibold ${transaction.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                  {transaction.amount > 0 ? "+" : ""}
                  {formatBRL(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}