# 💰 TrackFinance

Aplicação de controle financeiro pessoal com autenticação, dashboard interativo e metas financeiras.

🔗 **[Ver demo ao vivo](https://trackfinance-gamma.vercel.app)**

---

## ✨ Funcionalidades

- **Autenticação** com Google via Supabase Auth
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
| [Supabase](https://supabase.com/) | Banco de dados e autenticação |
| [Recharts](https://recharts.org/) | Gráficos |
| [Lucide React](https://lucide.dev/) | Ícones |
| [React Router](https://reactrouter.com/) | Navegação |
| [Vercel](https://vercel.com/) | Deploy |

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/cauamconceicao/trackfinance.git
cd trackfinance

# Instale as dependências
npm install
```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/)
2. Crie as tabelas abaixo no **Table Editor**
3. Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### Tabelas necessárias

**transactions**
| Coluna | Tipo |
|---|---|
| id | uuid (PK) |
| user_id | uuid |
| title | text |
| amount | numeric |
| category | text |
| created_at | timestamptz |

**goals**
| Coluna | Tipo |
|---|---|
| id | uuid (PK) |
| user_id | uuid |
| title | text |
| target_amount | numeric |
| current_amount | numeric |
| created_at | timestamptz |

### Políticas de segurança (RLS)

Ative o RLS nas duas tabelas e crie as policies:

```sql
-- transactions
create policy "Users can manage own transactions"
on transactions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- goals
create policy "Users can manage own goals"
on goals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

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
└── supabase.js
```

---

## 📸 Screenshots
<img width="1918" height="1079" alt="image" src="https://github.com/user-attachments/assets/962a75b6-5d1b-42d0-b119-4b1b35450879" />
<img width="1918" height="1079" alt="image" src="https://github.com/user-attachments/assets/bd1cac2f-244f-4f5a-b839-cc0cc627bcd0" />
<img width="1918" height="1079" alt="image" src="https://github.com/user-attachments/assets/6ed349ce-8116-44ce-b361-9664e0f994ef" />
<img width="1918" height="1079" alt="image" src="https://github.com/user-attachments/assets/8c2bd377-6490-4719-a98e-c7f71ac15c20" />
<img width="1918" height="1079" alt="image" src="https://github.com/user-attachments/assets/dddfce40-f488-48bc-b576-133fa581cc08" />
<img width="1918" height="1079" alt="image" src="https://github.com/user-attachments/assets/8f61f80d-09f5-4658-9f6c-a07cd39368f5" />







---

## 📄 Licença

MIT © [Cauã Conceição](https://github.com/cauamconceicao)
