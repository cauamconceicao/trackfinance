import Sidebar from "./components/Sidebar"
import Card from "./components/Card"
import { useState, useEffect } from "react"
import ExpenseChart from "./components/ExpenseChart"
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
    <div className="flex justify-end items-center mb-6">
  {user ? (
    <div className="flex items-center gap-4">
      <p className="text-sm text-zinc-400">
        {user.email}
      </p>

      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold"
      >
        Logout
      </button>
    </div>
  ) : (
    <button
      onClick={signInWithGoogle}
      className="bg-white text-black px-4 py-2 rounded-lg font-bold"
    >
      Login with Google
    </button>
  )}
</div>

        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <div className="grid grid-cols-3 gap-6 mt-10">
          <Card
            title="Total Balance"
            amount={`$${balance}`}
          />

          <Card
            title="Income"
            amount={`$${income}`}
          />

          <Card
            title="Expenses"
            amount={`$${Math.abs(expenses)}`}
          />
        </div>

        <div className="mt-10 bg-zinc-900 p-6 rounded-2x1 border border-zinc-800">
          <h2 className="text-2x1 font-bold mb-4">
            Add Transaction
          </h2>

          <div className="flex flex-col md:flex-row gap-4">
            <input
            type="text"
            placeholder="Transaction name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-800 p-3 rounded-lg flex-1 outline-none" 
            />

            <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-zinc-800 p-3 rounded-lg w-40 outline-none"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-zinc-800 p-3 rounded-lg outline-none"
            >
              <option value="">Category</option>
              <option value="Food">Food</option>
              <option value="Salary">Salary</option>
              <option value="Gaming">Gaming</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
            </select>

            <button
              onClick={addTransaction}
              className="bg-green-500 hover:bg-green-600 px-6 rounded-lg font-bold"
              >
                Add 
              </button>
          </div>
        </div>
        <div className="mt-10">
          <h2 className="text-2x1 font-bold mb-4">
            Recent Transactions 
          </h2>

          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id}
               className="bg-zinc-800 p-4 rounded-z1 border border-zinc-800 flex justify-between"
               >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => removeTransaction(transaction.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    X
                  </button>

                 <div>
                  <p>{transaction.title}</p>

                  <span className="text-sm text-zinc-500">
                    {transaction.category}
                  </span>
                </div>
              </div>

                <span
                  className={
                    transaction.amount > 0
                    ? "text-green-400"
                    : "text-red-400"
                  }
                >
                  ${transaction.amount}
                </span>
              </div>
            ))}

              <ExpenseChart transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App