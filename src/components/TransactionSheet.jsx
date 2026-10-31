import { useState } from "react"
import { CalendarDays, Repeat, Trash2 } from "lucide-react"
import {
  addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch,
} from "firebase/firestore"
import { db } from "../firebase"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Button, CategoryIcon, Field, MoneyInput, Segmented, Sheet, TextInput } from "./ui"
import { fromInputDate, periodKey, sameDay, toInputDate } from "../lib/format"
import { FALLBACK_CATEGORY } from "../lib/categories"

const INCOME_CATEGORIES = ["Salário", "Investimento"]

function stripDerived(t) {
  // eslint-disable-next-line no-unused-vars
  const { id, date, future, ...data } = t
  return data
}

function withTimeOf(day, source) {
  const d = new Date(day)
  d.setHours(source.getHours(), source.getMinutes(), source.getSeconds())
  return d
}

export default function TransactionSheet({ payload, onClose }) {
  const { user, categories, recurring } = useData()
  const { runWrite } = useUI()
  const editing = payload?.transaction ?? null

  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const initialDate = editing?.date ?? today

  const [type, setType] = useState(editing ? (editing.amount > 0 ? "income" : "expense") : payload?.type ?? "expense")
  const [cents, setCents] = useState(editing ? Math.round(Math.abs(editing.amount) * 100) : 0)
  const [title, setTitle] = useState(editing?.title ?? "")
  const [category, setCategory] = useState(editing?.category ?? (payload?.type === "income" ? "Salário" : categories[0]?.name))
  const [dateMode, setDateMode] = useState(
    sameDay(initialDate, today) ? "today" : sameDay(initialDate, yesterday) ? "yesterday" : "other"
  )
  const [otherDate, setOtherDate] = useState(toInputDate(initialDate))
  const [repeat, setRepeat] = useState("none")
  const [installments, setInstallments] = useState("2")
  const [submitted, setSubmitted] = useState(false)

  const date = dateMode === "today" ? today : dateMode === "yesterday" ? yesterday : fromInputDate(otherDate)
  const nInstallments = Number(installments)

  const errors = {
    amount: cents <= 0 ? "Informe um valor maior que zero." : null,
    title: !title.trim() ? "Escreva uma descrição, por exemplo “Mercado”." : null,
    date: !date || date.getFullYear() < 1990 || date.getFullYear() > 2100 ? "Escolha uma data válida." : null,
    installments:
      repeat === "installments" && (!Number.isInteger(nInstallments) || nInstallments < 2 || nInstallments > 72)
        ? "Use de 2 a 72 parcelas."
        : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const show = (key) => (submitted ? errors[key] : null)

  // Receitas mostram primeiro as categorias de entrada
  const orderedCategories =
    type === "income"
      ? [...categories].sort((a, b) => INCOME_CATEGORIES.includes(b.name) - INCOME_CATEGORIES.includes(a.name))
      : categories

  const rule = editing?.recurringId ? recurring.find((r) => r.id === editing.recurringId) : null

  function save() {
    setSubmitted(true)
    if (hasErrors) return

    const amount = (type === "income" ? 1 : -1) * (cents / 100)
    const base = { title: title.trim(), amount, category: category || FALLBACK_CATEGORY }
    const when = editing
      ? sameDay(date, editing.date) ? editing.date : withTimeOf(date, editing.date)
      : withTimeOf(date, new Date())

    if (editing) {
      runWrite(updateDoc(doc(db, "transactions", editing.id), { ...base, createdAt: Timestamp.fromDate(when) }), {
        success: "Transação atualizada",
      })
    } else if (repeat === "monthly") {
      runWrite(
        addDoc(collection(db, "recurring"), {
          ...base,
          dayOfMonth: date.getDate(),
          startMonth: periodKey({ year: date.getFullYear(), month: date.getMonth() }),
          lastGenerated: null,
          active: true,
          userId: user.id,
          createdAt: serverTimestamp(),
        }),
        { success: "Recorrente criada. Ela será lançada todo mês" }
      )
    } else if (repeat === "installments") {
      const batch = writeBatch(db)
      const each = Math.round((cents / nInstallments)) / 100
      for (let i = 0; i < nInstallments; i++) {
        const d = new Date(when.getFullYear(), when.getMonth() + i, when.getDate(), when.getHours(), when.getMinutes())
        batch.set(doc(collection(db, "transactions")), {
          ...base,
          title: `${base.title} (${i + 1}/${nInstallments})`,
          amount: (type === "income" ? 1 : -1) * each,
          userId: user.id,
          createdAt: Timestamp.fromDate(d),
          source: "installment",
        })
      }
      runWrite(batch.commit(), { success: `${nInstallments} parcelas lançadas` })
    } else {
      runWrite(
        addDoc(collection(db, "transactions"), {
          ...base,
          userId: user.id,
          createdAt: Timestamp.fromDate(when),
          source: "manual",
        }),
        { success: type === "income" ? "Receita salva" : "Despesa salva" }
      )
    }
    onClose()
  }

  function remove() {
    const data = stripDerived(editing)
    const ref = doc(db, "transactions", editing.id)
    runWrite(deleteDoc(ref), {
      success: "Transação excluída",
      undo: () => runWrite(setDoc(ref, data), { success: "Transação restaurada" }),
    })
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={editing ? "Editar transação" : "Nova transação"}
      footer={
        <div className="flex gap-2">
          {editing && (
            <Button variant="soft" onClick={remove} className="text-danger !px-5" aria-label="Excluir transação">
              <Trash2 size={17} />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          )}
          <Button className="flex-1" onClick={save}>
            {editing ? "Salvar alterações" : type === "income" ? "Salvar receita" : "Salvar despesa"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          tone="soft"
          value={type}
          onChange={(v) => {
            setType(v)
            if (v === "income" && !editing) setCategory("Salário")
            if (v === "expense" && !editing && INCOME_CATEGORIES.includes(category)) setCategory(categories[0]?.name)
          }}
          options={[
            { value: "expense", label: "Despesa" },
            { value: "income", label: "Receita" },
          ]}
        />

        <Field label="Valor" error={show("amount")}>
          <MoneyInput big cents={cents} onChange={setCents} invalid={!!show("amount")} autoFocus={!editing} />
        </Field>

        <Field label="Descrição" error={show("title")}>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "income" ? "Ex.: Salário" : "Ex.: Mercado"}
            maxLength={80}
            invalid={!!show("title")}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </Field>

        <div>
          <span className="block text-[13px] font-semibold mb-1.5">Categoria</span>
          <div className="grid grid-cols-3 gap-2">
            {orderedCategories.map((c) => {
              const active = c.name === category
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c.name)}
                  className={`flex flex-col items-center justify-center gap-1 min-h-[64px] px-1 py-2 rounded-2xl text-[12.5px] font-semibold transition
                    ${active ? "bg-lime" : "bg-soft hover:bg-line"}`}
                >
                  <CategoryIcon category={c} size={28} active={active} />
                  <span className="truncate max-w-full">{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Data" error={show("date")}>
          <div className="flex flex-wrap gap-2">
            {[
              ["today", "Hoje"],
              ["yesterday", "Ontem"],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setDateMode(v)}
                className={`h-11 px-5 rounded-full text-sm font-semibold transition ${dateMode === v ? "bg-ink text-white" : "bg-soft hover:bg-line"}`}
              >
                {label}
              </button>
            ))}
            <span
              className={`relative h-11 pl-4 pr-3 rounded-full text-sm font-semibold flex items-center gap-2 transition
                ${dateMode === "other" ? "bg-ink text-white" : "bg-soft hover:bg-line"}`}
            >
              <CalendarDays size={15} />
              {dateMode === "other" ? (
                <input
                  type="date"
                  value={otherDate}
                  onChange={(e) => setOtherDate(e.target.value)}
                  className="bg-transparent outline-none [color-scheme:dark] w-[130px]"
                  aria-label="Outra data"
                />
              ) : (
                <button type="button" onClick={() => setDateMode("other")} className="pr-1">
                  Outra data
                </button>
              )}
            </span>
          </div>
        </Field>

        {!editing && (
          <div>
            <span className="block text-[13px] font-semibold mb-1.5">Repetição</span>
            <Segmented
              tone="soft"
              value={repeat}
              onChange={setRepeat}
              options={[
                { value: "none", label: "Única" },
                { value: "monthly", label: "Todo mês" },
                { value: "installments", label: "Parcelada" },
              ]}
            />
            {repeat === "monthly" && (
              <p className="flex gap-2 text-[12.5px] text-muted mt-2">
                <Repeat size={14} className="shrink-0 mt-0.5" />
                Lançada automaticamente todo dia {date?.getDate() ?? "–"}. Bom para salário, aluguel e assinaturas.
                Você pode pausar em Perfil → Recorrentes.
              </p>
            )}
            {repeat === "installments" && (
              <div className="mt-3">
                <Field
                  label="Número de parcelas"
                  error={show("installments")}
                  hint={
                    nInstallments >= 2 && cents > 0
                      ? `${nInstallments}x de ${(Math.round(cents / nInstallments) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}, uma por mês. O valor acima é o total da compra.`
                      : "O valor acima é o total da compra."
                  }
                >
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={72}
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    invalid={!!show("installments")}
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {editing && rule && (
          <p className="flex gap-2 text-[12.5px] text-muted bg-soft rounded-2xl p-3">
            <Repeat size={14} className="shrink-0 mt-0.5" />
            Lançamento da recorrente “{rule.title}”. Alterar aqui muda só este mês.
          </p>
        )}
      </div>
    </Sheet>
  )
}
