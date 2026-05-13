import { useState, useEffect } from "react"
import { Plus, Trash2, Target } from "lucide-react"
import { supabase } from "../supabase"

export default function Goals({ user }) {
  const [goals, setGoals] = useState([])
  const [goal, setGoal] = useState("")
  const [loading, setLoading] = useState(false)

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
    if (!goal.trim()) return
    setLoading(true)
    const { error } = await supabase.from("goals").insert([
      { title: goal, user_id: user.id },
    ])
    if (!error) {
      fetchGoals()
      setGoal("")
    }
    setLoading(false)
  }

  async function removeGoal(id) {
    const { error } = await supabase.from("goals").delete().eq("id", id)
    if (!error) fetchGoals()
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") addGoal()
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
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ex: Reserva de emergência, Viagem..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
          />
          <button
            onClick={addGoal}
            disabled={loading || !goal.trim()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition shrink-0"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
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
        <div className="flex flex-col gap-2">
          {goals.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-4 rounded-2xl transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-950 border border-green-900/50 flex items-center justify-center shrink-0">
                  <Target size={15} className="text-green-400" />
                </div>
                <p className="text-sm font-medium text-white">{g.title}</p>
              </div>
              <button
                onClick={() => removeGoal(g.id)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-950/60 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
