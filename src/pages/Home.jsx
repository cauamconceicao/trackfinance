import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, Check, ChevronRight, Plus, Target, TriangleAlert,
} from "lucide-react"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Block, Button, IconButton, Money, MonthPicker, Sheet, SkeletonBlock } from "../components/ui"
import { CategoryDonut, MonthBars } from "../components/charts"
import TransactionRow from "../components/TransactionRow"
import { findCategory, ICONS } from "../lib/categories"
import { goalProgress } from "../lib/goals"
import { addMonths, formatCompactBRL, greeting, initials, monthName, periodLongLabel } from "../lib/format"

const FOLD_COLOR = "#C9C8C1"

function UpcomingSheet({ items, categories, onClose, onOpen }) {
  return (
    <Sheet open onClose={onClose} title="Próximos lançamentos">
      {items.length === 0 ? (
        <div className="bg-soft rounded-[22px] p-6 text-center">
          <Bell size={22} className="mx-auto text-muted" />
          <p className="font-semibold mt-2">Nada previsto para os próximos 30 dias</p>
          <p className="text-[13px] text-muted mt-1">Parcelas e recorrentes futuras aparecem aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((t) => (
            <TransactionRow key={t.id} transaction={t} categories={categories} showDate onClick={() => onOpen(t)} />
          ))}
        </div>
      )}
    </Sheet>
  )
}

function StartHere({ steps, onStep }) {
  const done = steps.filter((s) => s.done).length
  const next = steps.findIndex((s) => !s.done)
  return (
    <Block className="col-span-2 lg:col-span-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Comece por aqui</h2>
        <span className="bg-ink text-lime text-xs font-bold px-2.5 py-1 rounded-full">{done} de {steps.length}</span>
      </div>
      <div className="grid gap-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onStep(s)}
            className={`flex items-center gap-3 p-3 rounded-2xl text-left transition border
              ${i === next ? "bg-lime border-lime" : "border-line hover:bg-soft"}`}
          >
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
              ${s.done ? "bg-income text-white" : i === next ? "bg-ink text-white" : "bg-soft"}`}>
              {s.done ? <Check size={15} strokeWidth={3} /> : i + 1}
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block text-[14.5px] font-semibold ${s.done ? "line-through text-muted" : ""}`}>{s.title}</span>
              <span className="block text-[12.5px] text-muted">{s.subtitle}</span>
            </span>
            <ChevronRight size={17} className="text-muted shrink-0" />
          </button>
        ))}
      </div>
    </Block>
  )
}

export default function Home() {
  const data = useData()
  const { user, loading, error, retry, transactions, goals, categories, period, setPeriod, currentPeriod, transactionsIn, totalsFor } = data
  const { openSheet } = useUI()
  const navigate = useNavigate()
  const [showUpcoming, setShowUpcoming] = useState(false)

  const firstName = user.name?.split(" ")[0]
  const monthTx = transactionsIn(period)
  const totals = totalsFor(monthTx)
  const previous = addMonths(period, -1)
  const prevTotals = totalsFor(transactionsIn(previous))
  const diff = totals.balance - prevTotals.balance
  const hasAny = transactions.length > 0
  const hasPrevData = transactionsIn(previous).length > 0

  const bars = Array.from({ length: 6 }, (_, i) => {
    const p = addMonths(period, i - 5)
    return { period: p, value: totalsFor(transactionsIn(p)).balance }
  })

  // Gastos por categoria: 4 maiores + "Outras"
  const byCategory = {}
  for (const t of monthTx) {
    if (t.amount < 0) byCategory[t.category ?? "Outros"] = (byCategory[t.category ?? "Outros"] ?? 0) - t.amount
  }
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const slices = sorted.slice(0, 4).map(([name, value]) => ({ name, value, color: findCategory(categories, name).color }))
  const rest = sorted.slice(4).reduce((acc, [, v]) => acc + v, 0)
  if (rest > 0) slices.push({ name: "Outras", value: rest, color: FOLD_COLOR })

  const now = new Date()
  const in30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30)
  const upcoming = transactions.filter((t) => t.future && t.date <= in30).sort((a, b) => a.date - b.date)

  const mainGoal = [...goals].filter((g) => goalProgress(g) < 100).sort((a, b) => goalProgress(b) - goalProgress(a))[0] ?? goals[0]

  const steps = [
    { title: "Adicione uma transação", subtitle: "Um gasto ou uma entrada de hoje", done: hasAny, action: () => openSheet("transaction") },
    { title: "Importe sua planilha", subtitle: "Traga o histórico do banco", done: transactions.some((t) => t.source === "import"), action: () => openSheet("import") },
    { title: "Crie uma meta", subtitle: "Ex.: reserva de emergência", done: goals.length > 0, action: () => openSheet("goal", { preset: { title: "Reserva de emergência", icon: "shield" } }) },
  ]

  const header = (
    <div className="flex items-center gap-3 mb-5">
      <Link to="/settings" className="w-11 h-11 rounded-full bg-ink text-lime flex items-center justify-center text-sm font-bold shrink-0">
        {initials(user.name, user.email)}
      </Link>
      <div className="flex-1 min-w-0 leading-tight">
        <p className="text-[13px] text-muted">{greeting()},</p>
        <p className="font-display text-[18px] font-bold truncate">{firstName ?? "boas-vindas"}</p>
      </div>
      <MonthPicker period={period} onChange={setPeriod} current={currentPeriod} />
      <IconButton label="Próximos lançamentos" onClick={() => setShowUpcoming(true)}>
        <Bell size={18} />
        {upcoming.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-danger" />}
      </IconButton>
    </div>
  )

  if (error) {
    return (
      <div className="p-5 md:p-8 max-w-5xl mx-auto">
        {header}
        <Block className="text-center py-10">
          <TriangleAlert size={26} className="mx-auto text-danger" />
          <p className="font-semibold mt-3">Não conseguimos carregar seus dados</p>
          <p className="text-sm text-muted mt-1 mb-4">Confira sua internet e tente de novo. Se continuar, saia e entre na conta.</p>
          <Button onClick={retry}>Tentar de novo</Button>
        </Block>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-5 md:p-8 max-w-5xl mx-auto" aria-busy="true" aria-label="Carregando">
        {header}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SkeletonBlock className="col-span-2 h-[150px]" />
          <SkeletonBlock className="h-[150px]" />
          <SkeletonBlock className="h-[150px]" />
          <SkeletonBlock className="col-span-2 h-[180px]" />
          <SkeletonBlock className="h-[180px]" />
          <SkeletonBlock className="h-[180px]" />
        </div>
      </div>
    )
  }

  const GoalIcon = ICONS[mainGoal?.icon] ?? Target

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {header}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Saldo do mês */}
        <Block tone="dark" className="col-span-2 flex items-end justify-between gap-4 min-h-[150px]">
          <div className="min-w-0">
            <p className="text-[13px] text-white/60">Saldo de {periodLongLabel(period).toLowerCase()}</p>
            <Money value={totals.balance} className="font-display text-[34px] sm:text-[38px] font-bold block mt-1 leading-none" />
            {!hasAny ? (
              <p className="text-[12.5px] text-white/60 mt-3">Seu saldo aparece aqui depois da primeira transação.</p>
            ) : hasPrevData ? (
              <span className={`inline-flex items-center gap-1 mt-3 text-[12px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap
                ${diff >= 0 ? "bg-lime text-ink" : "bg-white/10 text-white"}`}>
                {diff >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                {diff >= 0 ? "+ " : "− "}{formatCompactBRL(Math.round(Math.abs(diff)))} vs. {monthName(previous.month)}
              </span>
            ) : (
              <p className="text-[12.5px] text-white/60 mt-3">{monthTx.length} transações neste mês</p>
            )}
          </div>
          {hasAny && <MonthBars data={bars} />}
        </Block>

        {/* Receitas e despesas */}
        <Block tone="lime" className="flex flex-col justify-between min-h-[130px]">
          <span className="w-9 h-9 rounded-full bg-ink text-lime flex items-center justify-center">
            <ArrowUpRight size={17} />
          </span>
          <div className="mt-4">
            <p className="text-[13px] text-ink/70">Receitas</p>
            <Money value={totals.income} className="font-display text-[22px] sm:text-[24px] font-bold" />
          </div>
        </Block>
        <Block className="flex flex-col justify-between min-h-[130px]">
          <span className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">
            <ArrowDownLeft size={17} />
          </span>
          <div className="mt-4">
            <p className="text-[13px] text-muted">Despesas</p>
            <Money value={totals.expenses} className="font-display text-[22px] sm:text-[24px] font-bold" />
          </div>
        </Block>

        {!hasAny ? (
          <StartHere steps={steps} onStep={(s) => s.action()} />
        ) : (
          <>
            {/* Por categoria (só aparece com gastos no mês) */}
            <Block className="col-span-2">
              <h2 className="font-semibold mb-4">Por categoria</h2>
              {slices.length ? (
                <CategoryDonut slices={slices} total={totals.expenses} />
              ) : (
                <p className="text-sm text-muted py-6 text-center">Nenhum gasto em {monthName(period.month)}.</p>
              )}
            </Block>

            {/* Meta principal */}
            {mainGoal ? (
              <Link to="/goals" className="block">
                <Block className="h-full flex flex-col justify-between hover:ring-2 hover:ring-ink/10 transition">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] text-muted leading-tight">{mainGoal.title}</p>
                    <GoalIcon size={16} className="text-muted shrink-0" />
                  </div>
                  <div>
                    <p className="font-display text-[34px] font-bold mt-2">{goalProgress(mainGoal)}%</p>
                    <div className="h-2 bg-soft rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-ink rounded-full" style={{ width: `${goalProgress(mainGoal)}%` }} />
                    </div>
                    <p className="text-[12px] text-muted mt-2 tabular">
                      {formatCompactBRL(mainGoal.currentAmount ?? 0)} de {formatCompactBRL(mainGoal.targetAmount).replace("R$ ", "")}
                    </p>
                  </div>
                </Block>
              </Link>
            ) : (
              <button type="button" onClick={() => openSheet("goal")} className="text-left">
                <Block className="h-full flex flex-col justify-between hover:ring-2 hover:ring-ink/10 transition">
                  <span className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">
                    <Target size={17} />
                  </span>
                  <div className="mt-4">
                    <p className="font-semibold">Crie uma meta</p>
                    <p className="text-[12.5px] text-muted">O app mostra quanto guardar por mês</p>
                  </div>
                </Block>
              </button>
            )}

            {/* Atalho para lançar */}
            <button type="button" onClick={() => openSheet("transaction")} className="text-left">
              <Block tone="dark" className="h-full flex flex-col justify-between min-h-[150px] hover:bg-black transition">
                <span className="w-10 h-10 rounded-full bg-lime text-ink flex items-center justify-center">
                  <Plus size={20} />
                </span>
                <div className="mt-4">
                  <p className="font-semibold">Nova transação</p>
                  <p className="text-[12.5px] text-white/60">Gasto ou entrada</p>
                </div>
              </Block>
            </button>

            {/* Últimas do mês */}
            <Block className="col-span-2 lg:col-span-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold">Últimas de {monthName(period.month)}</h2>
                {monthTx.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate("/transactions")}
                    className="flex items-center gap-1 text-[13px] font-semibold h-10 px-3 -mr-3 rounded-full hover:bg-soft"
                  >
                    Ver todas <ArrowRight size={14} />
                  </button>
                )}
              </div>
              {monthTx.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">Nenhuma transação em {monthName(period.month)}.</p>
              ) : (
                <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-8">
                  {monthTx.slice(0, 6).map((t) => (
                    <TransactionRow key={t.id} transaction={t} categories={categories} showDate
                      onClick={() => openSheet("transaction", { transaction: t })} />
                  ))}
                </div>
              )}
            </Block>
          </>
        )}
      </div>

      {showUpcoming && (
        <UpcomingSheet
          items={upcoming}
          categories={categories}
          onClose={() => setShowUpcoming(false)}
          onOpen={(t) => {
            setShowUpcoming(false)
            openSheet("transaction", { transaction: t })
          }}
        />
      )}
    </div>
  )
}
