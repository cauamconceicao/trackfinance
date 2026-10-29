export function normalizeKey(key) {
  return String(key)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
}

export function parseAmount(raw) {
  if (typeof raw === "number") return raw
  if (!raw) return null

  let str = String(raw).trim()
  if (str === "-" || str === "") return null

  const isNegative = /^\(.*\)$/.test(str)
  str = str.replace(/[()]/g, "")
  str = str.replace(/r\$|\s/gi, "")

  const lastDot = str.lastIndexOf(".")
  const lastComma = str.lastIndexOf(",")
  const decimalIndex = Math.max(lastDot, lastComma)

  if (decimalIndex === -1) {
    str = str.replace(/[.,]/g, "")
  } else {
    const decimalChar = str[decimalIndex]
    const thousandsChar = decimalChar === "." ? "," : "."
    str = str.split(thousandsChar).join("")
    if (decimalChar === ",") str = str.replace(",", ".")
  }

  const value = parseFloat(str)
  if (Number.isNaN(value)) return null
  return isNegative ? -Math.abs(value) : value
}
