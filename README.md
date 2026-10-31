# 💰 TrackFinance

Aplicação de controle financeiro pessoal com autenticação, dashboard interativo e metas financeiras.

🔗 **[Ver demo ao vivo](https://trackfinance-gamma.vercel.app)**

---

## ✨ Funcionalidades

- **Página de apresentação** com login pelo Google ou por e-mail e senha
- **Início** com o mês selecionado: saldo, receitas, despesas, mini gráfico dos últimos 6 meses, comparação com o mês anterior, gastos por categoria e meta principal
- **Transações** — adicionar, editar, excluir (com “Desfazer”), parceladas e **recorrentes** lançadas automaticamente todo mês
- **Busca e filtros combinados** — texto, entradas/saídas, categoria e período
- **Categorias personalizadas** — criar, renomear, escolher ícone e cor
- **Metas** — valor alvo, prazo, quanto guardar por mês, guardar/retirar dinheiro, editar e excluir
- **Importar extrato ou planilha** (.ofx do banco, .csv, .xlsx, .xls) com categorias sugeridas, modelo para baixar, prévia, detecção de duplicadas e relatório de linhas com erro
- **Exportar dados** em CSV ou Excel
- **LGPD** — política de privacidade, termos de uso e exclusão da conta com todos os dados
- **PWA** — instalável no celular e funciona sem internet (sincroniza depois)
- **Responsivo** — menu inferior flutuante no celular e barra lateral no computador

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| [React](https://react.dev/) | Interface |
| [Vite](https://vitejs.dev/) | Bundler |
| [Tailwind CSS](https://tailwindcss.com/) | Estilização |
| [Firebase](https://firebase.google.com/) | Banco de dados (Firestore) e autenticação |
| [Recharts](https://recharts.org/) | Gráficos |
| [Lucide React](https://lucide.dev/) | Ícones |
| [React Router](https://reactrouter.com/) | Navegação |
| [Vercel](https://vercel.com/) | Deploy |

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta no [Firebase](https://firebase.google.com/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/cauamconceicao/trackfinance.git
cd trackfinance

# Instale as dependências
npm install
```

### Configuração do Firebase

1. Crie um projeto no [console do Firebase](https://console.firebase.google.com/)
2. Em **Authentication → Sign-in method**, ative o provedor **Google**
3. Em **Firestore Database**, crie o banco (modo produção)
4. Em **Configurações do projeto → Seus apps**, crie um app Web e copie as credenciais
5. Crie um arquivo `.env` na raiz do projeto:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx
```

### Coleções necessárias (Firestore)

As coleções `transactions` e `goals` são criadas automaticamente no primeiro documento salvo pelo app. Cada documento guarda:

**transactions**
| Campo | Tipo |
|---|---|
| userId | string |
| title | string |
| amount | number |
| category | string |
| createdAt | timestamp |

**goals**
| Campo | Tipo |
|---|---|
| userId | string |
| title | string |
| targetAmount | number |
| currentAmount | number |
| createdAt | timestamp |

> Na primeira consulta (`userId` + ordenação por `createdAt`), o Firestore pode pedir a criação de um índice composto — o próprio erro no console do navegador traz um link para criar automaticamente.

### Regras de segurança (Firestore Rules)

Em **Firestore Database → Regras**, cole o conteúdo de [firestore.rules](firestore.rules) — ele garante que cada usuário só acesse seus próprios documentos (`request.auth.uid == userId`).

### Rodando

```bash
npm run dev
```

Acesse em `http://localhost:5173`

---

## 📁 Estrutura do projeto

```
src/
├── components/
│   ├── Sidebar.jsx       # Navegação lateral + mobile
│   ├── Card.jsx          # Cards de resumo financeiro
│   ├── ExpenseChart.jsx  # Gráfico receitas x despesas
│   └── CategoryChart.jsx # Gráfico de gastos por categoria
├── pages/
│   ├── Dashboard.jsx     # Painel principal
│   ├── Transactions.jsx  # CRUD de transações
│   ├── Goals.jsx         # Metas financeiras
│   └── Settings.jsx      # Configurações da conta
├── App.jsx
└── firebase.js
```

---

## 📸 Screenshots

> Em breve

---

## 📄 Licença

MIT © [Cauã Conceição](https://github.com/cauamconceicao)