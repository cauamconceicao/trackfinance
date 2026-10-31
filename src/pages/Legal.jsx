import { Link, useNavigate } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { IconButton } from "../components/ui"

const UPDATED = "30 de outubro de 2026"
// Defina VITE_CONTACT_EMAIL no .env / na Vercel com o e-mail de contato do app
const CONTACT = import.meta.env.VITE_CONTACT_EMAIL

function Contact() {
  return CONTACT ? <a href={`mailto:${CONTACT}`} className="underline font-semibold">{CONTACT}</a> : <>o canal de contato indicado no app</>
}

function LegalLayout({ title, children, other }) {
  const navigate = useNavigate()
  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <IconButton label="Voltar" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>
          <ChevronLeft size={19} />
        </IconButton>
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] leading-tight font-bold">{title}</h1>
          <p className="text-[13px] text-muted">Atualizado em {UPDATED}</p>
        </div>
      </div>
      <article className="bg-card rounded-[26px] p-6 md:p-8 text-[15px] leading-relaxed space-y-5 [&_h2]:font-display [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:mt-7 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:text-ink/85">
        {children}
      </article>
      <p className="text-center text-[13px] text-muted mt-5">
        Veja também: <Link to={other.to} className="font-semibold underline">{other.label}</Link>
      </p>
    </div>
  )
}

export function Privacy() {
  return (
    <LegalLayout title="Política de privacidade" other={{ to: "/termos", label: "Termos de uso" }}>
      <p>
        O TrackFinance é um app de controle financeiro pessoal. Esta política explica, de forma simples, quais dados guardamos,
        para quê e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <h2>Quais dados guardamos</h2>
      <ul>
        <li><strong>Dados da conta:</strong> nome, e-mail e foto do perfil, recebidos do Google (ou informados por você no login por e-mail).</li>
        <li><strong>Dados financeiros que você cadastra:</strong> transações (descrição, valor, data, categoria), metas, recorrentes, categorias e preferências.</li>
        <li><strong>Planilhas importadas:</strong> o arquivo é lido no seu próprio aparelho; só as transações que você confirma são salvas. O arquivo não é enviado nem guardado.</li>
      </ul>
      <p>Não pedimos nem guardamos senhas de banco, números de cartão ou documentos.</p>

      <h2>Para que usamos</h2>
      <p>
        Apenas para fazer o app funcionar: mostrar seu saldo, gráficos, metas e permitir exportar seus dados. Não vendemos, não
        alugamos e não compartilhamos seus dados com anunciantes. A base legal é a execução do serviço que você pediu ao criar a conta.
      </p>

      <h2>Onde ficam os dados</h2>
      <p>
        Os dados ficam no Google Firebase (Authentication e Cloud Firestore), que pode armazená-los em servidores fora do Brasil.
        O acesso é protegido por regras que permitem que cada pessoa veja e altere somente os próprios dados. Uma cópia também fica
        no seu navegador para o app funcionar sem internet; ela é apagada quando você sai da conta ou limpa os dados do navegador.
      </p>

      <h2>Seus direitos</h2>
      <ul>
        <li><strong>Acessar e levar seus dados:</strong> em Perfil → Exportar dados (CSV ou Excel).</li>
        <li><strong>Corrigir:</strong> edite qualquer transação, meta ou categoria no próprio app.</li>
        <li><strong>Apagar:</strong> em Perfil → Zona de perigo você pode apagar todas as transações ou excluir a conta e todos os dados de uma vez.</li>
        <li><strong>Tirar dúvidas ou fazer pedidos:</strong> fale com a gente por <Contact />.</li>
      </ul>

      <h2>Por quanto tempo</h2>
      <p>Guardamos seus dados enquanto sua conta existir. Ao excluir a conta, eles são apagados de forma definitiva.</p>

      <h2>Cookies</h2>
      <p>Usamos apenas o armazenamento necessário para manter você conectado e o app funcionando. Não usamos cookies de publicidade.</p>

      <h2>Mudanças</h2>
      <p>Se esta política mudar, a data no topo será atualizada e avisaremos no app quando a mudança for importante.</p>
    </LegalLayout>
  )
}

export function Terms() {
  return (
    <LegalLayout title="Termos de uso" other={{ to: "/privacidade", label: "Política de privacidade" }}>
      <p>Ao usar o TrackFinance você concorda com estes termos. Eles são curtos de propósito.</p>

      <h2>O serviço</h2>
      <p>
        O TrackFinance ajuda você a anotar e organizar suas finanças pessoais. É gratuito e oferecido “como está”: podemos mudar,
        melhorar ou encerrar funções, avisando com antecedência quando possível.
      </p>

      <h2>Sua conta</h2>
      <ul>
        <li>Você é responsável pelo acesso à sua conta Google ou ao seu e-mail e senha.</li>
        <li>Os dados que você cadastra são seus. Você pode exportá-los ou apagá-los quando quiser.</li>
        <li>Não use o app para atividades ilegais ou para tentar acessar dados de outras pessoas.</li>
      </ul>

      <h2>Não é aconselhamento financeiro</h2>
      <p>
        Os números, gráficos e cálculos (como o valor a guardar por mês) são estimativas baseadas no que você cadastra. Eles não são
        recomendação de investimento nem substituem um profissional. Confira sempre seus extratos oficiais.
      </p>

      <h2>Limitação de responsabilidade</h2>
      <p>
        Fazemos o possível para manter o app disponível e seus dados seguros, mas não garantimos funcionamento sem falhas.
        Recomendamos exportar seus dados de tempos em tempos.
      </p>

      <h2>Contato</h2>
      <p>Dúvidas sobre estes termos: <Contact />.</p>
    </LegalLayout>
  )
}
