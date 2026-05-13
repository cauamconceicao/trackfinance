import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"

import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Transactions from "./pages/Transactions"
import Goals from "./pages/Goals"
import Settings from "./pages/Settings"

import { supabase } from "./supabase"

function App() {
  const [user, setUser] = useState(null)

  async function logout() {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    getCurrentUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="flex bg-zinc-950 min-h-screen">
      <Sidebar user={user} onLogout={logout} />

      {/* Conteúdo principal */}
      <div className="flex-1 min-h-screen text-white pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/transactions" element={<Transactions user={user} />} />
          <Route path="/goals" element={<Goals user={user} />} />
          <Route path="/settings" element={<Settings user={user} onLogout={logout} />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
