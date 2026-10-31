import { useState } from "react"
import { Plus, ReceiptText, Search, Upload, X, TriangleAlert } from "lucide-react"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Block, Button, IconButton, Money, MonthPicker, PageHeader, Segmented, SkeletonBlock } from "../components/ui"
import TransactionRow from "../components/TransactionRow"
import { dayLabel, monthName, normalizeText, periodLongLabel, toInputDate } from "../lib/format"

export default function Transactions() {
  const { loading, error, retry, transactions, categories, period, setPeriod, currentPeriod, transactionsIn } = useData()
  const { openSheet } = useUI()

  const [type, setType] = useState("all")
  const [search, setSearch] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [category, setCategory] = useState("all")
  const [allPeriod, setAllPeriod] = useState(false)

  const base = allPeriod ? transactions : transactionsIn(period)
  const term = normalizeText(search)

  const filtered = base.filter((t) => {
    if (type === "income" && t.amount <= 0) return false
    if (type === "expense" && t.amount >= 0) return false
    if (category !== "all" && t.category !== category) return false
    if (term && !normalizeText(`${t.title} ${t.category ?? ""}`).includes(term)) return false
    return true
  })

  const income = filtered.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0)
  const expenses = filtered.filter((t) => t.amount < 0).reduce((a, t) => a - t.amount, 0)

  // Agrupa por dia
  const groups = []
  for (const t of filtered) {
    const key = toInputDate(t.date)
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.items.push(t)
      last.total += t.amount
    } else {
      groups.push({ key, date: t.date, items: [t], total: t.amount })
    }
  }

  const filtersActive = term || category !== "all" || type !== "all"
  const periodText = allPeriod ? "todo o período" : monthName(period.month)
  const subtitle = loading
    ? "Carregando…"
    : base.length === 0
      ? `Nenhuma transação em ${periodText}`
      : allPeriod ? `${filtered.length} de ${base.length} transações` : periodLongLabel(period)

  function clearFilters() {
    setSearch("")
    setCategory("all")
    setType("all")
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Transações"
        subtitle={subtitle}
        actions={
          <>
            <IconButton label="Buscar" onClick={() => setShowSearch((v) => !v)} className={showSearch ? "!bg-ink !text-white" : ""}>
              <Search size={18} />
            </IconButton>
            <IconButton label="Importar planilha" onClick={() => openSheet("import")}>
              <Upload size={18} />
            </IconButton>
            <IconButton label="Nova transação" variant="dark" onClick={() => openSheet("transaction")}>
              <Plus size={20} />
            </IconButton>
          </>
        }
      />

      {showSearch && (
        <div className="relative mb-3 animate-pop-in">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição ou categoria"
            className="w-full h-12 bg-card rounded-full pl-11 pr-11 text-[15px] outline-none border-2 border-transparent focus:border-ink/70"
          />
          {search && (
            <button aria-label="Limpar busca" onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-soft">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <Segmented
          className="md:flex-1"
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "Tudo" },
            { value: "income", label: "Entradas" },
            { value: "expense", label: "Saídas" },
          ]}
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoria"
            className={`flex-1 md:w-44 h-[52px] rounded-full px-4 text-sm font-semibold outline-none appearance-none
              ${category !== "all" ? "bg-ink text-white" : "bg-card"}`}
          >
            <option value="all">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <div className="[&>div>div]:h-[52px] [&>div>div>button]:h-[52px]">
            <MonthPicker
              period={period}
              current={currentPeriod}
              onChange={(p) => {
                setAllPeriod(false)
                setPeriod(p)
              }}
              allowAll
              isAll={allPeriod}
              onAll={() => setAllPeriod(true)}
            />
          </div>
        </div>
      </div>

      {error ? (
        <Block className="text-center py-10">
          <TriangleAlert size={26} className="mx-auto text-danger" />
          <p className="font-semibold mt-3">Não conseguimos carregar suas transações</p>
          <p className="text-sm text-muted mt-1 mb-4">Confira sua internet e tente de novo.</p>
          <Button onClick={retry}>Tentar de novo</Button>
        </Block>
      ) : loading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <div className="grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-[88px]" />
            <SkeletonBlock className="h-[88px]" />
          </div>
          <SkeletonBlock className="h-[320px]" />
        </div>
      ) : transactions.length === 0 ? (
        <Block className="text-center py-10 px-6">
          <span className="mx-auto w-16 h-16 rounded-full bg-lime flex items-center justify-center">
            <ReceiptText size={26} />
          </span>
          <p className="font-display text-xl font-bold mt-4">Nenhuma transação ainda</p>
          <p className="text-sm text-muted mt-1.5 max-w-sm mx-auto">
            Lance um gasto ou uma entrada, ou traga o histórico do banco importando sua planilha.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-6 max-w-md mx-auto">
            <Button className="flex-1" onClick={() => openSheet("transaction")}>
              <Plus size={18} /> Nova transação
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => openSheet("import")}>
              <Upload size={17} /> Importar planilha
            </Button>
          </div>
        </Block>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Block tone="lime" className="!py-4">
              <p className="text-[13px] text-ink/70">Entradas</p>
              <Money value={income} sign="+" className="font-display text-[22px] font-bold" />
            </Block>
            <Block className="!py-4">
              <p className="text-[13px] text-muted">Saídas</p>
              <Money value={expenses} sign="-" className="font-display text-[22px] font-bold" />
            </Block>
          </div>

          {filtered.length === 0 ? (
            <Block className="text-center py-10">
              <p className="font-semibold">
                {filtersActive ? "Nenhuma transação encontrada" : `Nenhuma transação em ${periodText}`}
              </p>
              <p className="text-sm text-muted mt-1 mb-4">
                {filtersActive ? "Tente outros filtros ou outro período." : "Escolha outro mês ou lance uma nova."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {filtersActive && <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>}
                {!allPeriod && <Button variant="outline" size="sm" onClick={() => setAllPeriod(true)}>Ver todo o período</Button>}
                <Button size="sm" onClick={() => openSheet("transaction")}><Plus size={16} /> Nova</Button>
              </div>
            </Block>
          ) : (
            <Block className="!px-5 !py-3">
              {groups.map((g) => (
                <section key={g.key} className="py-2 border-b border-line last:border-0">
                  <div className="flex items-center justify-between text-[13px] text-muted pt-1">
                    <h3 className="font-semibold text-ink">{dayLabel(g.date)}{allPeriod && ` · ${g.date.getFullYear()}`}</h3>
                    <Money value={g.total} sign={g.total > 0 ? "+" : g.total < 0 ? "-" : undefined} className="tabular" />
                  </div>
                  {g.items.map((t) => (
                    <TransactionRow key={t.id} transaction={t} categories={categories}
                      onClick={() => openSheet("transaction", { transaction: t })} />
                  ))}
                </section>
              ))}
            </Block>
          )}
        </>
      )}
    </div>
  )
}
