import { useState } from "react"
import { useUI } from "../context/UIContext"
import { Button, Field, Sheet, TextInput } from "./ui"
import { authErrorMessage, hasPassword, savePassword } from "../lib/account"

export default function PasswordSheet({ email, onClose }) {
  const { toast, online } = useUI()
  const changing = hasPassword()
  const [current, setCurrent] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const errors = {
    current: changing && !current ? "Digite sua senha atual." : null,
    password: password.length < 6 ? "Use pelo menos 6 caracteres." : null,
    confirm: !confirm ? "Repita a senha para confirmar." : confirm !== password ? "As senhas não são iguais." : null,
  }
  const show = (key) => (submitted ? errors[key] : null)

  async function save(e) {
    e.preventDefault()
    setSubmitted(true)
    setError(null)
    if (Object.values(errors).some(Boolean)) return
    if (!online) return setError("Sem internet. Conecte-se para salvar a senha.")
    setBusy(true)
    try {
      await savePassword({ currentPassword: current, newPassword: password })
      toast(changing ? "Senha alterada" : "Senha criada. Agora você também pode entrar com e-mail e senha")
      onClose()
    } catch (err) {
      console.error(err)
      setError(err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password"
        ? "Senha atual incorreta."
        : authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Sheet open onClose={busy ? () => {} : onClose} title={changing ? "Alterar senha" : "Criar senha"}>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        <p className="text-[13px] text-muted">
          {changing ? (
            <>Troque a senha que você usa para entrar com <strong className="text-ink">{email}</strong>.</>
          ) : (
            <>
              Crie uma senha para entrar também com <strong className="text-ink">{email}</strong>, sem precisar do Google.
              É a mesma conta: seus dados continuam iguais e o login com Google segue funcionando.
            </>
          )}
        </p>
        {/* Ajuda gerenciadores de senha a associar o e-mail */}
        <input type="email" value={email} autoComplete="username" readOnly hidden />
        {changing && (
          <Field label="Senha atual" error={show("current")}>
            <TextInput type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password" invalid={!!show("current")} />
          </Field>
        )}
        <Field label={changing ? "Nova senha" : "Senha"} error={show("password")} hint="Pelo menos 6 caracteres.">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" invalid={!!show("password")} />
        </Field>
        <Field label="Repita a senha" error={show("confirm")}>
          <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password" invalid={!!show("confirm")} />
        </Field>
        {!changing && (
          <p className="text-[12.5px] text-muted">Se o seu login estiver antigo, o Google pode pedir para você confirmar a conta.</p>
        )}
        {error && <p role="alert" className="text-sm text-danger bg-danger-soft rounded-2xl p-3">{error}</p>}
        <Button type="submit" loading={busy}>{changing ? "Alterar senha" : "Criar senha"}</Button>
      </form>
    </Sheet>
  )
}
