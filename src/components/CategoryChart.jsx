import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm shadow-lg">
      <p className="text-zinc-400 mb-1">{payload[0].payload.category}</p>
      <p className="text-red-400 font-semibold">
        {Number(payload[0].value).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </p>
    </div>
  )
}

export default function CategoryChart({ transactions }) {
  const expenses = transactions.filter((t) => t.amount < 0)

  const grouped = expenses.reduce((acc, t) => {
    const cat = t.category || "Outros"
    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount)
    return acc
  }, {})

  const data = Object.entries(grouped)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const COLORS = [
    "#ef4444", "#f97316", "#eab308",
    "#22c55e", "#3b82f6", "#a855f7",
  ]

  if (data.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
      <h2 className="text-base font-semibold text-white mb-6">
        Gastos por Categoria
      </h2>
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={20}>
            <XAxis
              type="number"
              tick={{ fill: "#71717a", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                `R$${Number(v).toLocaleString("pt-BR")}`
              }
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}