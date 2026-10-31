import { monthsBetween, parsePeriodKey } from "./format"

export const GOAL_ICONS = ["shield", "plane", "laptop", "book", "heart", "phone", "house", "car", "gift", "piggy"]

export const GOAL_IDEAS = [
  { title: "Reserva de emergência", icon: "shield" },
  { title: "Viagem", icon: "plane" },
  { title: "Curso", icon: "book" },
  { title: "Celular novo", icon: "phone" },
]

export function goalProgress(goal) {
  if (!goal.targetAmount) return 0
  return Math.min(100, Math.round(((goal.currentAmount ?? 0) / goal.targetAmount) * 100))
}

// Quanto guardar por mês para chegar no prazo (null se não há prazo ou já chegou lá)
export function monthlyNeeded({ targetAmount, currentAmount = 0, deadline }) {
  const end = parsePeriodKey(deadline)
  const remaining = (targetAmount || 0) - (currentAmount || 0)
  if (!end || remaining <= 0) return null
  const now = new Date()
  const months = Math.max(1, monthsBetween({ year: now.getFullYear(), month: now.getMonth() }, end))
  return Math.ceil((remaining / months) * 100) / 100
}

export function isOverdue(deadline) {
  const end = parsePeriodKey(deadline)
  if (!end) return false
  const now = new Date()
  return monthsBetween({ year: now.getFullYear(), month: now.getMonth() }, end) < 0
}
