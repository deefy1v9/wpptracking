# CRM WhatsApp — Rastreio de Leads com Meta Ads

Mini CRM fullstack para rastrear leads do WhatsApp Business, identificar origem de anúncios Meta Ads (Click-to-WhatsApp), enviar eventos CAPI ao Meta e integrar com o Cloudia.

---

## Pré-requisitos

- Node.js 20+
- npm 9+
- PostgreSQL 14+

---

## Instalação

```bash
# 1. Clone o repositório
cd rastreamentowpp

# 2. Instale todas as dependências (frontend + backend)
npm install

# 3. Configure o ambiente
cp .env.example .env
# Edite o .env com seus valores
```

### Variáveis de Ambiente (`.env`)

```env
ADMIN_USER=admin
ADMIN_PASSWORD=sua-senha-segura
JWT_SECRET=string-aleatoria-longa-aqui
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/rastreamentowpp
FRONTEND_URL=http://localhost:5173
APP_SECRET=app-secret-do-meta-business-manager
```

> **APP_SECRET**: Encontrado em developers.facebook.com → seu App → Configurações → Básico → "Segredo do Aplicativo"

---

## Banco de Dados

```bash
# Criar o banco
createdb rastreamentowpp
# ou: psql -c "CREATE DATABASE rastreamentowpp;"

# Gerar migrations (apenas após alterar schema.ts)
npm run db:generate --workspace=backend

# Aplicar migrations
npm run db:migrate --workspace=backend

# Criar settings iniciais (gera verify_token automático)
npm run db:seed --workspace=backend
```

---

## Desenvolvimento

```bash
# Iniciar backend (:3001) e frontend (:5173) em paralelo
npm run dev

# Ou separadamente:
npm run dev --workspace=backend
npm run dev --workspace=frontend
```

Acesse: [http://localhost:5173](http://localhost:5173)

Login padrão: usuário e senha do `.env` (`ADMIN_USER` / `ADMIN_PASSWORD`)

---

## HTTPS para desenvolvimento (obrigatório para webhooks do Meta)

Os webhooks da Meta Cloud API **só funcionam com HTTPS**. Use o ngrok:

```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 3001
```

Copie a URL HTTPS gerada (ex: `https://abc123.ngrok-free.app`).

### Cadastrar webhook no Meta Business Manager

1. Acesse [developers.facebook.com](https://developers.facebook.com) → seu App
2. Vá em **WhatsApp > Configuração**
3. Em "Webhook", clique **"Editar"**
4. **Callback URL**: `https://abc123.ngrok-free.app/webhook/whatsapp`
5. **Verify Token**: Copie de **Configurações > Webhook WhatsApp** no painel
6. Clique **"Verificar e Salvar"**
7. Inscreva-se no campo **"messages"**

---

## Configuração dos Webhooks

### Meta Ads / CAPI
No painel: **Configurações > Meta Ads / CAPI**
- Access Token (token de acesso da Graph API com permissão `ads_management`)
- Pixel ID
- Page ID

### Evolution API
Webhook URL: `https://seu-dominio.com/webhook/evolution`

### Cloudia
Webhook URL: `https://seu-dominio.com/webhook/cloudia`

---

## Estrutura do Projeto

```
/
├── .env.example
├── package.json          ← npm workspaces root
├── frontend/             ← React + TypeScript + Tailwind
│   └── src/
│       ├── pages/        ← Dashboard, Leads, LeadDetail, Settings, Logs, Login
│       ├── components/   ← UI components e Layout
│       ├── hooks/        ← React Query hooks
│       ├── services/     ← API client (axios)
│       ├── types/        ← TypeScript types
│       └── utils/        ← format.ts (datas, telefone)
└── backend/              ← Express + TypeScript + Drizzle
    └── src/
        ├── db/           ← schema.ts, migrate.ts, seed.ts
        ├── parsers/      ← whatsapp-cloud, evolution, cloudia
        ├── services/     ← hash, meta-graph, meta-capi, lead, scheduler
        ├── routes/       ← auth, leads, settings, stats, logs, webhook
        └── middleware/   ← auth.ts, error.ts
```

---

## Build para produção

```bash
# Build backend
npm run build --workspace=backend

# Build frontend (gera dist/ estático)
npm run build --workspace=frontend

# Iniciar backend em produção
npm start --workspace=backend
```

---

## Funcionalidades

- **Rastreio de Leads**: Captura automática via webhooks WhatsApp (Cloud API e Evolution API)
- **Atribuição de Anúncios**: Identifica campanha, conjunto e anúncio via `ctwa_clid`
- **CAPI Meta**: Envia `LeadSubmitted` (lead novo) e `QualifiedLead` (ganho/qualificado) com dados hasheados (SHA256)
- **Retry Automático**: Scheduler a cada 5 minutos para reenvio de eventos CAPI falhos (máx. 3 tentativas)
- **Integração Cloudia**: Atualiza status via webhook quando lead é marcado como ganho
- **Dashboard**: KPIs, gráficos, top campanhas e anúncios
- **Chat histórico**: Visualização estilo WhatsApp com scroll infinito
- **Logs de Auditoria**: Todos os webhooks recebidos com payload completo
