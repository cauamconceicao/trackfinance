import { useState, useEffect } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { onIdTokenChanged, signOut } from "firebase/auth"
import { clearIndexedDbPersistence, terminate } from "firebase/firestore"

import Nav from "./components/Nav"
import Home from "./pages/Home"
import Transactions from "./pages/Transactions"
import Goals from "./pages/Goals"
import Settings from "./pages/Settings"
import Landing from "./pages/Landing"
import { Privacy, Terms } from "./pages/Legal"
import TransactionSheet from "./components/TransactionSheet"
import GoalSheet from "./components/GoalSheet"
import ImportSheet from "./components/ImportSheet"
import VerifyEmailGate from "./components/VerifyEmailGate"
import { Spinner } from "./components/ui"
import { DataProvider } from "./context/DataContext"
import { UIProvider, useUI } from "./context/UIContext"

import { auth, db } from "./firebase"

const TITLES = {
  "/": "Início",
  "/transactions": "Transações",
  "/goals": "Metas",
  "/settings": "Perfil",
  "/privacidade": "Política de privacidade",
  "/termos": "Termos de uso",
}

function usePageTitle(loggedIn) {
  const { pathname } = useLocation()
  useEffect(() => {
    const page = pathname === "/" && !loggedIn ? null : TITLES[pathname]
    document.title = page ? `${page} · TrackFinance` : "TrackFinance · Controle financeiro pessoal simples"
    window.scrollTo(0, 0)
  }, [pathname, loggedIn])
}

function GlobalSheets() {
  const { sheet, closeSheet } = useUI()
  if (!sheet) return null
  // A key força um formulário novo a cada abertura
  const key = `${sheet.type}-${sheet.payload?.transaction?.id ?? sheet.payload?.goal?.id ?? "new"}`
  if (sheet.type === "transaction") return <TransactionSheet key={key} payload={sheet.payload} onClose={closeSheet} />
  if (sheet.type === "goal") return <GoalSheet key={key} payload={sheet.payload} onClose={closeSheet} />
  if (sheet.type === "import") return <ImportSheet key={key} onClose={closeSheet} />
  return null
}

function AppShell({ user, onLogout }) {
  usePageTitle(true)
  return (
    <DataProvider user={user}>
      <div className="flex min-h-dvh bg-paper text-ink">
        <Nav user={user} />
        {/* Espaço no fim para o conteúdo não ficar atrás do menu inferior */}
        <main className="flex-1 min-w-0 pb-[calc(112px+env(safe-area-inset-bottom))] md:pb-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/settings" element={<Settings onLogout={onLogout} />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <GlobalSheets />
    </DataProvider>
  )
}

function PublicShell() {
  usePageTitle(false)
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacidade" element={<div className="min-h-dvh bg-paper"><Privacy /></div>} />
      <Route path="/termos" element={<div className="min-h-dvh bg-paper"><Terms /></div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  async function logout() {
    await signOut(auth)
    // Remove a cópia local dos dados financeiros deste aparelho
    try {
      await terminate(db)
      await clearIndexedDbPersistence(db)
    } catch (err) {
      console.warn(err)
    }
    window.location.assign("/")
  }

  useEffect(() => {
    // onIdTokenChanged também avisa quando o nome é salvo ou o e-mail é confirmado
    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photo: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
            }
          : null
      )
      setAuthChecked(true)
    })

    return unsubscribe
  }, [])

  if (!authChecked) {
    return (
      <div className="min-h-dvh bg-paper flex items-center justify-center" aria-busy="true">
        <Spinner />
      </div>
    )
  }

  return (
    <UIProvider>
      {!user ? (
        <PublicShell />
      ) : user.emailVerified ? (
        <AppShell user={user} onLogout={logout} />
      ) : (
        <VerifyEmailGate email={user.email} onLogout={logout} />
      )}
    </UIProvider>
  )
}

export default App
