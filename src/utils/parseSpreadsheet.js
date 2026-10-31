import * as XLSX from "xlsx"
import { normalizeKey, parseAmount } from "./textParsing"
import { parseCoupleBudgetWorkbook, looksLikeCoupleBudget, classifyCategory } from "./parseCoupleBudget"
import { parseOfx } from "./parseOfx"

const BOM = String.fromCharCode(0xfeff)
const BOM_REGEX = new RegExp(`^${BOM}`)

export const ACCEPTED_EXTENSIONS = [".ofx", ".csv", ".xlsx", ".xls"]

// Sugere a categoria pela descrição quando o arquivo não traz uma
export function suggestCategory(title, amount) {
  if (amount > 0) return /sal[aá]rio|folha|pagamento de sal/i.test(title) ? "Salário" : "Outros"
  return classifyCategory(title)
}

const DATE_KEYS = ["data", "date", "dia", "data lancamento", "data da compra"]
const TITLE_KEYS = ["descricao", "titulo", "title", "description", "historico", "lancamento", "estabelecimento"]
const AMOUNT_KEYS = ["valor", "amount", "value", "quantia", "valor (r$)"]
const CATEGORY_KEYS = ["categoria", "category"]
const TYPE_KEYS = ["tipo", "type", "natureza"]

function findValue(row, candidateKeys) {
  const normalizedRow = {}
  for (const key of Object.keys(row)) {
    normalizedRow[normalizeKey(key)] = row[key]
  }
  for (const candidate of candidateKeys) {
    const value = normalizedRow[candidate]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value
    }
  }
  return null
}

function hasColumn(headers, candidateKeys) {
  return headers.some((h) => candidateKeys.includes(normalizeKey(h)))
}

function parseDate(raw) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw

  if (typeof raw === "number" && raw > 20000 && raw < 80000) {
    // Data serial do Excel
    const parsed = XLSX.SSF.parse_date_code(raw)
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d)
  }

  if (typeof raw === "string") {
    const str = raw.trim()
    const br = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/)
    if (br) {
      const [, day, month, year] = br
      const fullYear = year.length === 2 ? Number(`20${year}`) : Number(year)
      const date = new Date(fullYear, Number(month) - 1, Number(day))
      if (date.getMonth() === Number(month) - 1) return date
      return null
    }
    const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (iso) {
      const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
      if (date.getMonth() === Number(iso[2]) - 1) return date
    }
  }

  return null
}

function resolveSign(amount, typeRaw) {
  if (!typeRaw) return amount

  const type = normalizeKey(String(typeRaw))
  const isExpense = ["despesa", "saida", "debito", "expense", "gasto"].some((k) => type.includes(k))
  const isIncome = ["receita", "entrada", "credito", "income"].some((k) => type.includes(k))

  if (isExpense) return -Math.abs(amount)
  if (isIncome) return Math.abs(amount)
  return amount
}

function parseFlatTable(workbook) {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: null })
  const headers = rows.length ? Object.keys(rows[0]) : []

  const missing = []
  if (!hasColumn(headers, DATE_KEYS)) missing.push("Data")
  if (!hasColumn(headers, TITLE_KEYS)) missing.push("Descrição")
  if (!hasColumn(headers, AMOUNT_KEYS)) missing.push("Valor")
  if (rows.length && missing.length) {
    return {
      rows: [],
      errors: [],
      fatal: `Não encontramos as colunas: ${missing.join(", ")}. Use o modelo de planilha como base.`,
    }
  }

  const valid = []
  const errors = []

  rows.forEach((row, i) => {
    const line = (row.__rowNum__ ?? i + 1) + 1
    const isBlank = Object.values(row).every((v) => v === null || String(v).trim() === "")
    if (isBlank) return

    const title = findValue(row, TITLE_KEYS)
    const rawAmount = findValue(row, AMOUNT_KEYS)
    const amount = parseAmount(rawAmount)
    const rawDate = findValue(row, DATE_KEYS)
    const date = parseDate(rawDate)

    const reasons = []
    if (!title) reasons.push("sem descrição")
    if (amount === null) reasons.push(rawAmount ? `valor inválido (“${rawAmount}”)` : "sem valor")
    else if (amount === 0) reasons.push("valor igual a zero")
    if (!date) reasons.push(rawDate ? `data inválida (“${rawDate instanceof Date ? "?" : rawDate}”)` : "sem data")

    if (reasons.length) {
      errors.push({ line, reason: reasons.join(", ") })
      return
    }

    const category = findValue(row, CATEGORY_KEYS)
    valid.push({
      line,
      title: String(title).trim(),
      amount: resolveSign(amount, findValue(row, TYPE_KEYS)),
      category: category ? String(category).trim() : suggestCategory(String(title), amount),
      date,
    })
  })

  return { rows: valid, errors }
}

export async function parseSpreadsheet(file) {
  const name = file.name.toLowerCase()
  const extension = name.slice(name.lastIndexOf("."))
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return { rows: [], errors: [], fatal: `Formato ${extension || "desconhecido"} não aceito. Use .ofx, .csv, .xlsx ou .xls.` }
  }

  if (extension === ".ofx") {
    return parseOfx(await file.arrayBuffer(), suggestCategory)
  }

  let workbook
  if (extension === ".csv") {
    // Lê como texto (mantém acentos) e sem converter datas no formato americano
    const text = (await file.text()).replace(BOM_REGEX, "")
    workbook = XLSX.read(text, { type: "string", raw: true })
  } else {
    const buffer = await file.arrayBuffer()
    workbook = XLSX.read(buffer, { type: "array", cellDates: true })
  }

  if (looksLikeCoupleBudget(workbook)) {
    const rows = parseCoupleBudgetWorkbook(workbook).map((t, i) => ({ ...t, line: i + 1 }))
    return { rows, errors: [] }
  }

  return parseFlatTable(workbook)
}

// Modelo para baixar: mesmas colunas que a importação reconhece
export function downloadTemplate() {
  const today = new Date()
  const fmt = (d) => d.toLocaleDateString("pt-BR")
  const d = (n) => new Date(today.getFullYear(), today.getMonth(), n)
  const lines = [
    "Data;Descrição;Valor;Tipo;Categoria",
    `${fmt(d(5))};Salário;3200,00;Receita;Salário`,
    `${fmt(d(6))};Aluguel;1200,00;Despesa;Moradia`,
    `${fmt(d(8))};Mercado;187,40;Despesa;Alimentação`,
    `${fmt(d(9))};Transporte por app;23,90;Despesa;Transporte`,
  ]
  downloadFile("modelo-trackfinance.csv", BOM + lines.join("\r\n"), "text/csv;charset=utf-8")
}

export function downloadFile(filename, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Exporta todas as transações em CSV (abre no Excel em português) ou .xlsx
export function exportTransactions(transactions, format) {
  const rows = transactions
    .slice()
    .sort((a, b) => a.date - b.date)
    .map((t) => ({
      Data: t.date.toLocaleDateString("pt-BR"),
      Descrição: t.title,
      Valor: Math.abs(t.amount),
      Tipo: t.amount > 0 ? "Receita" : "Despesa",
      Categoria: t.category ?? "",
    }))
  const stamp = new Date().toISOString().slice(0, 10)

  if (format === "xlsx") {
    const sheet = XLSX.utils.json_to_sheet(rows)
    sheet["!cols"] = [{ wch: 12 }, { wch: 36 }, { wch: 12 }, { wch: 10 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, "Transações")
    XLSX.writeFile(wb, `trackfinance-${stamp}.xlsx`)
    return
  }

  const escape = (v) => {
    const s = String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    "Data;Descrição;Valor;Tipo;Categoria",
    ...rows.map((r) =>
      [r.Data, r.Descrição, r.Valor.toFixed(2).replace(".", ","), r.Tipo, r.Categoria].map(escape).join(";")
    ),
  ]
  downloadFile(`trackfinance-${stamp}.csv`, BOM + lines.join("\r\n"), "text/csv;charset=utf-8")
}
