import { useState, useEffect } from "react"

import { supabase } from "../supabase"

export default function Transactions({
  user,
}) {
  const [transactions, setTransactions] =
    useState([])

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

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

  async function removeTransaction(id) {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)

    if (!error) {
      fetchTransactions()
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-10">
        Transactions
      </h1>

      <div className="flex flex-col gap-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-zinc-900 p-6 rounded-2xl flex justify-between items-center"
          >
            <div>
              <p className="text-2xl font-bold">
                {transaction.title}
              </p>

              <p className="text-zinc-400">
                {transaction.category}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <p className="text-2xl">
                ${transaction.amount}
              </p>

              <button
                onClick={() =>
                  removeTransaction(
                    transaction.id
                  )
                }
                className="bg-red-500 px-4 py-2 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}