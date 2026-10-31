import { useCallback, useEffect, useState } from "react"
import { MailCheck } from "lucide-react"
import { auth } from "../firebase"
import { useUI } from "../context/UIContext"
import { Button } from "./ui"
import { Logo } from "./Nav"
import { authErrorMessage, sendVerification } from "../lib/account"

const RESEND_WAIT = 60

// Quem criou conta com e-mail e senha só entra no app depois de confirmar o e-mail
export default function VerifyEmailGate({ email, onLogout }) {
  const { toast } = useUI()
  const [busy, setBusy] = useState(null)
  const [wait, setWait] = useState(RESEND_WAIT)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  // Recarrega o usuário; renovar o token faz o App receber emailVerified atualizado
  const refresh = useCallback(async () => {
    const user = auth.currentUser
    if (!user) return false
    await user.reload()
    if (user.emailVerified) await user.getIdToken(true)
    return user.emailVerified
  }, [])

  // Confere sozinho quando a pessoa volta da aba do e-mail
  useEffect(() => {
    function onFocus() {
      if (document.visibilityState === "visible") refresh().catch(() => {})
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [refresh])

  async function checkAgain() {
    setBusy("check")
    try {
      const ok = await refresh()
      if (!ok) toast("Ainda não confirmado. Abra o link que enviamos para o seu e-mail.", { tone: "error" })
    } catch (err) {
      toast(authErrorMessage(err), { tone: "error" })
    }
    setBusy(null)
  }

  async function resend() {
    setBusy("resend")
    try {
      await sendVerification()
      toast("Enviamos um novo link de confirmação")
      setWait(RESEND_WAIT)
    } catch (err) {
      toast(authErrorMessage(err), { tone: "error" })
    }
    setBusy(null)
  }

  return (
    <div className="min-h-dvh bg-paper flex flex-col">
      <header className="max-w-6xl w-full mx-auto px-5 py-4">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md bg-card rounded-[28px] p-6 sm:p-8 text-center">
          <span className="mx-auto w-16 h-16 rounded-full bg-lime flex items-center justify-center">
            <MailCheck size={26} />
          </span>
          <h1 className="font-display text-[26px] font-bold mt-5 leading-tight">Confirme seu e-mail</h1>
          <p className="text-[15px] text-muted mt-2">
            Enviamos um link para <strong className="text-ink break-all">{email}</strong>. Abra o e-mail, clique no link e volte
            aqui. Não achou? Confira a caixa de spam.
          </p>

          <div className="flex flex-col gap-2 mt-6">
            <Button onClick={checkAgain} loading={busy === "check"} disabled={!!busy}>
              Já confirmei
            </Button>
            <Button variant="outline" onClick={resend} loading={busy === "resend"} disabled={!!busy || wait > 0}>
              {wait > 0 ? `Reenviar link em ${wait}s` : "Reenviar link"}
            </Button>
          </div>

          <p className="text-[13px] text-muted mt-6">
            E-mail errado?{" "}
            <button type="button" onClick={onLogout} className="font-semibold text-ink underline h-10">
              Sair e usar outra conta
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
