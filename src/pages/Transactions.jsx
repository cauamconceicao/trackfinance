import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, TrendingUp, TrendingDown, Search, Pencil, Check, X, Upload } from "lucide-react"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"
import { parseSpreadsheet } from "../utils/parseSpreadsheet"
import { CATEGORIES } from "../constants"

export default function Transactions({ user }) {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("Todas")
  const [filterType, setFilterType] = useState("Todas")
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [isInstallment, setIsInstallment] = useState(false)
  const [installments, setInstallments] = useState(2)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editCategory, setEditCategory] = useState(CATEGORIES[0])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) fetchTransactions()
  }, [user])

  async function fetchTransactions() {
    try {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.id),
        orderBy("createdAt", "desc")
      )
      const snapshot = await getDocs(q)
      setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.log(error)
    }
  }

  async function addTransaction() {
    if (!title || !amount) return
    if (isInstallment && (!installments || installments < 2)) return
    setLoading(true)
    try {
      if (!isInstallment) {
        await addDoc(collection(db, "transactions"), {
          title,
          amount: Number(amount),
          category,
          userId: user.id,
          createdAt: serverTimestamp(),
        })
      } else {
        const total = Number(installments)
        const today = new Date()
        const batch = writeBatch(db)
        for (let i = 0; i < total; i++) {
          const installmentDate = new Date(today.getFullYear(), today.getMonth() + i, today.getDate())
          batch.set(doc(collection(db, "transactions")), {
            title: `${title} (${i + 1}/${total})`,
            amount: Number(amount),
            category,
            userId: user.id,
            createdAt: Timestamp.fromDate(installmentDate),
            scheduled: i > 0,
          })
        }
        await batch.commit()
      }
      await fetchTransactions()
      setTitle("")
      setAmount("")
      setCategory(CATEGORIES[0])
      setIsInstallment(false)
      setInstallments(2)
      setShowForm(false)
    } catch (error) {
      console.log(error)
    }
    setLoading(false)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setImporting(true)
    setImportResult(null)
    try {
      const { valid, skipped } = await parseSpreadsheet(file)
      const CHUNK_SIZE = 450

      const previousImportQuery = query(
        collection(db, "transactions"),
        where("userId", "==", user.id),
        where("source", "==", "import")
      )
      const previousImportSnapshot = await getDocs(previousImportQuery)
      const previousDocs = previousImportSnapshot.docs
      for (let i = 0; i < previousDocs.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db)
        for (const d of previousDocs.slice(i, i + CHUNK_SIZE)) {
          batch.delete(d.ref)
        }
        await batch.commit()
      }

      for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db)
        for (const t of valid.slice(i, i + CHUNK_SIZE)) {
          batch.set(doc(collection(db, "transactions")), {
            title: t.title,
            amount: t.amount,
            category: t.category,
            userId: user.id,
            createdAt: Timestamp.fromDate(t.date),
            scheduled: Boolean(t.scheduled),
            source: "import",
          })
        }
        await batch.commit()
      }

      await fetchTransactions()
      setImportResult({ imported: valid.length, skipped, replaced: previousDocs.length })
    } catch (error) {
      console.log(error)
      setImportResult({ error: true })
    }
    setImporting(false)
  }

  async function removeTransaction(id) {
    try {
      await deleteDoc(doc(db, "transactions", id))
      fetchTransactions()
    } catch (error) {
      console.log(error)
    }
  }

  async function saveEdit(id) {
    try {
      await updateDoc(doc(db, "transactions", id), {
        title: editTitle,
        amount: Number(editAmount),
        category: editCategory,
      })
      fetchTransactions()
      setEditingId(null)
    } catch (error) {
      console.log(error)
    }
  }

  function startEditing(t) {
    setEditingId(t.id)
    setEditTitle(t.title)
    setEditAmount(String(t.amount))
    setEditCategory(t.category ?? CATEGORIES[0])
  }

  function cancelEditing() {
    setEditingId(null)
  }

  function formatBRL(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.category ?? "").toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      filterCategory === "Todas" || t.category === filterCategory
    const matchType =
      filterType === "Todas" ||
      (filterType === "Receitas" && t.amount > 0) ||
      (filterType === "Despesas" && t.amount < 0)
    return matchSearch && matchCategory && matchType
  })

  if (!user) return <p className="p-8 text-zinc-400">Carregando...</p>

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {transactions.length} transações no total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-xl transition"
          >
            <Upload size={16} />
            {importing ? "Importando..." : "Importar planilha"}
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
          >
            <Plus size={16} />
            Nova
          </button>
        </div>
      </div>

      {/* Resultado da importação */}
      {importResult && (
        <div
          className={`text-sm px-4 py-3 rounded-xl mb-6 border
            ${importResult.error
              ? "bg-red-950/40 border-red-900/50 text-red-400"
              : "bg-green-950/40 border-green-900/50 text-green-400"}`}
        >
          {importResult.error
            ? "Não foi possível importar a planilha. Verifique o arquivo e tente novamente."
            : `${importResult.imported} transações importadas` +
              (importResult.replaced > 0
                ? ` (substituindo ${importResult.replaced} de uma importação anterior)`
                : "") +
              (importResult.skipped > 0
                ? `, ${importResult.skipped} linhas ignoradas (dados incompletos).`
                : ".")}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-6">
          <p className="text-sm font-medium text-zinc-300 mb-3">Nova Transação</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Descrição"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
            />
            <input
              type="number"
              placeholder={isInstallment ? "Valor da parcela" : "Valor (negativo = despesa)"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
                className="w-4 h-4 accent-green-600"
              />
              Compra parcelada
            </label>
            {isInstallment && (
              <input
                type="number"
                min={2}
                placeholder="Nº de parcelas"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-32 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-green-600 transition"
              />
            )}
          </div>
          {isInstallment && (
            <p className="text-xs text-zinc-500 mt-2">
              Cria {installments || 0} transações: a 1ª agora, as demais previstas nos próximos meses (não contam no saldo até o mês chegar).
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={addTransaction}
              disabled={loading || !title || !amount || (isInstallment && (!installments || installments < 2))}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              <Plus size={16} />
              {loading ? "Adicionando..." : "Adicionar"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
        >
          {["Todas", ...CATEGORIES].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-600 transition"
        >
          {["Todas", "Receitas", "Despesas"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-16">
          {search || filterCategory !== "Todas" || filterType !== "Todas"
            ? "Nenhuma transação encontrada."
            : "Nenhuma transação ainda."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-3.5 rounded-2xl transition group"
            >
              {editingId === transaction.id ? (
                /* Modo edição */
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-green-600 transition"
                    />
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-green-600 transition"
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-green-600 transition"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(transaction.id)}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition"
                    >
                      <Check size={13} />
                      Salvar
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs px-4 py-1.5 rounded-lg hover:bg-zinc-800 transition"
                    >
                      <X size={13} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo visualização */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                        ${transaction.amount > 0 ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"}`}
                    >
                      {transaction.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{transaction.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {transaction.category && (
                          <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                            {transaction.category}
                          </span>
                        )}
                        {transaction.scheduled && (
                          <span className="text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full">
                            Previsto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${transaction.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {transaction.amount > 0 ? "+" : ""}
                      {formatBRL(transaction.amount)}
                    </p>
                    <button
                      onClick={() => startEditing(transaction)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-green-400 hover:bg-green-950/60 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeTransaction(transaction.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-950/60 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}