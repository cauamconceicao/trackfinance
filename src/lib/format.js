const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export function formatBRL(value) {
  return brl.format(Number(value) || 0)
}

// Separa "R$ 1.240" de ",50" para exibir os centavos menores
export function splitBRL(value) {
  const parts = brl.formatToParts(Math.abs(Number(value) || 0))
  let main = ""
  let cents = ""
  let inFraction = false
  for (const p of parts) {
    if (p.type === "decimal") inFraction = true
    if (inFraction) cents += p.value
    else main += p.value
  }
  return { main: main.replace(/\s/, " "), cents }
}

export function formatCompactBRL(value) {
  const n = Number(value) || 0
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  })
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
const MONTHS_LONG = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

export function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

// Um período é { year, month } (month 0–11)
export function periodKey({ year, month }) {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}

export function parsePeriodKey(key) {
  const match = /^(\d{4})-(\d{2})$/.exec(key || "")
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1 }
}

export function addMonths({ year, month }, delta) {
  const total = year * 12 + month + delta
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

export function monthsBetween(a, b) {
  return (b.year - a.year) * 12 + (b.month - a.month)
}

export function periodLabel({ year, month }) {
  return `${capitalize(MONTHS[month])} ${year}`
}

export function periodLongLabel({ year, month }) {
  return `${capitalize(MONTHS_LONG[month])} ${year}`
}

export function monthName(month) {
  return MONTHS_LONG[month]
}

export function monthShort(month) {
  return MONTHS[month]
}

export function shortPeriod({ year, month }) {
  return `${MONTHS[month]}/${String(year).slice(2)}`
}

// Intervalo do período considerando o dia em que o mês começa
export function periodRange({ year, month }, startDay = 1) {
  return {
    start: new Date(year, month, startDay),
    end: new Date(year, month + 1, startDay),
  }
}

export function periodOf(date, startDay = 1) {
  const p = { year: date.getFullYear(), month: date.getMonth() }
  return date.getDate() < startDay ? addMonths(p, -1) : p
}

export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === "function") return value.toDate()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function dayLabel(date) {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  if (sameDay(date, today)) return "Hoje"
  if (sameDay(date, yesterday)) return "Ontem"
  if (sameDay(date, tomorrow)) return "Amanhã"
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "")
  const dm = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")
  return `${capitalize(weekday)}, ${dm}`
}

export function timeLabel(date) {
  if (date.getHours() === 0 && date.getMinutes() === 0) return null
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function toInputDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function fromInputDate(str) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "")
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (date.getMonth() !== Number(match[2]) - 1) return null
  return date
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return "Boa noite"
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

export function initials(name, email) {
  if (name) return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase()
  return email?.[0]?.toUpperCase() ?? "?"
}

export function normalizeText(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}
