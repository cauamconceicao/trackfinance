# 💰 TrackFinance

Aplicação de controle financeiro pessoal com autenticação, dashboard interativo e metas financeiras.

🔗 **[Ver demo ao vivo](https://trackfinance-gamma.vercel.app)**

---

## ✨ Funcionalidades

- **Autenticação** com Google via Firebase Auth
- **Dashboard** com saldo, receitas, despesas e gráficos
- **Transações** — adicionar, editar, excluir e filtrar por categoria ou tipo
- **Metas financeiras** — valor alvo, barra de progresso e atualização do valor guardado
- **Métricas** — gráfico de gastos por categoria e destaque do maior gasto
- **Responsivo** — sidebar no desktop, bottom navbar no mobile

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
<img width="1600" height="899" alt="image" src="https://github.com/user-attachments/assets/d36652ff-6458-4ff8-8a49-4c155a88b7dc" />
<img width="1600" height="899" alt="image" src="https://github.com/user-attachments/assets/d16be78d-09a6-4cae-8d9b-6b655a636b78" />
<img width="1600" height="898" alt="image" src="https://github.com/user-attachments/assets/f7370bf4-3020-43de-9254-a20e6d7b0279" />
<img width="1600" height="898" alt="image" src="https://github.com/user-attachments/assets/538b19da-eb3a-4911-8739-6d254dc2de49" />
<img width="1600" height="900" alt="image" src="https://github.com/user-attachments/assets/b519f0f1-aa62-4ba8-bf79-76a79111da80" />
<img width="1600" height="900" alt="image" src="https://github.com/user-attachments/assets/93507f3c-92fe-4b88-a8c8-8dbdcd8ec7c2" />











---

## 📄 Licença

MIT © [Cauã Conceição](https://github.com/cauamconceicao)
