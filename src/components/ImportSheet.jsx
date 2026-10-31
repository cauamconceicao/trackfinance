import { useMemo, useRef, useState } from "react"
import { Download, FileSpreadsheet, Landmark, TriangleAlert, Upload, CircleCheck, Copy } from "lucide-react"
import { collection, doc, Timestamp, writeBatch } from "firebase/firestore"
import { db } from "../firebase"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Button, Money, Sheet, Spinner } from "./ui"

import { normalizeText, toInputDate } from "../lib/format"
import { FALLBACK_CATEGORY } from "../lib/categories"

// A biblioteca de planilhas é pesada: só carrega quando a pessoa usa a importação
const loadParser = () => import("../utils/parseSpreadsheet")
const ACCEPTED_EXTENSIONS = [".ofx", ".csv", ".xlsx", ".xls"]

function dupKey(date, title, amount) {
  return `${toInputDate(date)}|${normalizeText(title)}|${Math.round(amount * 100)}`
}

function ErrorList({ errors }) {
  const [open, setOpen] = useState(errors.length <= 5)
  if (!errors.length) return null
  return (
    <div className="bg-danger-soft rounded-2xl p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-danger w-full text-left">
        <TriangleAlert size={16} />
        {errors.length} {errors.length === 1 ? "linha com erro não será importada" : "linhas com erro não serão importadas"}
        <span className="ml-auto text-xs underline">{open ? "Esconder" : "Ver linhas"}</span>
      </button>
      {open && (
        <ul className="mt-2 text-[13px] text-ink/80 space-y-1 max-h-40 overflow-y-auto">
          {errors.map((e) => (
            <li key={e.line}>
              <strong>Linha {e.line}:</strong> {e.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ImportSheet({ onClose }) {
  const { user, categories, transactions } = useData()
  const { toast, online } = useUI()
  const inputRef = useRef(null)

  const [step, setStep] = useState("pick")
  const [fileName, setFileName] = useState("")
  const [parsing, setParsing] = useState(false)
  const [fatal, setFatal] = useState(null)
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const existingKeys = useMemo(
    () =>
      new Set(
        transactions.flatMap((t) => [
          dupKey(t.date, t.title, t.amount),
          // Extratos OFX trazem um id único por transação (FITID)
          ...(t.externalId ? [`fitid:${t.externalId}`] : []),
        ])
      ),
    [transactions]
  )

  function matchCategory(raw) {
    if (!raw) return { name: FALLBACK_CATEGORY, unknown: null }
    const found = categories.find((c) => normalizeText(c.name) === normalizeText(raw))
    return found ? { name: found.name, unknown: null } : { name: FALLBACK_CATEGORY, unknown: raw }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setFileName(file.name)
    setFatal(null)
    setParsing(true)
    try {
      const { parseSpreadsheet } = await loadParser()
      const parsed = await parseSpreadsheet(file)
      if (parsed.fatal) {
        setFatal(parsed.fatal)
      } else if (!parsed.rows.length && !parsed.errors.length) {
        setFatal("O arquivo está vazio.")
      } else {
        const seen = new Set()
        setRows(
          parsed.rows.map((r) => {
            const key = dupKey(r.date, r.title, r.amount)
            const fitid = r.externalId ? `fitid:${r.externalId}` : null
            const duplicate =
              existingKeys.has(key) || (fitid && existingKeys.has(fitid))
                ? "já existe na sua conta"
                : seen.has(key) || (fitid && seen.has(fitid)) ? "repetida no arquivo" : null
            seen.add(key)
            if (fitid) seen.add(fitid)
            const cat = matchCategory(r.category)
            return { ...r, key: `${r.line}-${key}`, category: cat.name, unknownCategory: cat.unknown, duplicate, include: !duplicate }
          })
        )
        setErrors(parsed.errors)
        setStep("preview")
      }
    } catch (err) {
      console.error(err)
      setFatal("Não conseguimos ler o arquivo. Confira se é um extrato .ofx ou uma planilha .csv, .xlsx ou .xls válida.")
    }
    setParsing(false)
  }

  function updateRow(key, patch) {
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const selected = rows.filter((r) => r.include)
  const duplicates = rows.filter((r) => r.duplicate).length

  async function runImport() {
    if (!online) {
      toast("Sem internet. Conecte-se para importar a planilha.", { tone: "error" })
      return
    }
    setImporting(true)
    try {
      const CHUNK_SIZE = 450
      for (let i = 0; i < selected.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db)
        for (const t of selected.slice(i, i + CHUNK_SIZE)) {
          batch.set(doc(collection(db, "transactions")), {
            title: t.title,
            amount: t.amount,
            category: t.category,
            userId: user.id,
            createdAt: Timestamp.fromDate(t.date),
            source: "import",
            ...(t.externalId ? { externalId: t.externalId } : {}),
          })
        }
        await batch.commit()
      }
      setResult({ imported: selected.length, skipped: rows.length - selected.length })
      setStep("done")
      toast(`${selected.length} transações importadas`)
    } catch (err) {
      console.error(err)
      toast("A importação falhou no meio do caminho. Confira suas transações e tente de novo.", { tone: "error" })
    }
    setImporting(false)
  }

  const footer =
    step === "preview" ? (
      <div className="flex gap-2">
        <Button variant="soft" onClick={() => setStep("pick")} disabled={importing}>Voltar</Button>
        <Button className="flex-1" onClick={runImport} loading={importing} disabled={!selected.length}>
          Importar {selected.length} {selected.length === 1 ? "transação" : "transações"}
        </Button>
      </div>
    ) : step === "done" ? (
      <Button className="w-full" onClick={onClose}>Concluir</Button>
    ) : null

  return (
    <Sheet open onClose={importing ? () => {} : onClose} title="Importar planilha" footer={footer} wide={step === "preview"}>
      <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleFile} className="hidden" />

      {step === "pick" && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={parsing}
            className="flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-line rounded-[22px] py-10 px-5 hover:border-ink/40 hover:bg-soft transition"
          >
            {parsing ? <Spinner /> : (
              <span className="w-14 h-14 rounded-full bg-lime flex items-center justify-center">
                <Upload size={22} />
              </span>
            )}
            <span className="font-semibold">{parsing ? `Lendo ${fileName}…` : "Escolher arquivo"}</span>
            <span className="text-[13px] text-muted">Extrato do banco em <strong>.ofx</strong> ou planilha <strong>.csv</strong>, <strong>.xlsx</strong> e <strong>.xls</strong></span>
          </button>

          {fatal && (
            <p role="alert" className="flex gap-2 bg-danger-soft text-danger text-sm rounded-2xl p-4">
              <TriangleAlert size={16} className="shrink-0 mt-0.5" />
              {fatal}
            </p>
          )}

          <div className="bg-lime/40 rounded-[22px] p-4">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Landmark size={16} /> Mais fácil: extrato OFX do banco
            </p>
            <p className="text-[13px] text-ink/75 mt-1.5">
              No app ou site do banco, abra o <strong className="text-ink">extrato</strong> (ou a fatura do cartão), escolha o
              período e toque em <strong className="text-ink">Exportar</strong> ou <strong className="text-ink">Baixar</strong> no
              formato <strong className="text-ink">OFX</strong> (às vezes aparece como “Money” ou “Quicken”). Importe o arquivo aqui:
              não precisa montar nada, e as categorias são sugeridas pela descrição.
            </p>
          </div>

          <div className="bg-soft rounded-[22px] p-4">
            <p className="text-sm font-semibold flex items-center gap-2">
              <FileSpreadsheet size={16} /> Ou monte uma planilha
            </p>
            <p className="text-[13px] text-muted mt-1.5">
              A primeira linha precisa ter os nomes das colunas. Obrigatórias: <strong className="text-ink">Data</strong>,{" "}
              <strong className="text-ink">Descrição</strong> e <strong className="text-ink">Valor</strong>. Opcionais:{" "}
              <strong className="text-ink">Tipo</strong> (Receita ou Despesa) e <strong className="text-ink">Categoria</strong>.
              Sem a coluna Tipo, valores negativos viram despesas.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => loadParser().then((m) => m.downloadTemplate())}>
              <Download size={15} /> Baixar modelo de planilha
            </Button>
          </div>
          <p className="text-[12.5px] text-muted text-center">
            Antes de importar você vê uma prévia para conferir tudo.
          </p>
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-soft rounded-2xl p-3">
              <p className="font-display text-xl font-bold">{rows.length}</p>
              <p className="text-[12px] text-muted">lidas</p>
            </div>
            <div className="bg-soft rounded-2xl p-3">
              <p className="font-display text-xl font-bold">{duplicates}</p>
              <p className="text-[12px] text-muted">possíveis duplicadas</p>
            </div>
            <div className="bg-soft rounded-2xl p-3">
              <p className="font-display text-xl font-bold">{errors.length}</p>
              <p className="text-[12px] text-muted">com erro</p>
            </div>
          </div>
          <p className="text-[13px] text-muted">
            Arquivo <strong className="text-ink">{fileName}</strong>. Desmarque o que não quer importar e ajuste as categorias.
            {duplicates > 0 && " As duplicadas já vêm desmarcadas."}
          </p>

          <ErrorList errors={errors} />

          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">{selected.length} selecionadas</span>
            <span className="flex gap-3 font-semibold">
              <button type="button" onClick={() => setRows((l) => l.map((r) => ({ ...r, include: true })))}>Marcar todas</button>
              <button type="button" onClick={() => setRows((l) => l.map((r) => ({ ...r, include: false })))}>Desmarcar</button>
            </span>
          </div>

          <ul className="flex flex-col divide-y divide-line border border-line rounded-[22px] overflow-hidden">
            {rows.map((r) => (
              <li key={r.key} className={`flex items-start gap-3 p-3 ${r.include ? "" : "opacity-55"}`}>
                <input
                  type="checkbox"
                  checked={r.include}
                  onChange={(e) => updateRow(r.key, { include: e.target.checked })}
                  aria-label={`Importar ${r.title}`}
                  className="w-5 h-5 mt-0.5 accent-[#121212] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14.5px] font-medium truncate">{r.title}</p>
                    <Money
                      value={r.amount}
                      sign={r.amount > 0 ? "+" : "-"}
                      className={`text-sm font-bold ${r.amount > 0 ? "text-income" : ""}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[12.5px] text-muted">{r.date.toLocaleDateString("pt-BR")}</span>
                    <select
                      value={r.category}
                      onChange={(e) => updateRow(r.key, { category: e.target.value })}
                      aria-label="Categoria"
                      className="text-[12.5px] bg-soft rounded-full px-2.5 h-8 outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    {r.unknownCategory && (
                      <span className="text-[11.5px] text-muted">“{r.unknownCategory}” não existe</span>
                    )}
                    {r.duplicate && (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full">
                        <Copy size={11} /> Possível duplicada: {r.duplicate}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === "done" && result && (
        <div className="flex flex-col gap-4 items-center text-center py-4">
          <span className="w-16 h-16 rounded-full bg-lime flex items-center justify-center">
            <CircleCheck size={28} />
          </span>
          <div>
            <p className="font-display text-2xl font-bold">
              {result.imported} {result.imported === 1 ? "transação importada" : "transações importadas"}
            </p>
            <p className="text-sm text-muted mt-1">
              {result.skipped > 0 && `${result.skipped} desmarcadas não foram importadas. `}
              {errors.length > 0 ? `${errors.length} linhas tinham erro:` : "Nenhuma linha com erro."}
            </p>
          </div>
          <div className="w-full text-left">
            <ErrorList errors={errors} />
          </div>
        </div>
      )}
    </Sheet>
  )
}
