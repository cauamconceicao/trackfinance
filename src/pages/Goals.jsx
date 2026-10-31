import { Plus, Target, TriangleAlert } from "lucide-react"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Block, Button, IconButton, Money, PageHeader, SkeletonBlock } from "../components/ui"
import { ICONS } from "../lib/categories"
import { GOAL_IDEAS, goalProgress, isOverdue, monthlyNeeded } from "../lib/goals"
import { formatBRL, formatCompactBRL, parsePeriodKey, shortPeriod } from "../lib/format"

function GoalCard({ goal, onOpen }) {
  const Icon = ICONS[goal.icon] ?? Target
  const progress = goalProgress(goal)
  const monthly = monthlyNeeded(goal)
  const end = parsePeriodKey(goal.deadline)
  const done = progress >= 100
  const late = !done && isOverdue(goal.deadline)

  return (
    <button type="button" onClick={onOpen} className="text-left w-full">
      <Block className="hover:ring-2 hover:ring-ink/10 transition h-full">
        <div className="flex items-center gap-3">
          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${done ? "bg-lime" : "bg-soft"}`}>
            <Icon size={19} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{goal.title}</p>
            <p className={`text-[12.5px] ${late ? "text-danger font-semibold" : "text-muted"}`}>
              {done ? "Meta alcançada!" : end ? `${late ? "Prazo passou:" : "até"} ${shortPeriod(end)}` : "Sem prazo"}
            </p>
          </div>
          <span className="font-display text-[26px] font-bold">{progress}%</span>
        </div>
        <div className="h-2 bg-soft rounded-full mt-4 overflow-hidden">
          <div className={`h-full rounded-full ${done ? "bg-income" : "bg-ink"}`} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between gap-2 mt-3">
          <p className="text-[13px] text-muted tabular">
            {formatCompactBRL(goal.currentAmount ?? 0)} de {formatCompactBRL(goal.targetAmount)}
          </p>
          {monthly && !late && (
            <span className="bg-ink text-lime text-[12px] font-bold px-2.5 py-1 rounded-full tabular whitespace-nowrap">
              {formatCompactBRL(monthly)}/mês
            </span>
          )}
        </div>
      </Block>
    </button>
  )
}

export default function Goals() {
  const { loading, error, retry, goals } = useData()
  const { openSheet } = useUI()

  const totalSaved = goals.reduce((a, g) => a + (g.currentAmount ?? 0), 0)
  const totalTarget = goals.reduce((a, g) => a + (g.targetAmount ?? 0), 0)
  const overall = totalTarget ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0
  const active = goals.filter((g) => goalProgress(g) < 100).length

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Metas"
        subtitle={loading ? "Carregando…" : goals.length === 0 ? "Nenhuma meta ainda" : `${active} em andamento`}
        actions={
          <IconButton label="Nova meta" variant="dark" onClick={() => openSheet("goal")}>
            <Plus size={20} />
          </IconButton>
        }
      />

      {error ? (
        <Block className="text-center py-10">
          <TriangleAlert size={26} className="mx-auto text-danger" />
          <p className="font-semibold mt-3">Não conseguimos carregar suas metas</p>
          <p className="text-sm text-muted mt-1 mb-4">Confira sua internet e tente de novo.</p>
          <Button onClick={retry}>Tentar de novo</Button>
        </Block>
      ) : loading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <SkeletonBlock className="h-[140px]" />
          <SkeletonBlock className="h-[130px]" />
          <SkeletonBlock className="h-[130px]" />
        </div>
      ) : goals.length === 0 ? (
        <>
          <Block tone="dark" className="p-6">
            <span className="w-10 h-10 rounded-full bg-lime text-ink flex items-center justify-center">
              <Target size={19} />
            </span>
            <p className="font-display text-[22px] font-bold mt-4">Crie sua primeira meta</p>
            <p className="text-sm text-white/65 mt-1.5 max-w-md">
              Defina um valor e um prazo, e o app mostra quanto guardar por mês para chegar lá.
            </p>
            <Button variant="lime" className="w-full sm:w-auto mt-5" onClick={() => openSheet("goal")}>
              <Plus size={18} /> Criar meta
            </Button>
          </Block>
          <p className="text-[13px] font-semibold text-muted mt-6 mb-2 px-1">Ideias para começar</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GOAL_IDEAS.map((idea, i) => {
              const Icon = ICONS[idea.icon]
              return (
                <button key={idea.title} type="button" onClick={() => openSheet("goal", { preset: idea })} className="text-left">
                  <Block className="min-h-[110px] flex flex-col justify-between hover:ring-2 hover:ring-ink/10 transition">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center ${i === 0 ? "bg-lime" : "bg-soft"}`}>
                      <Icon size={17} />
                    </span>
                    <span className="font-semibold text-[14.5px] mt-4">{idea.title}</span>
                  </Block>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <Block tone="dark" className="mb-3 p-6">
            <div className="flex items-start justify-between">
              <p className="text-[13px] text-white/60">Total guardado</p>
              <span className="bg-lime text-ink text-xs font-bold px-2.5 py-1 rounded-full">{overall}%</span>
            </div>
            <Money value={totalSaved} className="font-display text-[36px] font-bold block mt-1 leading-tight" />
            <div className="h-2 bg-white/15 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-lime rounded-full" style={{ width: `${overall}%` }} />
            </div>
            <p className="text-[12.5px] text-white/60 mt-2">
              de {formatBRL(totalTarget)} {goals.length === 1 ? "na meta" : `nas ${goals.length} metas`}
            </p>
          </Block>
          <div className="grid md:grid-cols-2 gap-3">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} onOpen={() => openSheet("goal", { goal: g })} />
            ))}
          </div>
          <p className="text-[12.5px] text-muted text-center mt-4">Toque numa meta para guardar dinheiro, editar ou excluir.</p>
        </>
      )}
    </div>
  )
}
