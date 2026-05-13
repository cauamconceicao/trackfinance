import { useState, useEffect } from "react"

import {
  Routes,
  Route,
} from "react-router-dom"

import Sidebar from "./components/Sidebar"

import Dashboard from "./pages/Dashboard"
import Transactions from "./pages/Transactions"
import Goals from "./pages/Goals"
import Settings from "./pages/Settings"

import { supabase } from "./supabase"

function App() {
  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem("transactions")

    return savedTransactions
      ? JSON.parse(savedTransactions)
      : []

})

  const [category, setCategory] = useState("")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [user, setUser] = useState(null)

  async function addTransaction() {
    if (!title || !amount) return

    const newTransaction = {
      title: title,
      amount: Number(amount),
      category: category,
      user_id: user.id,
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert([newTransaction])

      if (error) {
        console.log(error)
        return
      }

    setTransactions([
      ...transactions,
      newTransaction,
    ])

    setTitle("")
    setAmount("")
    setCategory("")
  }

  async function removeTransaction(id) {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)

  if (!error) {
    const filteredTransactions =
      transactions.filter(
        (transaction) =>
          transaction.id !== id
      )

    setTransactions(filteredTransactions)
  }
}

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user?.id)

      if (data) {
        setTransactions(data)
      }

      if (error) {
        console.log(error)
      }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    })
  }

  async function logout() {
    await supabase.auth.signOut()
  }
  
  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((acc, transaction) => acc + transaction.amount, 0)

    const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((acc, transaction) => acc + transaction.amount, 0)

      const balance = income + expenses

      useEffect(() => {
        localStorage.setItem(
          "transactions",
          JSON.stringify(transactions)
        )
      }, [transactions])

      useEffect(() => {
        fetchTransactions()
      }, [user])

      useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
          setUser(data.user)
        })

        const {
          data: authListener,
        } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user ?? null)
          }
        )
        
        return () => {
          authListener.subscription.unsubscribe()
        }
      }, [])

  return (
    <div className="flex bg-zinc-900 min-h-screen">
      <Sidebar />

  <div className="flex-1 bg-zinc-950 min-h-screen p-8 text-white">
    <Routes>
      <Route
        path="/"
        element={<Dashboard />}
      />

      <Route
        path="/transactions"
        element={<Transactions user={user} />}
      />

      <Route
        path="/goals"
        element={<Goals />}
      />

      <Route
        path="/settings"
        element={<Settings />}
      />
    </Routes>
      </div>
    </div>
  )
}

export default App