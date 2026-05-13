import { useState, useEffect } from "react"

import Card from "../components/Card"

import ExpenseChart from "../components/ExpenseChart"

import { supabase } from "../supabase"

export default function Dashboard({
  user,
}) {
  const [transactions, setTransactions] =
    useState([])

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] =
    useState("")

  async function fetchTransactions() {
    const { data, error } =
      await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)

    if (data) {
      setTransactions(data)
    }

    if (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function addTransaction() {
    if (!title || !amount) return

    const newTransaction = {
      title: title,
      amount: Number(amount),
      category: category,
      user_id: user.id,
    }

    const { error } = await supabase
      .from("transactions")
      .insert([newTransaction])

    if (error) {
      console.log(error)
      return
    }

    fetchTransactions()

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
      fetchTransactions()
    }
  }

  const income = transactions
    .filter(
      (transaction) =>
        transaction.amount > 0
    )
    .reduce(
      (acc, transaction) =>
        acc + transaction.amount,
      0
    )

  const expenses = transactions
    .filter(
      (transaction) =>
        transaction.amount < 0
    )
    .reduce(
      (acc, transaction) =>
        acc + transaction.amount,
      0
    )

  const balance = income + expenses

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <ExpenseChart
        transactions={transactions}
      />

      <div className="bg-zinc-900 p-6 rounded-2xl mt-10">
        <h2 className="text-2xl font-bold mb-6">
          Add Transaction
        </h2>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="bg-zinc-800 p-4 rounded-xl"
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            className="bg-zinc-800 p-4 rounded-xl"
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="bg-zinc-800 p-4 rounded-xl"
          />

          <button
            onClick={addTransaction}
            className="bg-green-500 p-4 rounded-xl"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded-2xl mt-10">
        <h2 className="text-2xl font-bold mb-6">
          Transactions
        </h2>

        <div className="flex flex-col gap-4">
          {transactions.map(
            (transaction) => (
              <div
                key={transaction.id}
                className="bg-zinc-800 p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">
                    {transaction.title}
                  </p>

                  <p className="text-zinc-400">
                    {transaction.category}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p>
                    ${transaction.amount}
                  </p>

                  <button
                    onClick={() =>
                      removeTransaction(
                        transaction.id
                      )
                    }
                    className="bg-red-500 px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}