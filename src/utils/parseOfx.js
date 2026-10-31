import { parseAmount } from "./textParsing"

// Bancos brasileiros costumam gerar OFX 1.x (SGML) em Windows-1252; o OFX 2.x é XML em UTF-8.
// O cabeçalho nem sempre diz a verdade: tenta UTF-8 estrito e, se falhar, usa Windows-1252.
function decode(buffer) {
  let text
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer)
  } catch {
    text = new TextDecoder("windows-1252").decode(buffer)
  }
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

// Lê o valor de uma tag; funciona com e sem tag de fechamento
function tag(block, name) {
  const match = new RegExp(`<${name}>\\s*([^<\\r\\n]*)`, "i").exec(block)
  return match ? match[1].trim() : null
}

// DTPOSTED: AAAAMMDD[HHMMSS[.XXX]][[-3:BRT]]
function parseOfxDate(raw) {
  const match = /^(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2})(\d{2})?)?/.exec(raw || "")
  if (!match) return null
  const [, y, m, d, hh = "0", mm = "0", ss = "0"] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss))
  return date.getMonth() === Number(m) - 1 ? date : null
}

function cleanText(s) {
  return String(s ?? "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

export function looksLikeOfx(text) {
  return /OFXHEADER|<OFX>/i.test(text.slice(0, 2000))
}

export function parseOfx(buffer, suggestCategory) {
  const text = decode(buffer)
  if (!looksLikeOfx(text)) {
    return { rows: [], errors: [], fatal: "Esse arquivo não parece um extrato OFX. Baixe o extrato de novo no app ou site do banco." }
  }

  const rows = []
  const errors = []
  const re = /<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi
  let match
  while ((match = re.exec(text))) {
    const block = match[1]
    const line = text.slice(0, match.index).split("\n").length

    const date = parseOfxDate(tag(block, "DTPOSTED"))
    const rawAmount = tag(block, "TRNAMT")
    const amount = parseAmount(rawAmount)
    const name = cleanText(tag(block, "NAME"))
    const memo = cleanText(tag(block, "MEMO"))
    // Cada banco usa NAME ou MEMO para a descrição; junta os dois quando são diferentes
    const title = name && memo && !memo.toLowerCase().includes(name.toLowerCase()) ? `${name} · ${memo}` : memo || name

    const reasons = []
    if (!date) reasons.push("data inválida")
    if (amount === null) reasons.push(rawAmount ? `valor inválido (“${rawAmount}”)` : "sem valor")
    else if (amount === 0) reasons.push("valor igual a zero")
    if (!title) reasons.push("sem descrição")
    if (reasons.length) {
      errors.push({ line, reason: reasons.join(", ") })
      continue
    }

    rows.push({
      line,
      title: title.slice(0, 200),
      amount,
      category: suggestCategory(title, amount),
      date,
      externalId: tag(block, "FITID") || null,
    })
  }

  if (!rows.length && !errors.length) {
    return { rows: [], errors: [], fatal: "Não encontramos transações nesse extrato. Confira o período escolhido no banco." }
  }
  return { rows, errors }
}
