import * as XLSX from "xlsx"
import { normalizeKey, parseAmount } from "./textParsing"
import { parseCoupleBudgetWorkbook, looksLikeCoupleBudget } from "./parseCoupleBudget"

const DATE_KEYS = ["data", "date", "dia"]
const TITLE_KEYS = ["descricao", "descrição", "titulo", "título", "title", "description", "historico", "histórico"]
const AMOUNT_KEYS = ["valor", "amount", "value", "quantia"]
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

function parseDate(raw) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw

  if (typeof raw === "string") {
    const match = raw.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
    if (match) {
      const [, day, month, year] = match
      const fullYear = year.length === 2 ? `20${year}` : year
      const date = new Date(Number(fullYear), Number(month) - 1, Number(day))
      if (!Number.isNaN(date.getTime())) return date
    }
    const fallback = new Date(raw)
    if (!Number.isNaN(fallback.getTime())) return fallback
  }

  return new Date()
}

function resolveSign(amount, typeRaw) {
  if (!typeRaw) return amount

  const type = normalizeKey(String(typeRaw))
  const isExpense = ["despesa", "saida", "débito", "debito", "expense"].some((k) => type.includes(k))
  const isIncome = ["receita", "entrada", "crédito", "credito", "income"].some((k) => type.includes(k))

  if (isExpense) return -Math.abs(amount)
  if (isIncome) return Math.abs(amount)
  return amount
}

function parseFlatTable(workbook) {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: null })

  const valid = []
  let skipped = 0

  for (const row of rows) {
    const title = findValue(row, TITLE_KEYS)
    const rawAmount = findValue(row, AMOUNT_KEYS)
    const amount = parseAmount(rawAmount)

    if (!title || amount === null) {
      skipped++
      continue
    }

    const rawType = findValue(row, TYPE_KEYS)
    const rawDate = findValue(row, DATE_KEYS)
    const category = findValue(row, CATEGORY_KEYS)

    valid.push({
      title: String(title).trim(),
      amount: resolveSign(amount, rawType),
      category: category ? String(category).trim() : "Outros",
      date: parseDate(rawDate),
      scheduled: false,
    })
  }

  return { valid, skipped }
}

export async function parseSpreadsheet(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })

  if (looksLikeCoupleBudget(workbook)) {
    const valid = parseCoupleBudgetWorkbook(workbook)
    return { valid, skipped: 0 }
  }

  return parseFlatTable(workbook)
}
