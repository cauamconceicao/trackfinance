import { useState } from "react"
import { ChevronRight, Plus, Trash2 } from "lucide-react"
import { doc, writeBatch } from "firebase/firestore"
import { db } from "../firebase"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Button, CategoryIcon, Field, Sheet, TextInput } from "./ui"
import { CATEGORY_COLORS, FALLBACK_CATEGORY, ICONS, ICON_KEYS } from "../lib/categories"
import { normalizeText } from "../lib/format"

// Atualiza o nome da categoria nas transações e recorrentes já lançadas
async function renameInDocs({ transactions, recurring }, from, to) {
  const refs = [
    ...transactions.filter((t) => t.category === from).map((t) => doc(db, "transactions", t.id)),
    ...recurring.filter((r) => r.category === from).map((r) => doc(db, "recurring", r.id)),
  ]
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db)
    refs.slice(i, i + 450).forEach((ref) => batch.update(ref, { category: to }))
    await batch.commit()
  }
  return refs.length
}

function CategoryForm({ initial, onSave, onDelete, onBack, existingNames }) {
  const [name, setName] = useState(initial?.name ?? "")
  const [icon, setIcon] = useState(initial?.icon ?? "tag")
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0])
  const [submitted, setSubmitted] = useState(false)
  const locked = initial?.name === FALLBACK_CATEGORY

  const duplicate = existingNames.some(
    (n) => normalizeText(n) === normalizeText(name) && n !== initial?.name
  )
  const error = !name.trim() ? "Dê um nome para a categoria." : duplicate ? "Já existe uma categoria com esse nome." : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 bg-soft rounded-2xl p-3">
        <CategoryIcon category={{ icon, color }} size={44} />
        <span className="font-semibold">{name || "Nova categoria"}</span>
      </div>
      <Field label="Nome" error={submitted ? error : null} hint={locked ? "“Outros” é a categoria padrão e não pode ser renomeada." : null}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={24} disabled={locked} invalid={submitted && !!error} />
      </Field>
      <div>
        <span className="block text-[13px] font-semibold mb-2">Ícone</span>
        <div className="grid grid-cols-8 gap-1.5">
          {ICON_KEYS.map((key) => {
            const Icon = ICONS[key]
            return (
              <button
                key={key}
                type="button"
                aria-label={key}
                aria-pressed={icon === key}
                onClick={() => setIcon(key)}
                className={`aspect-square min-h-10 rounded-xl flex items-center justify-center transition ${icon === key ? "bg-ink text-lime" : "bg-soft hover:bg-line"}`}
              >
                <Icon size={17} />
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <span className="block text-[13px] font-semibold mb-2">Cor</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-full transition ${color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="soft" onClick={onBack}>Voltar</Button>
        <Button
          className="flex-1"
          onClick={() => {
            setSubmitted(true)
            if (!error) onSave({ name: name.trim(), icon, color })
          }}
        >
          Salvar categoria
        </Button>
      </div>
      {initial && !locked && (
        <Button variant="ghost" size="sm" className="text-danger self-center" onClick={onDelete}>
          <Trash2 size={15} /> Excluir categoria
        </Button>
      )}
    </div>
  )
}

export default function CategoriesSheet({ onClose }) {
  const data = useData()
  const { categories, transactions, saveSettings } = data
  const { runWrite } = useUI()
  const [editing, setEditing] = useState(null) // null = lista, "new" ou o nome

  const current = editing && editing !== "new" ? categories.find((c) => c.name === editing) : null
  const counts = transactions.reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] ?? 0) + 1 }), {})

  function save(cat) {
    const list = current
      ? categories.map((c) => (c.name === current.name ? cat : c))
      : [...categories.filter((c) => c.name !== FALLBACK_CATEGORY), cat, ...categories.filter((c) => c.name === FALLBACK_CATEGORY)]
    const renamed = current && current.name !== cat.name
    runWrite(
      saveSettings({ categories: list }).then(() => (renamed ? renameInDocs(data, current.name, cat.name) : 0)),
      { success: current ? "Categoria atualizada" : "Categoria criada" }
    ).catch(() => {})
    setEditing(null)
  }

  function remove() {
    const list = categories.filter((c) => c.name !== current.name)
    const n = counts[current.name] ?? 0
    if (n > 0 && !window.confirm(`${n} transações de “${current.name}” passarão para “${FALLBACK_CATEGORY}”. Continuar?`)) return
    runWrite(
      saveSettings({ categories: list }).then(() => renameInDocs(data, current.name, FALLBACK_CATEGORY)),
      { success: "Categoria excluída" }
    ).catch(() => {})
    setEditing(null)
  }

  return (
    <Sheet open onClose={onClose} title={editing ? (current ? "Editar categoria" : "Nova categoria") : "Categorias"}>
      {editing ? (
        <CategoryForm
          key={editing}
          initial={current}
          existingNames={categories.map((c) => c.name)}
          onSave={save}
          onDelete={remove}
          onBack={() => setEditing(null)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col divide-y divide-line bg-card border border-line rounded-[22px] overflow-hidden">
            {categories.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  onClick={() => setEditing(c.name)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-soft transition text-left"
                >
                  <CategoryIcon category={c} size={40} />
                  <span className="flex-1 font-medium">{c.name}</span>
                  <span className="text-[12.5px] text-muted">{counts[c.name] ?? 0} transações</span>
                  <ChevronRight size={17} className="text-muted" />
                </button>
              </li>
            ))}
          </ul>
          <Button variant="lime" onClick={() => setEditing("new")}>
            <Plus size={18} /> Nova categoria
          </Button>
        </div>
      )}
    </Sheet>
  )
}
