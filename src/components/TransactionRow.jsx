import { Repeat } from "lucide-react"
import { CategoryIcon, Money } from "./ui"
import { findCategory } from "../lib/categories"
import { timeLabel } from "../lib/format"

export default function TransactionRow({ transaction: t, categories, onClick, showDate }) {
  const category = findCategory(categories, t.category)
  const income = t.amount > 0
  const time = showDate ? t.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") : timeLabel(t.date)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-2xl text-left hover:bg-soft transition group"
    >
      <CategoryIcon category={category} size={42} active={income} />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="block text-[15px] font-medium truncate">{t.title}</span>
          {t.recurringId && <Repeat size={12} className="text-muted shrink-0" aria-label="Recorrente" />}
        </span>
        <span className="block text-[13px] text-muted truncate">
          {t.category ?? "Sem categoria"}
          {time && ` · ${time}`}
          {t.future && <span className="ml-1.5 text-[11px] font-semibold bg-soft group-hover:bg-card text-ink px-1.5 py-0.5 rounded-full">Previsto</span>}
        </span>
      </span>
      <Money
        value={t.amount}
        sign={income ? "+" : "-"}
        className={`text-[15px] font-bold ${income ? "text-income" : "text-ink"}`}
      />
    </button>
  )
}
