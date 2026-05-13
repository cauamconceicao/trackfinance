export default function Card({ title, amount, type }) {
  const variants = {
    balance: {
      bg: "bg-zinc-900",
      border: "border-zinc-800",
      label: "text-zinc-400",
      value: "text-white",
    },
    income: {
      bg: "bg-green-950/40",
      border: "border-green-900/50",
      label: "text-green-600",
      value: "text-green-400",
    },
    expense: {
      bg: "bg-red-950/40",
      border: "border-red-900/50",
      label: "text-red-600",
      value: "text-red-400",
    },
  }

  const style = variants[type] ?? variants.balance

  return (
    <div
      className={`${style.bg} border ${style.border} p-6 rounded-2xl transition-all hover:brightness-110`}
    >
      <p className={`text-sm font-medium ${style.label}`}>{title}</p>
      <h2 className={`text-3xl font-bold mt-2 tracking-tight ${style.value}`}>
        {amount}
      </h2>
    </div>
  )
}
