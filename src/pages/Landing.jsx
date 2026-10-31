import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, Lock, Mail, MonitorSmartphone, Plus, Repeat, Target, Upload,
} from "lucide-react"
import {
  createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, updateProfile,
} from "firebase/auth"
import { auth, googleProvider } from "../firebase"
import { Logo } from "../components/Nav"
import { Block, Button, Field, Money, Segmented, Sheet, TextInput } from "../components/ui"
import { authErrorMessage, sendVerification } from "../lib/account"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  )
}

function EmailSheet({ onClose, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  async function google() {
    setError(null)
    setInfo(null)
    setGoogleBusy(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setError(authErrorMessage(err))
      setGoogleBusy(false)
    }
  }

  const signup = mode === "signup"
  const confirmError =
    signup && submitted
      ? !confirm ? "Repita a senha para confirmar." : confirm !== password ? "As senhas não são iguais." : null
      : null

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitted(true)
    if (signup && !name.trim()) return setError("Digite seu nome.")
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Digite um e-mail válido.")
    if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.")
    if (signup && confirm !== password) return
    setBusy(true)
    try {
      if (signup) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(cred.user, { displayName: name.trim() })
        await sendVerification(cred.user).catch((err) => console.warn("Verificação:", err.code))
        // Renova o token para o app receber o nome (o App escuta onIdTokenChanged)
        await cred.user.getIdToken(true)
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  async function reset() {
    setError(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Digite seu e-mail acima para receber o link.")
    try {
      await sendPasswordResetEmail(auth, email.trim())
      // Por segurança o Firebase não revela se o e-mail tem conta
      setInfo("Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira também o spam.")
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title={signup ? "Criar conta" : "Entrar"}>
      <Button variant="outline" className="w-full" onClick={google} loading={googleBusy} disabled={busy}>
        {!googleBusy && <GoogleIcon />} Entrar com Google
      </Button>
      <div className="flex items-center gap-3 my-5 text-[13px] text-muted" aria-hidden="true">
        <span className="flex-1 h-px bg-line" />
        ou use seu e-mail
        <span className="flex-1 h-px bg-line" />
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Segmented tone="soft" value={mode} onChange={(m) => { setMode(m); setError(null); setSubmitted(false) }}
          options={[{ value: "signin", label: "Entrar" }, { value: "signup", label: "Criar conta" }]} />
        {signup && (
          <Field label="Nome">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
        )}
        <Field label="E-mail">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
        </Field>
        <Field label="Senha" hint={signup ? "Pelo menos 6 caracteres." : null}>
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? "new-password" : "current-password"} />
        </Field>
        {signup && (
          <Field label="Repita a senha" error={confirmError}>
            <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password" invalid={!!confirmError} />
          </Field>
        )}
        {signup && (
          <p className="text-[12.5px] text-muted -mt-1">
            Vamos enviar um link para confirmar seu e-mail. O acesso é liberado depois da confirmação.
          </p>
        )}
        {error && <p role="alert" className="text-sm text-danger bg-danger-soft rounded-2xl p-3">{error}</p>}
        {info && <p role="status" className="text-sm bg-lime/50 rounded-2xl p-3">{info}</p>}
        <Button type="submit" loading={busy}>{signup ? "Criar conta" : "Entrar"}</Button>
        {!signup && (
          <button type="button" onClick={reset} className="text-sm font-semibold text-muted hover:text-ink self-center h-10">
            Esqueci minha senha
          </button>
        )}
      </form>
    </Sheet>
  )
}

function PhonePreview() {
  return (
    <div className="w-[300px] bg-paper text-ink rounded-[40px] p-3 shadow-2xl shadow-black/50 ring-8 ring-[#1d1d1d]">
      <div className="flex items-center gap-2 px-1 py-2">
        <span className="w-8 h-8 rounded-full bg-ink text-lime text-[11px] font-bold flex items-center justify-center">RB</span>
        <div className="flex-1 leading-tight">
          <p className="text-[10px] text-muted">Boa tarde,</p>
          <p className="text-[13px] font-bold">Raika</p>
        </div>
        <span className="bg-card text-[11px] font-semibold rounded-full px-3 py-1.5">Out 2026</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 bg-ink text-white rounded-[20px] p-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-white/60">Saldo do mês</p>
            <Money value={1240.5} className="font-display text-[24px] font-bold" />
            <span className="mt-1.5 inline-flex items-center gap-1 bg-lime text-ink text-[9.5px] font-bold px-2 py-0.5 rounded-full">
              <ArrowUpRight size={10} /> + R$ 320 vs. setembro
            </span>
          </div>
          <div className="flex items-end gap-1 h-10">
            {[22, 30, 20, 34, 36, 40].map((h, i) => (
              <span key={i} className={`w-2 rounded-[3px] ${i === 5 ? "bg-lime" : "bg-white/25"}`} style={{ height: h }} />
            ))}
          </div>
        </div>
        <div className="bg-lime rounded-[20px] p-3.5">
          <span className="w-6 h-6 rounded-full bg-ink text-lime flex items-center justify-center"><ArrowUpRight size={12} /></span>
          <p className="text-[10px] text-ink/70 mt-3">Receitas</p>
          <Money value={3200} className="font-display text-[16px] font-bold" />
        </div>
        <div className="bg-card rounded-[20px] p-3.5">
          <span className="w-6 h-6 rounded-full bg-soft flex items-center justify-center"><ArrowDownLeft size={12} /></span>
          <p className="text-[10px] text-muted mt-3">Despesas</p>
          <Money value={1959.5} className="font-display text-[16px] font-bold" />
        </div>
        <div className="bg-card rounded-[20px] p-3.5">
          <p className="text-[10px] text-muted">Reserva de emergência</p>
          <p className="font-display text-[22px] font-bold mt-1">40%</p>
          <div className="h-1.5 bg-soft rounded-full mt-1.5"><div className="h-full w-2/5 bg-ink rounded-full" /></div>
        </div>
        <div className="bg-ink text-white rounded-[20px] p-3.5 flex flex-col justify-between">
          <span className="w-7 h-7 rounded-full bg-lime text-ink flex items-center justify-center"><Plus size={14} /></span>
          <p className="text-[11px] font-semibold mt-3">Nova transação</p>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: CalendarDays, title: "O mês sempre à vista", text: "Saldo, receitas e despesas de cada mês, com comparação ao mês anterior.", tone: "lime" },
  { icon: Target, title: "Metas que se explicam", text: "Defina valor e prazo; o app calcula quanto guardar por mês.", tone: "white" },
  { icon: Upload, title: "Traga seu extrato", text: "Importe o extrato do banco em .ofx ou uma planilha .csv, confira a prévia e evite duplicadas.", tone: "white" },
  { icon: Repeat, title: "Recorrentes no automático", text: "Salário, aluguel e assinaturas lançados sozinhos todo mês.", tone: "dark" },
  { icon: MonitorSmartphone, title: "Celular e computador", text: "Instale na tela inicial do celular ou use no navegador do computador.", tone: "white" },
  { icon: Lock, title: "Seus dados são seus", text: "Só você vê suas finanças. Exporte ou apague tudo quando quiser.", tone: "white" },
]

export default function Landing() {
  const [emailOpen, setEmailOpen] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function signInWithGoogle() {
    setError(null)
    setBusy(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  const cta = (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="lime" onClick={signInWithGoogle} loading={busy} className="!bg-white hover:!bg-zinc-100 sm:min-w-[230px]">
          {!busy && <GoogleIcon />} Entrar com Google
        </Button>
        <Button variant="outline" onClick={() => setEmailOpen(true)} className="!bg-transparent !text-white !border-white/25 hover:!border-white/60">
          <Mail size={17} /> Entrar com e-mail
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-[#ffb4ab]">{error}</p>}
    </div>
  )

  return (
    <div className="min-h-dvh bg-paper">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-5 py-4">
        <Logo />
        <Button size="sm" onClick={() => setEmailOpen(true)}>Entrar</Button>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-5 pb-10">
        <section className="bg-ink text-white rounded-[32px] px-6 py-10 sm:p-12 lg:p-16 grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center overflow-hidden">
          <div>
            <p className="text-[12px] font-bold tracking-[0.14em] text-lime">CONTROLE FINANCEIRO PESSOAL · GRÁTIS</p>
            <h1 className="font-display text-[40px] sm:text-[54px] leading-[1.02] font-bold mt-4">
              Suas finanças em blocos claros, com o mês sempre à vista
            </h1>
            <p className="text-white/65 text-[16px] sm:text-[17px] mt-5 max-w-xl">
              Anote gastos e entradas em segundos, veja para onde vai o dinheiro e acompanhe suas metas. No celular ou no computador.
            </p>
            <div className="mt-8">{cta}</div>
          </div>
          <div className="hidden sm:flex justify-center lg:justify-end">
            <PhonePreview />
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3" aria-label="Recursos">
          {FEATURES.map(({ icon: Icon, title, text, tone }) => (
            <Block key={title} tone={tone} className="p-6 min-h-[170px] flex flex-col justify-between">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tone === "lime" ? "bg-ink text-lime" : tone === "dark" ? "bg-lime text-ink" : "bg-soft"}`}>
                <Icon size={18} />
              </span>
              <div className="mt-6">
                <h2 className="font-display text-[19px] font-bold">{title}</h2>
                <p className={`text-[14px] mt-1 ${tone === "dark" ? "text-white/65" : tone === "lime" ? "text-ink/70" : "text-muted"}`}>{text}</p>
              </div>
            </Block>
          ))}
        </section>

        <section className="bg-lime rounded-[32px] p-8 sm:p-12 mt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-[30px] sm:text-[36px] font-bold leading-tight">Comece hoje, leva um minuto</h2>
            <p className="text-ink/70 mt-2">Entre com sua conta Google e lance sua primeira transação.</p>
          </div>
          <Button onClick={signInWithGoogle} loading={busy} className="sm:min-w-[230px]">
            {!busy && <GoogleIcon />} Entrar com Google
          </Button>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-5 pb-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-muted">
        <span>© {new Date().getFullYear()} TrackFinance</span>
        <nav className="flex gap-5">
          <Link to="/privacidade" className="hover:text-ink">Política de privacidade</Link>
          <Link to="/termos" className="hover:text-ink">Termos de uso</Link>
        </nav>
      </footer>

      {emailOpen && <EmailSheet onClose={() => setEmailOpen(false)} />}
    </div>
  )
}
