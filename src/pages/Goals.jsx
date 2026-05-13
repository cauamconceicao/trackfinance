import { useState, useEffect } from "react"
import { Plus, Trash2, Target, Pencil, Check, X } from "lucide-react"
import { supabase } from "../supabase"

export default function Goals({ user }) {
  const [goals, setGoals] = useState([])
  const [title, setTitle] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingValue, setEditingValue] = useState("")

  useEffect(() => {
    if (user) fetchGoals()
  }, [user])

  async function fetchGoals() {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (data) setGoals(data)
    if (error) console.log(error)
  }

  async function addGoal() {
    if (!title.trim()) return
    setLoading(true)
    const { error } = await supabase.from("goals").insert([
      {
        title,
        target_amount: Number(targetAmount) || 0,
        current_amount: 0,
        user_id: user.id,
      },
    ])
    if (!error) {
      fetchGoals()
      setTitle("")
      setTargetAmount("")
    }
    setLoading(false)
  }

  async function removeGoal(id) {
    const { error } = await supabase.from("goals").delete().eq("id", id)
    if (!error) fetchGoals()
  }

  async function saveCurrentAmount(id) {
    const { error } = await supabase
      .from("goals")
      .update({ current_amount: Number(editingValue) })
      .eq("id", id)
    if (!error) {
      fetchGoals()
      setEditingId(null)
      setEditingValue("")
    }
  }

  function startEditing(goal) {
    setEditingId(goal.id)
    setEditingValue(String(goal.current_amount ?? 0))
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingValue("")
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") addGoal()
  }

  function formatBRL(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  function getProgress(current, target) {
    if (!target || target === 0) return 0
    return Math.min(100, Math.round((current / target) * 100))
  }

  if (!user) return <p className="p-8 text-zinc-400">Carregando...</p>

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Metas Financeiras</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {goals.length} {goals.length === 1 ? "meta" : "metas"} cadastradas
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-6">
        <p className="text-sm font-medium text-zinc-300 mb-3">Nova Meta</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Ex: Reserva de emergência, Viagem..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
          />
          <input
            type="number"
            placeholder="Valor alvo (R$)"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="w-full sm:w-44 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
          />
        </div>
        <button
          onClick={addGoal}
          disabled={loading || !title.trim()}
          className="mt-3 flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {/* Lista */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
            <Target size={22} className="text-zinc-500" />
          </div>
          <p className="text-zinc-400 text-sm font-medium">Nenhuma meta ainda</p>
          <p className="text-zinc-600 text-xs mt-1">Adicione sua primeira meta acima</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((g) => {
            const progress = getProgress(g.current_amount, g.target_amount)
            const isComplete = progress >= 100
            const isEditing = editingId === g.id

            return (
              <div
                key={g.id}
                className={`bg-zinc-900 border rounded-2xl p-5 transition group
                  ${isComplete ? "border-green-900/60" : "border-zinc-800 hover:border-zinc-700"}`}
              >
                {/* Topo */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                      ${isComplete ? "bg-green-500" : "bg-green-950 border border-green-900/50"}`}>
                      <Target size={15} className={isComplete ? "text-white" : "text-green-400"} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{g.title}</p>
                      {g.target_amount > 0 && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Meta: {formatBRL(g.target_amount)}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeGoal(g.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-950/60 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Barra de progresso */}
                {g.target_amount > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-zinc-500">Progresso</span>
                      <span className={`text-xs font-semibold ${isComplete ? "text-green-400" : "text-zinc-400"}`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500
                          ${isComplete ? "bg-green-400" : "bg-green-600"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Valor atual */}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        autoFocus
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-green-600 transition"
                        placeholder="Valor atual"
                      />
                      <button
                        onClick={() => saveCurrentAmount(g.id)}
                        className="w-7 h-7 rounded-lg bg-green-600 hover:bg-green-500 flex items-center justify-center transition"
                      >
                        <Check size={13} className="text-white" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition"
                      >
                        <X size={13} className="text-zinc-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-400 flex-1">
                        Guardado:{" "}
                        <span className="font-semibold text-white">
                          {formatBRL(g.current_amount ?? 0)}
                        </span>
                      </p>
                      <button
                        onClick={() => startEditing(g)}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-green-400 transition px-2 py-1 rounded-lg hover:bg-green-950/40"
                      >
                        <Pencil size={12} />
                        Atualizar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
