# SmartStock AI

> **O estoque inteligente que ajuda supermercados a vender mais, comprar melhor e desperdiçar menos.**

MVP para o Hack Brasil 2026 - Sistema de gestão inteligente de estoque para supermercados.

## 🚀 Funcionalidades

- **Dashboard Executivo**: KPIs, gráficos de vendas, risco e categorias
- **Importação CSV**: Produtos, Estoque, Lotes, Vendas com validação
- **Produtos & Estoque**: Busca, filtros, detalhes com lotes e vendas recentes
- **Inteligência de Vencimentos**: Análise FEFO, dias restantes, exposição financeira
- **Reposição Inteligente**: Ponto de reposição, sugestões de compra, lead time
- **Central de Alertas**: Vencimento, ruptura, perda, demanda - com severidade
- **Stock Assistant**: IA generativa para perguntas em linguagem natural

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Recharts |
| Backend | Python 3.13 + FastAPI + SQLAlchemy + Pandas + Pydantic |
| Banco | SQLite (MVP) / PostgreSQL (produção) |
| IA | OpenAI API com provider abstraction + fallback determinístico |
| Deploy | Docker + Docker Compose |

## 📦 Estrutura do Projeto

```
smartstock-ai/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/       # UI components (Button, Card, Table, etc.)
│   │   ├── pages/            # Route pages (Dashboard, Products, etc.)
│   │   ├── hooks/            # Custom React hooks (useFetch, useChat, etc.)
│   │   ├── services/         # API client (axios)
│   │   ├── types/            # TypeScript types
│   │   └── layouts/          # Layout components
│   └── package.json
├── backend/                  # FastAPI + Python
│   ├── app/
│   │   ├── api/routes/       # REST endpoints
│   │   ├── core/             # Config, database, security
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── engines/          # Calculation engines
│   │   │   ├── expiration.py    # FEFO, expiration risk
│   │   │   ├── replenishment.py # Reorder point, suggestions
│   │   │   ├── demand.py        # Moving averages
│   │   │   └── risk.py          # Financial exposure
│   │   ├── ai/               # AI provider abstraction
│   │   │   ├── assistant.py     # Stock Assistant orchestrator
│   │   │   ├── provider.py      # OpenAI + Fallback providers
│   │   │   ├── context.py       # Context building
│   │   │   └── prompts.py       # System prompts
│   │   └── main.py           # FastAPI app
│   ├── tests/                # pytest tests
│   └── requirements.txt
├── data/demo/                # Demo CSV files
├── docker-compose.yml
├── .env.example
└── PROJECT_STATUS.md
```

## 🚀 Quick Start

### Pré-requisitos
- Docker + Docker Compose
- Git

### Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/alexandrediamante/smartstock-ai.git
cd smartstock-ai

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env se necessário

# Suba os containers
docker compose up -d --build

# Acesse:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Backend Standalone

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Standalone

```bash
cd frontend
npm install
npm run dev
```

## 📊 Demo Data

O projeto inclui dados de demonstração em `data/demo/`:
- `produtos.csv` - 30 produtos de 6 categorias
- `estoque.csv` - Quantidades e mínimos
- `lotes.csv` - Lotes com datas de validade variadas
- `vendas.csv` - 30 dias de histórico de vendas

Use a página **Importação** para carregar os CSVs ou importe via API.

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```bash
# App
APP_ENV=development
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8000

# Database
DATABASE_URL=sqlite:///./data/smartstock.db

# OpenAI (opcional - fallback funciona sem)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=30

# CORS
CORS_ORIGINS=http://localhost:5173,http://smartstock.adsystem.dev.br

# Alert thresholds
ALERT_EXPIRATION_CRITICAL_DAYS=3
ALERT_EXPIRATION_WARNING_DAYS=7
ALERT_FINANCIAL_EXPOSURE_CRITICAL=10000
ALERT_FINANCIAL_EXPOSURE_WARNING=5000

# Replenishment defaults
DEFAULT_LEAD_TIME_DAYS=7
DEFAULT_SAFETY_STOCK_DAYS=3
```

## 🧪 Testes

```bash
# Backend tests
cd backend
pytest                    # Todos os testes
pytest -v                 # Verbose
pytest tests/test_expiration.py  # Testes específicos
pytest --cov=app          # Com coverage

# Frontend tests
cd frontend
npm run test
```

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/imports` | Upload CSV |
| GET | `/api/imports` | Histórico importações |
| GET | `/api/dashboard` | KPIs e gráficos |
| GET | `/api/products` | Listar produtos |
| GET | `/api/products/{id}` | Detalhe produto |
| GET | `/api/stock/critical` | Estoque crítico |
| GET | `/api/expiration/risks` | Riscos de vencimento |
| GET | `/api/replenishment` | Sugestões de compra |
| GET | `/api/alerts` | Central de alertas |
| POST | `/api/ai/chat` | Stock Assistant |
| GET | `/api/analytics/losses` | Exposição financeira |

Documentação interativa: `http://localhost:8000/docs`

## 🤖 Stock Assistant

O assistente responde perguntas como:
- "Quais produtos podem vencer esta semana?"
- "O que preciso comprar hoje?"
- "Quanto temos em mercadorias sob risco?"
- "Quais ações podem reduzir as perdas?"
- "Por que este produto foi classificado como crítico?"

**Regras de segurança:**
- IA não acessa banco diretamente
- IA não calcula valores financeiros
- Todos os cálculos feitos no backend
- Fallback determinístico sem chave OpenAI
- Timeout e rate limit tratados

## 🚢 Deploy na VPS

### Pré-requisitos VPS
- Ubuntu Server
- Docker + Docker Compose
- Nginx configurado como reverse proxy
- Domínio/subdomínio apontando para a VPS

### Deploy

```bash
# Na VPS
git clone https://github.com/alexandrediamante/smartstock-ai.git
cd smartstock-ai
cp .env.example .env
# Edite .env com configurações de produção

docker compose up -d --build

# Configure Nginx para proxy_pass para localhost:5173 (frontend) e localhost:8000 (backend)
# Configure SSL com Let's Encrypt se domínio disponível
```

### Subdomínio sugerido
`smartstock.adsystem.dev.br` (configurar no Nginx da VPS)

## 📋 Regras de Negócio

### FEFO (First Expired, First Out)
Lotes ordenados por data de validade. Demanda projetada consumida primeiro do lote que vence primeiro.

### Risco de Vencimento
```
Vendas Esperadas = Venda Diária × Dias Restantes
Excedente = max(0, Quantidade Lote - Vendas Esperadas)
Exposição = Excedente × Custo Unitário
```

### Ponto de Reposição
```
PR = (Venda Diária × Lead Time) + Estoque Segurança
Compra Sugerida = max(0, Estoque Desejado - Estoque Projetado)
```

### Severidade dos Alertas
- **Crítico**: ≤3 dias validade OU exposição ≥R$10.000 OU estoque projetado ≤0
- **Atenção**: ≤7 dias validade OU exposição ≥R$5.000 OU estoque projetado ≤segurança
- **Normal**: Demais casos

## 📝 Licença

MIT License - veja [LICENSE](LICENSE)

## 👥 Hack Brasil 2026

Projeto desenvolvido para o Hack Brasil 2026.
- Repositório: https://github.com/alexandrediamante/smartstock-ai
- Demo: http://smartstock.adsystem.dev.br (se configurado)

---

**SmartStock AI** - Transformando gestão de estoque reativa em preventiva 📈