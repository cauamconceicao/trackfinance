import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import { onAuthStateChanged, signOut } from "firebase/auth"

import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Transactions from "./pages/Transactions"
import Goals from "./pages/Goals"
import Settings from "./pages/Settings"
import Login from "./pages/Login"

import { auth } from "./firebase"

function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  async function logout() {
    await signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              user_metadata: { full_name: firebaseUser.displayName },
            }
          : null
      )
      setAuthChecked(true)
    })

    return unsubscribe
  }, [])

  if (!authChecked) {
    return <div className="min-h-screen bg-zinc-950" />
  }

  if (!user) {
    return <Login />
  }

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
