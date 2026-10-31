import { useState } from "react"
import { Link } from "react-router-dom"
import {
  CalendarDays, ChevronRight, KeyRound, CircleDollarSign, Download, FileSpreadsheet, LogOut, Repeat, ShieldCheck,
  Tag, Trash2, TriangleAlert, UserX,
} from "lucide-react"
import { useData } from "../context/DataContext"
import { useUI } from "../context/UIContext"
import { Block, Button, ConfirmDelete, Field, Sheet, TextInput } from "../components/ui"
import CategoriesSheet from "../components/CategoriesSheet"
import RecurringSheet from "../components/RecurringSheet"
import PasswordSheet from "../components/PasswordSheet"
import { authErrorMessage, deleteAccountAndData, deleteCollectionForUser, hasPassword, isGoogleUser } from "../lib/account"
import { initials } from "../lib/format"

function Row({ icon: Icon, label, value, onClick, to, chevron = true, danger }) {
  const content = (
    <>
      <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${danger ? "bg-danger-soft text-danger" : "bg-soft"}`}>
        <Icon size={18} />
      </span>
      <span className={`flex-1 font-medium ${danger ? "text-danger" : ""}`}>{label}</span>
      {value && <span className="text-[13px] text-muted">{value}</span>}
      {chevron && <ChevronRight size={17} className="text-muted" />}
    </>
  )
  const cls = "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-soft transition min-h-[60px]"
  if (to) return <Link to={to} className={cls}>{content}</Link>
  if (!onClick) return <div className={cls.replace("hover:bg-soft", "")}>{content}</div>
  return <button type="button" onClick={onClick} className={cls}>{content}</button>
}

export default function Settings({ onLogout }) {
  const { user, transactions, categories, recurring, monthStartDay, saveSettings, goals } = useData()
  const { runWrite, toast, online } = useUI()
  const [sheet, setSheet] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [password, setPassword] = useState("")
  const [dayDraft, setDayDraft] = useState(monthStartDay)
  const google = isGoogleUser()
  const withPassword = hasPassword()

  async function deleteAllTransactions() {
    if (!online) return toast("Sem internet. Conecte-se para apagar.", { tone: "error" })
    setBusy(true)
    try {
      await deleteCollectionForUser("transactions", user.id)
      toast(`${transactions.length} transações apagadas`)
      setConfirm(null)
    } catch (err) {
      console.error(err)
      toast("Não foi possível apagar as transações. Tente novamente.", { tone: "error" })
    }
    setBusy(false)
  }

  async function deleteAccount() {
    if (!online) return toast("Sem internet. Conecte-se para excluir a conta.", { tone: "error" })
    if (!google && !password) return toast("Digite sua senha para confirmar.", { tone: "error" })
    setBusy(true)
    try {
      await deleteAccountAndData(password)
      // onAuthStateChanged leva para a página inicial
    } catch (err) {
      console.error(err)
      toast(authErrorMessage(err), { tone: "error" })
      setBusy(false)
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-[32px] leading-[1.05] font-bold">Perfil</h1>
        <p className="text-[13px] text-muted mt-1">Conta e preferências</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Block tone="dark" className="col-span-2 flex items-center gap-4">
          {user.photo ? (
            <img src={user.photo} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-full object-cover shrink-0" />
          ) : (
            <span className="w-14 h-14 rounded-full bg-lime text-ink flex items-center justify-center text-lg font-bold shrink-0">
              {initials(user.name, user.email)}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-display text-[19px] font-bold truncate">{user.name ?? "Minha conta"}</p>
            <p className="text-[13px] text-white/60 truncate">{user.email}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 bg-lime text-ink text-[11.5px] font-bold px-2.5 py-1 rounded-full">
              <ShieldCheck size={12} />
              {google && withPassword ? "Google e senha" : google ? "Conectado com Google" : "Entrou com e-mail"}
            </span>
          </div>
        </Block>

        <button type="button" onClick={() => setSheet("categories")} className="text-left">
          <Block className="h-full min-h-[120px] flex flex-col justify-between hover:ring-2 hover:ring-ink/10 transition">
            <span className="w-9 h-9 rounded-full bg-soft flex items-center justify-center"><Tag size={16} /></span>
            <div className="mt-4">
              <p className="text-[13px] text-muted">Categorias</p>
              <p className="font-display text-[20px] font-bold">{categories.length} ativas</p>
            </div>
          </Block>
        </button>
        <button type="button" onClick={() => { setDayDraft(monthStartDay); setSheet("startDay") }} className="text-left">
          <Block tone="lime" className="h-full min-h-[120px] flex flex-col justify-between hover:brightness-95 transition">
            <span className="w-9 h-9 rounded-full bg-ink text-lime flex items-center justify-center"><CalendarDays size={16} /></span>
            <div className="mt-4">
              <p className="text-[13px] text-ink/70">Início do mês</p>
              <p className="font-display text-[20px] font-bold">Dia {monthStartDay}</p>
            </div>
          </Block>
        </button>

        <div className="col-span-2 bg-card rounded-[26px] overflow-hidden divide-y divide-line">
          <Row icon={Repeat} label="Recorrentes" value={`${recurring.filter((r) => r.active !== false).length} ativas`} onClick={() => setSheet("recurring")} />
          <Row icon={CircleDollarSign} label="Moeda" value="Real (R$)" chevron={false} />
          <Row icon={Download} label="Exportar dados" value="CSV ou Excel" onClick={() => setSheet("export")} />
          <Row icon={KeyRound} label="Senha" value={withPassword ? "Alterar" : "Criar senha"} onClick={() => setSheet("password")} />
          <Row icon={ShieldCheck} label="Privacidade e termos" to="/privacidade" />
          <Row icon={LogOut} label="Sair da conta" onClick={onLogout} />
        </div>

        <div className="col-span-2 bg-danger-soft rounded-[26px] p-5">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <TriangleAlert size={17} /> Zona de perigo
          </p>
          <p className="text-[13px] text-ink/70 mt-1">Essas ações não podem ser desfeitas.</p>
          <div className="grid sm:grid-cols-2 gap-2 mt-4">
            <Button variant="outline" className="!border-danger/30 text-danger" onClick={() => setConfirm("transactions")} disabled={transactions.length === 0}>
              <Trash2 size={16} /> Apagar todas as transações
            </Button>
            <Button variant="outline" className="!border-danger/30 text-danger" onClick={() => { setPassword(""); setConfirm("account") }}>
              <UserX size={16} /> Excluir minha conta
            </Button>
          </div>
        </div>
      </div>

      {sheet === "categories" && <CategoriesSheet onClose={() => setSheet(null)} />}
      {sheet === "recurring" && <RecurringSheet onClose={() => setSheet(null)} />}
      {sheet === "password" && <PasswordSheet email={user.email} onClose={() => setSheet(null)} />}

      {sheet === "startDay" && (
        <Sheet
          open
          onClose={() => setSheet(null)}
          title="Início do mês"
          footer={
            <Button className="w-full" onClick={() => {
              runWrite(saveSettings({ monthStartDay: dayDraft }), { success: "Preferência salva" }).catch(() => {})
              setSheet(null)
            }}>
              Salvar
            </Button>
          }
        >
          <p className="text-[13px] text-muted mb-4">
            Se você recebe o salário no dia 5, por exemplo, escolha o dia 5: o “mês” do app vai do dia 5 ao dia 4 do mês seguinte.
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <button key={d} type="button" onClick={() => setDayDraft(d)}
                className={`h-11 rounded-full text-sm font-semibold transition ${dayDraft === d ? "bg-ink text-white" : "bg-soft hover:bg-line"}`}>
                {d}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === "export" && (
        <Sheet open onClose={() => setSheet(null)} title="Exportar dados">
          <p className="text-[13px] text-muted mb-4">
            Baixe todas as suas {transactions.length} transações em planilha. Os arquivos abrem no Excel, Google Planilhas e Numbers.
          </p>
          {transactions.length === 0 ? (
            <p className="bg-soft rounded-2xl p-4 text-sm text-center">Você ainda não tem transações para exportar.</p>
          ) : (
            <div className="grid gap-2">
              {[
                ["xlsx", "Excel (.xlsx)", "Melhor para abrir no Excel"],
                ["csv", "CSV (.csv)", "Formato simples, abre em qualquer lugar"],
              ].map(([format, label, hint]) => (
                <button key={format} type="button"
                  onClick={() => import("../utils/parseSpreadsheet").then((m) => { m.exportTransactions(transactions, format); toast("Download iniciado") }).catch(() => toast("Não foi possível gerar o arquivo. Confira sua internet.", { tone: "error" }))}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-soft hover:bg-line transition text-left">
                  <span className="w-10 h-10 rounded-2xl bg-lime flex items-center justify-center"><FileSpreadsheet size={18} /></span>
                  <span className="flex-1">
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-[12.5px] text-muted">{hint}</span>
                  </span>
                  <Download size={17} />
                </button>
              ))}
            </div>
          )}
        </Sheet>
      )}

      <ConfirmDelete
        open={confirm === "transactions"}
        onClose={() => setConfirm(null)}
        onConfirm={deleteAllTransactions}
        busy={busy}
        title="Apagar todas as transações?"
        description={`As ${transactions.length} transações da sua conta, manuais e importadas, serão apagadas. Suas metas e categorias continuam. Isso não pode ser desfeito.`}
      />

      <ConfirmDelete
        open={confirm === "account"}
        onClose={() => setConfirm(null)}
        onConfirm={deleteAccount}
        busy={busy}
        confirmLabel="Excluir conta"
        title="Excluir sua conta?"
        description={`Vamos apagar sua conta e todos os seus dados: ${transactions.length} transações, ${goals.length} metas, recorrentes e preferências. Isso não pode ser desfeito.`}
      >
        {google ? (
          <p className="text-[12.5px] text-muted mt-3">Por segurança, o Google vai pedir para você confirmar o login.</p>
        ) : (
          <div className="text-left mt-4">
            <Field label="Sua senha">
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
          </div>
        )}
      </ConfirmDelete>
    </div>
  )
}

