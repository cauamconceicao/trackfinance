import { Pause, Play, Plus, Repeat, Trash2 } from "lucide-react"
import { deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Button, CategoryIcon, IconButton, Money, Sheet } from "./ui"
import { findCategory } from "../lib/categories"
import { addMonths, periodKey } from "../lib/format"

export default function RecurringSheet({ onClose }) {
  const { recurring, categories } = useData()
  const { runWrite, openSheet } = useUI()

  function toggle(rule) {
    const active = rule.active === false
    // Ao retomar, não lança os meses em que ficou pausada
    const now = new Date()
    const previous = periodKey(addMonths({ year: now.getFullYear(), month: now.getMonth() }, -1))
    const lastGenerated = rule.lastGenerated && rule.lastGenerated > previous ? rule.lastGenerated : previous
    runWrite(
      updateDoc(doc(db, "recurring", rule.id), active ? { active, lastGenerated } : { active }),
      { success: active ? "Recorrente retomada" : "Recorrente pausada" }
    ).catch(() => {})
  }

  function remove(rule) {
    if (!window.confirm(`Parar de lançar “${rule.title}”? As transações já lançadas continuam na sua conta.`)) return
    runWrite(deleteDoc(doc(db, "recurring", rule.id)), { success: "Recorrente excluída" }).catch(() => {})
  }

  return (
    <Sheet open onClose={onClose} title="Transações recorrentes">
      <p className="text-[13px] text-muted mb-3">
        São lançadas automaticamente todo mês, no dia escolhido. Pausar ou excluir não apaga o que já foi lançado.
      </p>
      {recurring.length === 0 ? (
        <div className="bg-soft rounded-[22px] p-6 text-center">
          <Repeat size={22} className="mx-auto text-muted" />
          <p className="font-semibold mt-2">Nenhuma recorrente ainda</p>
          <p className="text-[13px] text-muted mt-1">Ao lançar uma transação, escolha “Todo mês” em Repetição.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line border border-line rounded-[22px] overflow-hidden">
          {recurring.map((r) => {
            const paused = r.active === false
            return (
              <li key={r.id} className={`flex items-center gap-3 p-3 ${paused ? "opacity-60" : ""}`}>
                <CategoryIcon category={findCategory(categories, r.category)} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  <p className="text-[12.5px] text-muted">
                    {paused ? "Pausada" : `Todo dia ${r.dayOfMonth}`} · {r.category}
                  </p>
                </div>
                <Money value={r.amount} sign={r.amount > 0 ? "+" : "-"} className={`text-sm font-bold ${r.amount > 0 ? "text-income" : ""}`} />
                <IconButton label={paused ? "Retomar" : "Pausar"} variant="soft" onClick={() => toggle(r)}>
                  {paused ? <Play size={16} /> : <Pause size={16} />}
                </IconButton>
                <IconButton label="Excluir recorrente" variant="soft" onClick={() => remove(r)} className="text-danger">
                  <Trash2 size={16} />
                </IconButton>
              </li>
            )
          })}
        </ul>
      )}
      <Button variant="lime" className="w-full mt-3" onClick={() => openSheet("transaction")}>
        <Plus size={18} /> Nova transação
      </Button>
    </Sheet>
  )
}
