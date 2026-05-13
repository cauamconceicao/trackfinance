import { useState, useEffect } from "react"

import { supabase } from "../supabase"

export default function Goals({
  user,
}) {
  const [goal, setGoal] = useState("")
  const [goals, setGoals] = useState([])

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  async function fetchGoals() {
    const { data, error } =
      await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)

    if (data) {
      setGoals(data)
    }

    if (error) {
      console.log(error)
    }
  }

  async function addGoal() {
    if (!goal) return

    const newGoal = {
      title: goal,
      user_id: user.id,
    }

    const { error } = await supabase
      .from("goals")
      .insert([newGoal])

    if (!error) {
      fetchGoals()
      setGoal("")
    }
  }

  async function removeGoal(id) {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)

    if (!error) {
      fetchGoals()
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-10">
        Financial Goals
      </h1>

      <div className="bg-zinc-900 p-6 rounded-2xl">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="New Goal"
            value={goal}
            onChange={(e) =>
              setGoal(e.target.value)
            }
            className="flex-1 bg-zinc-800 p-4 rounded-xl"
          />

          <button
            onClick={addGoal}
            className="bg-green-500 px-6 rounded-xl"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-10">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-zinc-900 p-6 rounded-2xl flex justify-between items-center"
          >
            <p className="text-2xl">
              {goal.title}
            </p>

            <button
              onClick={() =>
                removeGoal(goal.id)
              }
              className="bg-red-500 px-4 py-2 rounded-xl"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}