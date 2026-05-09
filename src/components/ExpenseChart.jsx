import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#eab308",
  "#a855f7",
]

function ExpenseChart({ transactions }) {
  const expenses = transactions.filter(
    (transaction) => transaction.amount < 0
  )

  const data = expenses.map((transaction) => ({
    name: transaction.category,
    value: Math.abs(transaction.amount),
  }))

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mt-10">
      <h2 className="text-2xl font-bold mb-6">
        Expenses Chart
      </h2>

      <PieChart width={400} height={300}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
        >
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip />
      </PieChart>
    </div>
  )
}

export default ExpenseChart