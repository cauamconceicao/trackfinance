import { useEffect, useRef, useState } from "react"
import { X, ChevronLeft, ChevronRight, ChevronDown, Loader2, TriangleAlert } from "lucide-react"
import { splitBRL, periodLabel, addMonths, monthShort } from "../lib/format"
import { ICONS } from "../lib/categories"

/* ---------- Valores ---------- */

export function Money({ value, sign, className = "", centsClassName = "opacity-50" }) {
  const { main, cents } = splitBRL(value)
  const prefix = sign === "+" ? "+ " : sign === "-" ? "− " : value < 0 ? "− " : ""
  return (
    <span className={`tabular whitespace-nowrap ${className}`}>
      {prefix}
      {main}
      <span className={`text-[0.62em] ${centsClassName}`}>{cents}</span>
    </span>
  )
}

/* ---------- Botões ---------- */

const BUTTON_VARIANTS = {
  primary: "bg-ink text-white hover:bg-black",
  lime: "bg-lime text-ink hover:bg-lime-strong",
  outline: "bg-card text-ink border border-line hover:border-ink/30",
  soft: "bg-soft text-ink hover:bg-line",
  danger: "bg-danger text-white hover:bg-[#b42318]",
  ghost: "text-muted hover:text-ink hover:bg-soft",
}

export function Button({ variant = "primary", size = "md", loading, className = "", children, ...props }) {
  const sizes = {
    md: "h-[54px] px-6 text-[15px]",
    sm: "h-11 px-4 text-sm",
  }
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition
        active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
        ${sizes[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 size={17} className="animate-spin" />}
      {children}
    </button>
  )
}

export function IconButton({ label, variant = "card", className = "", children, ...props }) {
  const variants = {
    card: "bg-card text-ink hover:bg-soft",
    dark: "bg-ink text-lime hover:bg-black",
    soft: "bg-soft text-ink hover:bg-line",
  }
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition shrink-0
        active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
        ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Spinner({ className = "" }) {
  return <Loader2 size={20} className={`animate-spin text-muted ${className}`} />
}

/* ---------- Blocos ---------- */

export function Block({ tone = "white", className = "", children, ...props }) {
  const tones = {
    white: "bg-card text-ink",
    dark: "bg-ink text-white",
    lime: "bg-lime text-ink",
    danger: "bg-danger-soft text-ink",
  }
  return (
    <div {...props} className={`rounded-[26px] p-5 ${tones[tone]} ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="font-display text-[32px] leading-[1.05] font-bold">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

/* ---------- Abas em pílula ---------- */

export function Segmented({ options, value, onChange, className = "", tone = "white" }) {
  return (
    <div
      role="tablist"
      className={`flex p-1 rounded-full ${tone === "white" ? "bg-card" : "bg-soft"} ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 h-11 rounded-full text-sm font-semibold transition
              ${active ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Campos ---------- */

export function Field({ label, hint, error, children, optional }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold mb-1.5">
        {label}
        {optional && <span className="font-normal text-muted"> (opcional)</span>}
      </span>
      {children}
      {error ? (
        <span role="alert" className="flex items-center gap-1 text-[12.5px] text-danger mt-1.5">
          <TriangleAlert size={13} />
          {error}
        </span>
      ) : hint ? (
        <span className="block text-[12.5px] text-muted mt-1.5">{hint}</span>
      ) : null}
    </label>
  )
}

export const inputClass =
  "w-full h-[52px] bg-soft rounded-2xl px-4 text-[15px] text-ink placeholder:text-muted/70 outline-none border-2 border-transparent focus:border-ink/80 transition"

export function TextInput({ invalid, className = "", ...props }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputClass} ${invalid ? "border-danger/70" : ""} ${className}`}
    />
  )
}

// Campo de valor com máscara: digita só números e vira "R$ 187,40"
export function MoneyInput({ cents, onChange, invalid, big, autoFocus, id }) {
  const display = (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  return (
    <input
      id={id}
      inputMode="numeric"
      autoFocus={autoFocus}
      value={display}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
        onChange(Number(digits || 0))
      }}
      onFocus={(e) => {
        const el = e.target
        requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length))
      }}
      className={`${inputClass} tabular ${big ? "h-[64px] font-display text-[28px] font-bold" : ""}
        ${cents === 0 ? "text-ink/40" : ""} ${invalid ? "border-danger/70" : ""}`}
    />
  )
}

/* ---------- Ícone de categoria ---------- */

export function CategoryIcon({ category, size = 40, active }) {
  const Icon = ICONS[category?.icon] ?? ICONS.tag
  return (
    <span
      className="rounded-2xl flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: active ? "#D3F26A" : `${category?.color ?? "#8A8A80"}1F`,
        color: active ? "#121212" : category?.color ?? "#121212",
      }}
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={2} />
    </span>
  )
}

/* ---------- Gaveta (celular) / janela (computador) ---------- */

export function Sheet({ open, onClose, title, children, footer, wide }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${wide ? "md:max-w-2xl" : "md:max-w-lg"} bg-card rounded-t-[28px] md:rounded-[28px]
          max-h-[92dvh] flex flex-col animate-sheet-up md:animate-pop-in shadow-2xl`}
      >
        <div className="md:hidden mx-auto mt-2.5 w-10 h-1 rounded-full bg-line" />
        <div className="flex items-center justify-between px-5 pt-3 md:pt-5 pb-3">
          <h2 className="text-[18px] font-bold">{title}</h2>
          <IconButton label="Fechar" variant="soft" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 pb-5 flex-1 overscroll-contain">{children}</div>
        {footer && (
          <div className="px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-line/70">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Confirmação com "APAGAR" ---------- */

export function ConfirmDelete({ open, ...props }) {
  // Montado só quando aberto: o texto digitado sempre recomeça vazio
  return open ? <ConfirmDeleteDialog {...props} /> : null
}

function ConfirmDeleteDialog({ onClose, onConfirm, title, description, confirmLabel = "Apagar tudo", children, busy }) {
  const [text, setText] = useState("")
  const ok = text.trim().toUpperCase() === "APAGAR"

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={busy ? undefined : onClose} />
      <div role="alertdialog" aria-modal="true" aria-label={title}
        className="relative w-full max-w-sm bg-card rounded-[28px] p-6 text-center animate-pop-in">
        <div className="mx-auto w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mb-3">
          <TriangleAlert size={22} />
        </div>
        <h2 className="text-[19px] font-bold">{title}</h2>
        <p className="text-sm text-muted mt-1.5">{description}</p>
        {children}
        <div className="text-left mt-5">
          <Field label="Digite APAGAR para confirmar">
            <TextInput
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="APAGAR"
              autoCapitalize="characters"
              autoComplete="off"
              disabled={busy}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="soft" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} disabled={!ok} loading={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Seletor de mês ---------- */

export function MonthPicker({ period, onChange, current, allowAll, isAll, onAll }) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(period.year)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function toggle() {
    if (!open) setYear(period.year)
    setOpen((v) => !v)
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center bg-card rounded-full h-11">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => onChange(addMonths(period, -1))}
          className="hidden sm:flex w-9 h-11 items-center justify-center text-muted hover:text-ink"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex items-center gap-1 px-4 sm:px-1 h-11 text-sm font-semibold whitespace-nowrap"
        >
          {isAll ? "Todo o período" : periodLabel(period)}
          <ChevronDown size={15} className="text-muted" />
        </button>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => onChange(addMonths(period, 1))}
          className="hidden sm:flex w-9 h-11 items-center justify-center text-muted hover:text-ink"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 z-40 w-72 bg-card rounded-3xl p-4 shadow-xl border border-line/60 animate-pop-in">
          <div className="flex items-center justify-between mb-3">
            <IconButton label="Ano anterior" variant="soft" onClick={() => setYear((y) => y - 1)}>
              <ChevronLeft size={17} />
            </IconButton>
            <span className="font-bold">{year}</span>
            <IconButton label="Próximo ano" variant="soft" onClick={() => setYear((y) => y + 1)}>
              <ChevronRight size={17} />
            </IconButton>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 12 }, (_, m) => {
              const active = !isAll && period.year === year && period.month === m
              const isCurrent = current && current.year === year && current.month === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChange({ year, month: m })
                    setOpen(false)
                  }}
                  className={`h-11 rounded-full text-sm font-semibold capitalize transition
                    ${active ? "bg-ink text-white" : isCurrent ? "bg-lime" : "bg-soft hover:bg-line"}`}
                >
                  {monthShort(m)}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2 mt-3">
            {current && (
              <Button size="sm" variant="outline" className="flex-1"
                onClick={() => { onChange(current); setOpen(false) }}>
                Mês atual
              </Button>
            )}
            {allowAll && (
              <Button size="sm" variant={isAll ? "primary" : "outline"} className="flex-1"
                onClick={() => { onAll(); setOpen(false) }}>
                Todo o período
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Carregamento ---------- */

export function SkeletonBlock({ className = "" }) {
  return <div className={`rounded-[26px] bg-card/70 animate-pulse ${className}`} />
}
