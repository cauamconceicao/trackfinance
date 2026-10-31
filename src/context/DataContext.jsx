import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  collection, query, where, onSnapshot, doc, setDoc, updateDoc, Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"
import { DEFAULT_CATEGORIES } from "../lib/categories"
import {
  toDate, periodOf, periodRange, periodKey, parsePeriodKey, addMonths, monthsBetween,
} from "../lib/format"

const DataContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  return useContext(DataContext)
}

function sortByDateDesc(a, b) {
  return b.date - a.date
}

// Lança automaticamente as transações recorrentes até o mês atual
async function generateRecurring(rules, userId) {
  const now = new Date()
  const current = { year: now.getFullYear(), month: now.getMonth() }

  for (const rule of rules) {
    if (rule.active === false) continue
    const start = parsePeriodKey(rule.startMonth)
    if (!start) continue
    const last = parsePeriodKey(rule.lastGenerated)
    let next = last ? addMonths(last, 1) : start
    if (monthsBetween(next, current) < 0) continue

    // Limite de segurança: no máximo 24 meses por vez
    let count = 0
    while (monthsBetween(next, current) >= 0 && count < 24) {
      const daysInMonth = new Date(next.year, next.month + 1, 0).getDate()
      const day = Math.min(rule.dayOfMonth || 1, daysInMonth)
      const id = `rec_${rule.id}_${periodKey(next).replace("-", "")}`
      await setDoc(doc(db, "transactions", id), {
        title: rule.title,
        amount: rule.amount,
        category: rule.category,
        userId,
        createdAt: Timestamp.fromDate(new Date(next.year, next.month, day)),
        recurringId: rule.id,
        source: "recurring",
      })
      next = addMonths(next, 1)
      count++
    }
    await updateDoc(doc(db, "recurring", rule.id), {
      lastGenerated: periodKey(addMonths(next, -1)),
    })
  }
}

export function DataProvider({ user, children }) {
  const [rawTransactions, setRawTransactions] = useState(null)
  const [goals, setGoals] = useState(null)
  const [recurring, setRecurring] = useState([])
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const generating = useRef(false)

  // Só o id importa: o objeto user muda a cada renovação do token
  const userId = user?.id

  useEffect(() => {
    if (!userId) return

    function onError(err) {
      console.error(err)
      setError(err)
    }

    const unsubs = [
      onSnapshot(
        query(collection(db, "transactions"), where("userId", "==", userId)),
        (snap) => setRawTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        onError
      ),
      onSnapshot(
        query(collection(db, "goals"), where("userId", "==", userId)),
        (snap) => setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        onError
      ),
      // Coleções novas: se as regras ainda não foram publicadas, o app segue com os padrões
      onSnapshot(
        query(collection(db, "recurring"), where("userId", "==", userId)),
        (snap) => setRecurring(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.warn("recurring:", err.message)
      ),
      onSnapshot(
        doc(db, "userSettings", userId),
        (snap) => setSettings(snap.exists() ? snap.data() : {}),
        (err) => {
          console.warn("userSettings:", err.message)
          setSettings({})
        }
      ),
    ]
    return () => unsubs.forEach((u) => u())
  }, [userId, reloadKey])

  useEffect(() => {
    if (!userId || generating.current || recurring.length === 0) return
    generating.current = true
    generateRecurring(recurring, userId)
      .catch((err) => console.warn("Recorrentes:", err.message))
      .finally(() => {
        generating.current = false
      })
  }, [recurring, userId])

  const monthStartDay = settings?.monthStartDay ?? 1
  const categories = settings?.categories?.length ? settings.categories : DEFAULT_CATEGORIES

  // Até a pessoa escolher um mês, segue o mês atual (respeitando o dia de início)
  const [chosenPeriod, setChosenPeriod] = useState(null)
  const period = chosenPeriod ?? periodOf(new Date(), monthStartDay)

  const transactions = useMemo(() => {
    if (!rawTransactions) return null
    const now = new Date()
    return rawTransactions
      .map((t) => {
        const date = toDate(t.createdAt) ?? now
        return { ...t, date, future: date > now }
      })
      .sort(sortByDateDesc)
  }, [rawTransactions])

  function transactionsIn(p) {
    if (!transactions) return []
    const { start, end } = periodRange(p, monthStartDay)
    return transactions.filter((t) => t.date >= start && t.date < end)
  }

  function totalsFor(list) {
    let income = 0
    let expenses = 0
    for (const t of list) {
      if (t.amount > 0) income += t.amount
      else expenses += -t.amount
    }
    return { income, expenses, balance: income - expenses }
  }

  async function saveSettings(patch) {
    await setDoc(doc(db, "userSettings", user.id), { userId: user.id, ...patch }, { merge: true })
  }

  const value = {
    user,
    loading: transactions === null || goals === null || settings === null,
    error,
    retry: () => {
      setError(null)
      setReloadKey((k) => k + 1)
    },
    transactions: transactions ?? [],
    goals: (goals ?? []).slice().sort((a, b) => (toDate(a.createdAt) ?? 0) - (toDate(b.createdAt) ?? 0)),
    recurring,
    categories,
    monthStartDay,
    settings: settings ?? {},
    saveSettings,
    period,
    setPeriod: setChosenPeriod,
    currentPeriod: periodOf(new Date(), monthStartDay),
    transactionsIn,
    totalsFor,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
