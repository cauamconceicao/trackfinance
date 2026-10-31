import * as XLSX from "xlsx"
import { normalizeKey, parseAmount } from "./textParsing"

const BASE_YEAR = 2026

const MONTH_TOKENS = [
  ["jan", 0], ["fev", 1], ["mar", 2], ["abr", 3], ["mai", 4], ["jun", 5],
  ["jul", 6], ["ago", 7], ["set", 8], ["out", 9], ["nov", 10], ["dez", 11],
]

function monthFromText(text) {
  const norm = normalizeKey(text)
  for (const [token, index] of MONTH_TOKENS) {
    if (norm.includes(token)) return index
  }
  return null
}

function addMonths(year, month, delta) {
  const total = month + delta
  return { year: year + Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

const EN_MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function parseShortDate(raw, fallbackYear) {
  if (!raw) return null
  const match = String(raw).trim().match(/^(\d{1,2})[-/]([A-Za-z]+)$/)
  if (!match) return null
  const day = Number(match[1])
  const month = EN_MONTH_MAP[match[2].toLowerCase().slice(0, 3)]
  if (month === undefined || day < 1 || day > 31) return null
  return new Date(fallbackYear, month, day)
}

function isCartaoSheet(name) {
  return /cart[aã]o/i.test(name)
}

const CATEGORY_KEYWORDS = [
  ["Moradia", [
    "condominio", "aluguel", "luz", "internet", "gas", "planejado cozinha", "parcela apartamento",
    "panela", "pedra pia", "aquecedor", "tinta", "cuba", "lava e seca", "sofa", "guarda-roupa",
    "guarda roupa", "cortina", "toalha", "microondas", "filtro", "leroy merlin", "mercado livre",
    "reforma", "piso", "cartorio",
  ]],
  ["Saúde", [
    "farmacia", "drogasil", "drogaria", "alergo", "terapia", "academia", "wellhub", "sabonete",
    "limpeza pele", "remedio",
  ]],
  ["Transporte", [
    "uber", "metro", "onibus", "99", "blabla car", "estacionamento", "posto", "gasolina",
  ]],
  ["Educação", [
    "curso", "livro", "ingles", "aula", "teoria musical",
  ]],
  ["Lazer", [
    "spotify", "netflix", "disney", "prime video", "hbo", "youtube premium", "deezer", "teatro", "sesc", "clube",
    "ingresso", "show", "balada", "cinema", "bar ",
    "boteco", "botequim", "chopp", "breja", "churrasquinho", "churras", "espeto", "espetinho",
    "pirata", "samba", "flutuante", "fotos",
  ]],
  ["Alimentação", [
    "restaurante", "cafe", "lanche", "burguer", "hamburguer", "pizza", "sushi", "feira",
    "mercado", "mercadinho", "sacolao", "horti", "padaria", "acucar", "extra", "carrefour",
    "atacadao", "coop", "daki", "swift", "pao", "doce", "sorvete", "chocolate", "vinho",
    "cerveja", "pastel", "empadinha", "salgado", "feijoada", "camarao", "salmao", "frango",
    "castanha", "fruta", "almoco", "jantinha", "ifood", "popeyes", "outback", "king", "grill",
    "milk shake", "pudim", "conveniencia", "quintal", "espetaria", "casquinha", "cha ",
    "beef", "buffet", "sabor", "graal", "churrasco", "atlantis", "chuletao", "hotdog",
  ]],
]

export function classifyCategory(title) {
  // Pontuação vira espaço e a palavra-chave precisa estar no começo de uma palavra
  // (evita "gas" casar com "drogasil")
  const norm = ` ${normalizeKey(title).replace(/[^a-z0-9]+/g, " ")} `
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => norm.includes(` ${kw.trimStart()}`))) return category
  }
  return "Outros"
}

function findHeaderBlocks(headerRow) {
  const blocks = []
  headerRow.forEach((cell, idx) => {
    if (normalizeKey(cell || "") === "compra") {
      const block = { compraCol: idx, groupCol: idx - 1 }
      for (let i = idx + 1; i < Math.min(idx + 7, headerRow.length); i++) {
        const label = normalizeKey(headerRow[i] || "")
        if (label === "data") block.dataCol = i
        else if (label === "valor") block.valorCol = i
        else if (label.startsWith("qtd parcelas")) block.qtdCol = i
        else if (normalizeKey(headerRow[i] || "") === "compra") break
      }
      blocks.push(block)
    }
  })
  return blocks
}

function parseCartaoSheets(workbook, skipTitles) {
  const realized = []
  const occurrences = new Map()

  for (const sheetName of workbook.SheetNames) {
    if (!isCartaoSheet(sheetName)) continue
    const month = monthFromText(sheetName)
    if (month === null) continue
    const year = BASE_YEAR

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: null,
      raw: false,
    })
    const header = rows[0] || []
    const blocks = findHeaderBlocks(header)

    for (const block of blocks) {
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r]
        if (!row) continue

        const compra = row[block.compraCol]
        if (!compra) continue
        const title = String(compra).trim()
        if (["total", "subtotal", "soma", "totais"].includes(normalizeKey(title))) continue

        const amount = parseAmount(row[block.valorCol])
        if (amount === null) continue

        const category = classifyCategory(title)
        const qtdRaw = block.qtdCol !== undefined ? row[block.qtdCol] : null
        const match = qtdRaw && /^(\d+)\s*\/\s*(\d+)$/.exec(String(qtdRaw).trim())

        if (!match) {
          const dataRaw = block.dataCol !== undefined ? row[block.dataCol] : null
          const date = parseShortDate(dataRaw, year) ?? new Date(year, month, 5)
          realized.push({
            title,
            amount: -Math.abs(amount),
            category,
            date,
            scheduled: false,
          })
          continue
        }

        const normTitle = normalizeKey(title)
        if (skipTitles.has(normTitle)) continue

        const current = Number(match[1])
        const total = Number(match[2])
        const key = `${normTitle}|${total}`
        if (!occurrences.has(key)) occurrences.set(key, [])
        occurrences.get(key).push({ title, category, amount: -Math.abs(amount), current, total, month, year })
      }
    }
  }

  for (const list of occurrences.values()) {
    list.sort((a, b) => a.year - b.year || a.month - b.month)
    for (const occ of list) {
      realized.push({
        title: occ.title,
        amount: occ.amount,
        category: occ.category,
        date: new Date(occ.year, occ.month, 5),
        scheduled: false,
      })
    }
    const last = list[list.length - 1]
    const remaining = last.total - last.current
    for (let i = 1; i <= remaining; i++) {
      const { year, month } = addMonths(last.year, last.month, i)
      realized.push({
        title: last.title,
        amount: last.amount,
        category: last.category,
        date: new Date(year, month, 5),
        scheduled: true,
      })
    }
  }

  return realized
}

function parseCasalMatrix(workbook) {
  const sheet = workbook.Sheets["Planilha Casal"]
  if (!sheet) return { transactions: [], installmentTitles: new Set() }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false })
  const headerRowIndex = rows.findIndex((r) => normalizeKey(r?.[0] || "") === "despesas mensais")
  if (headerRowIndex === -1) return { transactions: [], installmentTitles: new Set() }

  const totalRowIndex = rows.findIndex(
    (r, i) => i > headerRowIndex && normalizeKey(r?.[0] || "").includes("custo total")
  )
  const cartoesRowIndex = rows.findIndex(
    (r, i) => i > headerRowIndex && normalizeKey(r?.[0] || "") === "cartoes"
  )

  const monthColStart = 2
  const lastMonthCol = rows[headerRowIndex].reduce(
    (acc, cell, i) => (i >= monthColStart && normalizeKey(cell || "") && normalizeKey(cell || "") !== "total" ? i : acc),
    monthColStart
  )

  function colDate(colIdx) {
    const { year, month } = addMonths(BASE_YEAR, 0, colIdx - monthColStart)
    return new Date(year, month, 5)
  }

  const now = new Date()
  const transactions = []
  const installmentTitles = new Set()

  const fixedEnd = cartoesRowIndex === -1 ? headerRowIndex : cartoesRowIndex
  for (let r = headerRowIndex + 1; r < fixedEnd; r++) {
    const label = rows[r]?.[0]
    if (!label || !String(label).trim()) continue
    const title = String(label).trim()
    for (let c = monthColStart; c <= lastMonthCol; c++) {
      const amount = parseAmount(rows[r][c])
      if (amount === null) continue
      const date = colDate(c)
      transactions.push({
        title,
        amount: -Math.abs(amount),
        category: classifyCategory(title),
        date,
        scheduled: date > now,
      })
    }
  }

  const parceladoStart = cartoesRowIndex === -1 ? fixedEnd : cartoesRowIndex + 1
  const parceladoEnd = totalRowIndex === -1 ? rows.length : totalRowIndex
  for (let r = parceladoStart; r < parceladoEnd; r++) {
    const label = rows[r]?.[0]
    if (!label || !String(label).trim()) continue
    const title = String(label).trim()
    installmentTitles.add(normalizeKey(title))
    for (let c = monthColStart; c <= lastMonthCol; c++) {
      const amount = parseAmount(rows[r][c])
      if (amount === null) continue
      const date = colDate(c)
      transactions.push({
        title,
        amount: -Math.abs(amount),
        category: classifyCategory(title),
        date,
        scheduled: date > now,
      })
    }
  }

  return { transactions, installmentTitles }
}

export function parseCoupleBudgetWorkbook(workbook) {
  const { transactions: casalTransactions, installmentTitles } = parseCasalMatrix(workbook)
  const cartaoTransactions = parseCartaoSheets(workbook, installmentTitles)
  return [...casalTransactions, ...cartaoTransactions]
}

export function looksLikeCoupleBudget(workbook) {
  return workbook.SheetNames.some(isCartaoSheet) && workbook.SheetNames.includes("Planilha Casal")
}
