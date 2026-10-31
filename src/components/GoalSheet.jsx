import { useState } from "react"
import { Sparkles, Trash2 } from "lucide-react"
import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Button, Field, Money, MoneyInput, Segmented, Sheet, TextInput } from "./ui"
import { ICONS } from "../lib/categories"
import { GOAL_ICONS, monthlyNeeded, goalProgress } from "../lib/goals"
import { formatBRL, monthName, parsePeriodKey, periodKey } from "../lib/format"

function GoalIconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ícone">
      {GOAL_ICONS.map((key) => {
        const Icon = ICONS[key]
        const active = key === value
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={key}
            onClick={() => onChange(key)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition
              ${active ? "bg-lime ring-2 ring-ink ring-offset-2" : "bg-soft hover:bg-line"}`}
          >
            <Icon size={18} />
          </button>
        )
      })}
    </div>
  )
}

function Projection({ target, current, deadline }) {
  const monthly = monthlyNeeded({ targetAmount: target, currentAmount: current, deadline })
  const end = parsePeriodKey(deadline)
  let text
  if (target > 0 && current >= target) text = <>Meta já alcançada. Parabéns!</>
  else if (monthly && end)
    text = (
      <>
        Guarde <strong className="text-lime">{formatBRL(monthly)} por mês</strong> para chegar lá em{" "}
        {monthName(end.month)} de {end.year}.
      </>
    )
  else if (target > 0) text = <>Defina um prazo e o app calcula quanto guardar por mês.</>
  else return null
  return (
    <div className="flex gap-2.5 bg-ink text-white rounded-2xl p-4 text-sm">
      <Sparkles size={16} className="text-lime shrink-0 mt-0.5" />
      <p>{text}</p>
    </div>
  )
}

export default function GoalSheet({ payload, onClose }) {
  const { user } = useData()
  const { runWrite } = useUI()
  const editing = payload?.goal ?? null
  const preset = payload?.preset ?? {}

  const [mode, setMode] = useState(editing && !payload?.edit ? "deposit" : "form")
  const [icon, setIcon] = useState(editing?.icon ?? preset.icon ?? "shield")
  const [title, setTitle] = useState(editing?.title ?? preset.title ?? "")
  const [target, setTarget] = useState(Math.round((editing?.targetAmount ?? 0) * 100))
  const [saved, setSaved] = useState(Math.round((editing?.currentAmount ?? 0) * 100))
  const [deadline, setDeadline] = useState(editing?.deadline ?? "")
  const [submitted, setSubmitted] = useState(false)

  const [depositType, setDepositType] = useState("add")
  const [deposit, setDeposit] = useState(0)
  const [depositTried, setDepositTried] = useState(false)

  const deadlinePeriod = parsePeriodKey(deadline)
  const now = new Date()
  const minMonth = periodKey({ year: now.getFullYear(), month: now.getMonth() })

  const errors = {
    title: !title.trim() ? "Dê um nome para a meta." : null,
    target: target <= 0 ? "Informe o valor que você quer juntar (maior que zero)." : null,
    saved: saved < 0 ? "O valor guardado não pode ser negativo." : null,
    deadline: deadline && !deadlinePeriod ? "Escolha um mês válido." : !editing && deadline && deadline < minMonth ? "O prazo precisa ser este mês ou depois." : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const show = (key) => (submitted ? errors[key] : null)
  const missing = [errors.title && "nome", errors.target && "valor alvo"].filter(Boolean)

  function save() {
    setSubmitted(true)
    if (hasErrors) return
    const data = {
      title: title.trim(),
      icon,
      targetAmount: target / 100,
      currentAmount: saved / 100,
      deadline: deadline || null,
    }
    if (editing) {
      runWrite(updateDoc(doc(db, "goals", editing.id), data), { success: "Meta atualizada" })
    } else {
      runWrite(addDoc(collection(db, "goals"), { ...data, userId: user.id, createdAt: serverTimestamp() }), {
        success: "Meta criada",
      })
    }
    onClose()
  }

  function saveDeposit() {
    setDepositTried(true)
    if (deposit <= 0) return
    const delta = (depositType === "add" ? 1 : -1) * (deposit / 100)
    const next = Math.max(0, Math.round(((editing.currentAmount ?? 0) + delta) * 100) / 100)
    runWrite(updateDoc(doc(db, "goals", editing.id), { currentAmount: next }), {
      success: depositType === "add" ? `${formatBRL(deposit / 100)} guardados` : `${formatBRL(deposit / 100)} retirados`,
    })
    onClose()
  }

  function remove() {
    // eslint-disable-next-line no-unused-vars
    const { id, ...data } = editing
    const ref = doc(db, "goals", editing.id)
    runWrite(deleteDoc(ref), {
      success: "Meta excluída",
      undo: () => runWrite(setDoc(ref, data), { success: "Meta restaurada" }),
    })
    onClose()
  }

  if (mode === "deposit") {
    const progress = goalProgress(editing)
    const Icon = ICONS[editing.icon] ?? ICONS.piggy
    return (
      <Sheet
        open
        onClose={onClose}
        title={editing.title}
        footer={
          <Button className="w-full" onClick={saveDeposit}>
            {depositType === "add" ? "Guardar valor" : "Retirar valor"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="bg-ink text-white rounded-[22px] p-5">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-full bg-lime text-ink flex items-center justify-center">
                <Icon size={18} />
              </span>
              <span className="bg-lime text-ink text-xs font-bold px-2.5 py-1 rounded-full">{progress}%</span>
            </div>
            <p className="text-sm text-white/60 mt-4">Guardado</p>
            <Money value={editing.currentAmount ?? 0} className="font-display text-[30px] font-bold" />
            <div className="h-2 bg-white/15 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-lime rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[13px] text-white/60 mt-2">de {formatBRL(editing.targetAmount)}</p>
          </div>

          <Segmented
            tone="soft"
            value={depositType}
            onChange={setDepositType}
            options={[
              { value: "add", label: "Guardar" },
              { value: "remove", label: "Retirar" },
            ]}
          />
          <Field
            label={depositType === "add" ? "Quanto você guardou?" : "Quanto você retirou?"}
            error={depositTried && deposit <= 0 ? "Informe um valor maior que zero." : null}
          >
            <MoneyInput big cents={deposit} onChange={setDeposit} autoFocus invalid={depositTried && deposit <= 0} />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode("form")}>
              Editar meta
            </Button>
            <Button variant="outline" size="sm" className="text-danger" onClick={remove}>
              <Trash2 size={15} /> Excluir
            </Button>
          </div>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={editing ? "Editar meta" : "Nova meta"}
      footer={
        <div>
          {submitted && missing.length > 0 && (
            <p role="alert" className="text-[13px] text-danger mb-2 text-center">
              Falta preencher: {missing.join(" e ")}.
            </p>
          )}
          <Button className="w-full" onClick={save}>
            {editing ? "Salvar alterações" : "Salvar meta"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <span className="block text-[13px] font-semibold mb-2">Ícone</span>
          <GoalIconPicker value={icon} onChange={setIcon} />
        </div>
        <Field label="Nome da meta" error={show("title")}>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Reserva de emergência"
            maxLength={60}
            invalid={!!show("title")}
          />
        </Field>
        <Field label="Valor alvo" error={show("target")}>
          <MoneyInput big cents={target} onChange={setTarget} invalid={!!show("target")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Já guardei" optional error={show("saved")}>
            <MoneyInput cents={saved} onChange={setSaved} />
          </Field>
          <Field label="Prazo" optional error={show("deadline")}>
            <TextInput
              type="month"
              value={deadline}
              min={editing ? undefined : minMonth}
              onChange={(e) => setDeadline(e.target.value)}
              invalid={!!show("deadline")}
            />
          </Field>
        </div>
        <Projection target={target / 100} current={saved / 100} deadline={deadline} />
        {editing && (
          <Button variant="ghost" size="sm" className="text-danger self-center" onClick={remove}>
            <Trash2 size={15} /> Excluir meta
          </Button>
        )}
      </div>
    </Sheet>
  )
}

