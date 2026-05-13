import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm shadow-lg">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }} className="font-semibold">
          {p.name}: R$ {Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  )
}

export default function ExpenseChart({ transactions }) {
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0)

  const expenses = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((acc, t) => acc + t.amount, 0)
  )

  const data = [
    { name: "Receitas", value: income, color: "#22c55e" },
    { name: "Despesas", value: expenses, color: "#ef4444" },
  ]

  return (
    <div className="bg-zinc-900 border border-zinc-800 mt-6 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Visão Geral</h2>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            Receitas
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Despesas
          </span>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={52}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#71717a", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${v}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
