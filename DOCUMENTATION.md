# AutoTrackr — Documentação Técnica

> Documentação de arquitetura, stack, módulos, API e setup do projeto AutoTrackr.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Estrutura do Monorepo](#2-estrutura-do-monorepo)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitetura do Sistema](#4-arquitetura-do-sistema)
5. [Backend — Módulos](#5-backend--módulos)
6. [Banco de Dados — Modelos Prisma](#6-banco-de-dados--modelos-prisma)
7. [Rotas da API](#7-rotas-da-api)
8. [Autenticação e Autorização](#8-autenticação-e-autorização)
9. [Shared Package](#9-shared-package)
10. [Estrutura de Diretórios](#10-estrutura-de-diretórios)
11. [Setup Local](#11-setup-local)
12. [Variáveis de Ambiente](#12-variáveis-de-ambiente)
13. [Deploy](#13-deploy)

---

## 1. Visão Geral

AutoTrackr é uma plataforma multiplataforma (Web + Mobile) para gestão completa de veículos. Permite registrar abastecimentos, manutenções, trajetos e receitas — com estatísticas, relatórios e lembretes automáticos.

**Público-alvo:** Motoristas de aplicativo, frota própria, autônomos e qualquer pessoa que queira controlar os custos do seu veículo.

**Planos:**

| Recurso | Gratuito (FREE) | Pro (PRO) |
|---------|:-:|:-:|
| Veículos | 1 | Ilimitado |
| Combustível / Manutenção / Trajetos / Receitas | Sim | Sim |
| Relatórios (visualização) | Sim | Sim |
| Exportar PDF/CSV | — | Sim |
| Lembretes por e-mail / WhatsApp | — | Sim |
| Anúncios | Sim | — |

---

## 2. Estrutura do Monorepo

O projeto usa **Yarn Workspaces**:

```
autotrackr/
├── backend/              NestJS + Prisma ORM + PostgreSQL
├── frontend/             Vite + React + Material UI (web)
├── mobile/               Expo + React Native (iOS / Android)
└── packages/
    └── shared/           Tipos, constantes, i18n e utils compartilhados
```

**Scripts raiz (package.json):**

```bash
npm run dev:backend       # Backend em modo watch (porta 3000)
npm run dev:frontend      # Frontend Vite dev server (porta 5173)
npm run dev:mobile        # Expo dev server
npm run db:up             # Sobe PostgreSQL via Docker
npm run db:down           # Para PostgreSQL
npm run db:migrate        # Executa migrations Prisma
npm run db:seed           # Popula dados iniciais
npm run db:studio         # Abre Prisma Studio na porta 5555
```

---

## 3. Stack Tecnológico

### Backend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| NestJS | 11 | Framework HTTP (controllers, services, guards) |
| Prisma ORM | 5.22 | Acesso ao banco, migrations, schema |
| PostgreSQL | 16 | Banco de dados relacional |
| Passport.js | — | Estratégias de autenticação (JWT, Local) |
| bcrypt | 6 | Hash de senhas |
| PDFKit | 0.15 | Geração de relatórios PDF |
| Nodemailer | 8 | Envio de e-mail (SMTP) |
| @nestjs/schedule | — | Jobs agendados (cron) para lembretes |
| @nestjs/throttler | — | Rate limiting (60 req/min global) |
| Helmet | — | Segurança de headers HTTP |
| class-validator | — | Validação de DTOs |
| Swagger/OpenAPI | — | Documentação interativa da API |

### Frontend Web

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 18.3 | Framework UI |
| Vite | 6.3 | Build tool e dev server |
| Material UI | 5.15 | Componentes e tema |
| MUI X DataGrid | 6.19 | Tabelas com paginação |
| React Router | 6.22 | Roteamento client-side |
| Axios | 1.8 | Cliente HTTP |
| Recharts | 3.8 | Gráficos (linhas, barras, pizza) |
| Leaflet | 1.9 | Mapa interativo (OpenStreetMap) |
| i18next | 26 | Internacionalização (PT/EN) |
| notistack | 3 | Snackbar notifications |

### Mobile

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Expo | 54 | Plataforma (builds, OTA updates) |
| React Native | 0.81 | Framework nativo |
| expo-router | 6 | Roteamento baseado em arquivos |
| @tanstack/react-query | 5 | Cache de dados + invalidação |
| NativeWind | 4.1 | Tailwind CSS para React Native |
| react-native-maps | 1.20 | Google Maps nativo |
| expo-location | 19 | Acesso à geolocalização |
| expo-secure-store | 15 | Armazenamento seguro de tokens |
| expo-notifications | 0.32 | Notificações locais agendadas |
| react-hook-form | 7.51 | Gerenciamento de formulários |
| i18next | 26 | Internacionalização (PT/EN) |

### Shared Package (`@autotrackr/shared`)

TypeScript puro — sem dependências de runtime. Exporta:
- Tipos e interfaces (UserProfile, Vehicle, FuelRecord, Trip, etc.)
- Constantes (FUEL_TYPES, REVENUE_CATEGORIES)
- Funções utilitárias (avgConsumption, estimateFuel)
- Traduções PT-BR e EN

---

## 4. Arquitetura do Sistema

```
┌─────────────────────┐    HTTP/JSON    ┌─────────────────────┐
│   Mobile (Expo)     │◄──────────────►│                     │
│   iOS / Android     │                │   Backend (NestJS)  │
└─────────────────────┘                │   localhost:3000    │
                                       │   /api/v1           │
┌─────────────────────┐    HTTP/JSON   │                     │
│  Frontend (React)   │◄──────────────►│                     │
│  localhost:5173     │                └──────────┬──────────┘
└─────────────────────┘                           │ Prisma ORM
                                                  ▼
                                       ┌─────────────────────┐
                                       │   PostgreSQL 16      │
                                       │   localhost:5432     │
                                       └─────────────────────┘
```

**Comunicação:**
- Todos os clientes usam **Axios** com `Authorization: Bearer <JWT>`
- Web: access token em memória (headers do Axios), refresh token em cookie `httpOnly`
- Mobile: access token + refresh token em `expo-secure-store` (encriptado)
- Refresh automático: interceptor 401 → `POST /auth/refresh` → novo access token

**Segurança:**
- Rate limiting global: 60 req/min por IP
- Helmet: HSTS, XSS protection, content-type sniffing
- CORS: dev = qualquer origem; prod = apenas `FRONTEND_URL`
- Validação de propriedade: toda operação verifica se o recurso pertence ao usuário logado (padrão `assertOwnership`)

---

## 5. Backend — Módulos

| Módulo | Responsabilidade | Rotas públicas |
|--------|-----------------|:-:|
| **Auth** | Sign-up, sign-in, sign-out, refresh token, reset de senha | Sim |
| **Users** | Perfil, plano, senha — usado internamente via AuthModule | — |
| **Vehicles** | CRUD de veículos; validação de limite por plano | — |
| **Fuel** | CRUD de abastecimentos; atualiza `vehicle.mileage` | — |
| **Maintenance** | Tipos de manutenção (global) + registros por veículo | — |
| **Revenue** | CRUD de receitas por veículo | — |
| **Trips** | CRUD de trajetos; atualiza `vehicle.mileage` via `$transaction` | — |
| **Reports** | Exportação PDF/CSV (requer plano PRO) | — |
| **Billing** | Assinaturas, checkout (MP/Stripe/PIX), cupons | Webhook |
| **Admin** | Estatísticas globais, gestão de usuários (roles/planos) | — |
| **AI** | Configuração de provedores IA para geração de textos de lembrete | — |
| **Reminders** | Cron diário (9h) — envia lembretes de manutenção (e-mail + WhatsApp) | — |
| **Mail** | Serviço SMTP (Nodemailer) — usado por Auth e Reminders | — |
| **Whatsapp** | Integração Evolution API — usado por Reminders | — |
| **Brands** | Catálogo de marcas de veículos (FIPE) | — |
| **Models** | Catálogo de modelos por marca | — |
| **Bootstrap** | Cria usuário admin na inicialização se não existir | — |

---

## 6. Banco de Dados — Modelos Prisma

**Provider:** PostgreSQL | **Schema:** `backend/prisma/schema.prisma`

### Enums

```
Role          USER | OPERADOR | ADMIN
Plan          FREE | PRO
FuelType      GASOLINA | GASOLINA_ADITIVADA | GASOLINA_PODIUM | ETANOL | DIESEL | GNV | ELETRICO
TripPurpose   WORK | PERSONAL | BUSINESS | OTHER
CouponType    PERCENT | FIXED
PaymentProvider  MERCADO_PAGO | STRIPE | PIX_DIRETO
SubscriptionStatus  PENDING | PAID | FAILED | CANCELED
AiProvider    ANTHROPIC | OPENAI | GEMINI | OLLAMA
ReminderChannel  EMAIL | WHATSAPP
```

### Modelos e Relacionamentos

```
User
 ├── id, email (unique), hashedPassword, name, phone
 ├── role (Role), plan (Plan), proSince
 ├── vehicles: Vehicle[]
 ├── refreshTokens: RefreshToken[]
 ├── subscriptions: Subscription[]
 └── reminderLogs: ReminderLog[]

RefreshToken
 └── id, token (unique), userId (FK→User), expiresAt

PasswordResetToken
 └── id, token (unique), email, expiresAt, usedAt

Brand
 ├── id, name (unique), apiCode
 ├── models: Model[]
 └── vehicles: Vehicle[]

Model
 ├── id, name, apiCode, brandId (FK→Brand)
 └── vehicles: Vehicle[]
    unique: (brandId, name)

Vehicle
 ├── id, plate (unique), year, mileage, color, vin, details
 ├── isFavorite, apiYearCode
 ├── userId (FK→User), brandId (FK→Brand), modelId (FK→Model)
 ├── fuelRecords: FuelRecord[]
 ├── maintenanceRecords: MaintenanceRecord[]
 ├── revenueRecords: RevenueRecord[]
 └── trips: Trip[]

FuelRecord
 └── vehicleId (FK→Vehicle), date, fuelType, mileage,
     quantity, pricePerUnit, totalCost (Decimal),
     fullTank, station, latitude, longitude, notes

MaintenanceType
 ├── id, name (unique), description
 ├── defaultIntervalKm, defaultIntervalMonths
 └── records: MaintenanceRecord[]

MaintenanceRecord
 └── vehicleId (FK→Vehicle), maintenanceTypeId (FK→MaintenanceType),
     date, mileage, cost, notes, location,
     reminderDate, reminderMileage, isCompleted

RevenueRecord
 └── vehicleId (FK→Vehicle), date, category, amount, notes

Trip
 └── vehicleId (FK→Vehicle), date, origin, destination,
     distanceKm, mileageStart, mileageEnd,
     durationMin, purpose (TripPurpose), passengers, notes

Coupon
 └── id, code (unique), type, value, maxRedemptions,
     timesRedeemed, expiresAt, active

PaymentGateway
 └── id, provider (unique), label, enabled, isDefault, config (JSON)

Subscription
 └── userId (FK→User), couponId (FK→Coupon, nullable),
     plan, status, provider, amount,
     externalId, checkoutUrl, pixPayload, paidAt

AiModelConfig
 └── id, provider, label, model, apiKey, baseUrl,
     systemPrompt, temperature, enabled, isDefault

IntegrationConfig
 └── id, key (unique), value (JSON), updatedAt

ReminderLog
 └── userId (FK→User), maintenanceRecordId (FK→MaintenanceRecord),
     channel, status, message, sentAt
```

---

## 7. Rotas da API

**Base:** `http://localhost:3000/api/v1`  
**Swagger:** `http://localhost:3000/api/docs`

Legenda: `[JWT]` = requer token | `[PRO]` = requer plano PRO | `[ADMIN]` = requer role ADMIN/OPERADOR

### Autenticação

```
POST   /auth/sign-up                    Cadastrar conta
POST   /auth/sign-in                    Login (retorna accessToken + refreshToken)
POST   /auth/sign-out                   Logout            [JWT]
POST   /auth/refresh                    Renovar tokens via refresh
POST   /auth/forgot-password            Enviar e-mail de redefinição
POST   /auth/reset-password             Redefinir senha com token do e-mail
GET    /auth/me                         Dados do usuário logado  [JWT]
PUT    /auth/me                         Atualizar nome / telefone  [JWT]
PUT    /auth/update-password            Alterar senha  [JWT]
```

### Veículos

```
GET    /vehicles                        Listar veículos do usuário  [JWT]
POST   /vehicles                        Criar veículo  [JWT]
GET    /vehicles/:id                    Detalhes do veículo  [JWT]
PUT    /vehicles/:id                    Atualizar veículo  [JWT]
DELETE /vehicles/:id                    Remover veículo  [JWT]
```

### Combustível

```
GET    /vehicles/:vehicleId/fuel                   Listar abastecimentos  [JWT]
POST   /vehicles/:vehicleId/fuel                   Registrar abastecimento  [JWT]
PUT    /vehicles/:vehicleId/fuel/:id               Atualizar abastecimento  [JWT]
DELETE /vehicles/:vehicleId/fuel/:id               Remover abastecimento  [JWT]
```

### Manutenção

```
GET    /maintenance/types                          Listar tipos de manutenção  [JWT]
POST   /maintenance/types                          Criar tipo de manutenção  [JWT]
GET    /vehicles/:vehicleId/maintenance            Listar registros  [JWT]
POST   /vehicles/:vehicleId/maintenance            Registrar manutenção  [JWT]
PUT    /vehicles/:vehicleId/maintenance/:id        Atualizar registro  [JWT]
DELETE /vehicles/:vehicleId/maintenance/:id        Remover registro  [JWT]
```

### Trajetos

```
GET    /vehicles/:vehicleId/trips                  Listar trajetos  [JWT]
POST   /vehicles/:vehicleId/trips                  Registrar trajeto  [JWT]
PUT    /vehicles/:vehicleId/trips/:id              Atualizar trajeto  [JWT]
DELETE /vehicles/:vehicleId/trips/:id              Remover trajeto  [JWT]
```

### Receitas

```
GET    /vehicles/:vehicleId/revenue                Listar receitas  [JWT]
POST   /vehicles/:vehicleId/revenue                Registrar receita  [JWT]
PUT    /vehicles/:vehicleId/revenue/:id            Atualizar receita  [JWT]
DELETE /vehicles/:vehicleId/revenue/:id            Remover receita  [JWT]
```

### Relatórios (PRO)

```
GET    /vehicles/:vehicleId/reports/maintenance?format=pdf|csv   Exportar manutenções  [JWT][PRO]
GET    /vehicles/:vehicleId/reports/revenue?format=pdf|csv       Exportar receitas  [JWT][PRO]
```

### Billing

```
GET    /billing/preview                            Prévia de preço (com cupom opcional)  [JWT]
POST   /billing/checkout                           Iniciar checkout PRO  [JWT]
POST   /billing/checkout/:id/confirm               Confirmar pagamento (webhook)  [JWT]
GET    /billing/subscriptions/me                   Minhas assinaturas  [JWT]
GET    /billing/coupons                            Listar cupons  [JWT][ADMIN]
POST   /billing/coupons                            Criar cupom  [JWT][ADMIN]
PUT    /billing/coupons/:id                        Atualizar cupom  [JWT][ADMIN]
DELETE /billing/coupons/:id                        Remover cupom  [JWT][ADMIN]
```

### Admin

```
GET    /admin/stats                                Estatísticas gerais  [JWT][ADMIN]
GET    /admin/users                                Listar usuários  [JWT][ADMIN]
PUT    /admin/users/:id/role                       Alterar role  [JWT][ADMIN]
PUT    /admin/users/:id/plan                       Alterar plano  [JWT][ADMIN]
```

### Modelos de IA (Admin)

```
GET    /ai/models                                  Listar modelos IA  [JWT][ADMIN]
POST   /ai/models                                  Criar modelo  [JWT][ADMIN]
PUT    /ai/models/:id                              Atualizar modelo  [JWT][ADMIN]
DELETE /ai/models/:id                              Remover modelo  [JWT][ADMIN]
POST   /ai/models/:id/test                         Testar modelo  [JWT][ADMIN]
```

### Lembretes (Admin)

```
GET    /reminders/config                           Configurações de lembretes  [JWT][ADMIN]
PUT    /reminders/config                           Atualizar configurações  [JWT][ADMIN]
PUT    /reminders/evolution                        Atualizar config WhatsApp  [JWT][ADMIN]
POST   /reminders/run-now                          Disparar varredura agora  [JWT][ADMIN]
```

---

## 8. Autenticação e Autorização

### Fluxo JWT

```
1. POST /auth/sign-in {email, password}
2. Backend valida senha (bcrypt), gera:
   - accessToken  (JWT, expira em 15min por padrão)
   - refreshToken (JWT, expira em 7d, salvo em RefreshToken table)
3. Resposta: { accessToken, refreshToken, user }
   - Web: refresh token em cookie httpOnly path=/api/v1/auth/refresh
   - Mobile: ambos os tokens retornados no body
4. Cliente armazena:
   - Web: accessToken nos headers do Axios; refreshToken via cookie automático
   - Mobile: ambos via expo-secure-store
5. Quando accessToken expira → interceptor Axios faz POST /auth/refresh
6. Backend valida refresh token, gera novo par, invalida o antigo
```

### Guards e Decoradores

```typescript
@JwtAuthGuard()         // requer JWT válido (qualquer usuário)
@Roles(Role.ADMIN)      // requer role ADMIN ou OPERADOR
@RequiresPro()          // requer plan === PRO (ou role ADMIN/OPERADOR)

@CurrentUser()          // injeta o payload JWT no parâmetro do método
```

### Payload do JWT

```typescript
{
  sub: string;        // user.id
  email: string;
  role: 'USER' | 'OPERADOR' | 'ADMIN';
  plan: 'FREE' | 'PRO';
}
```

### Detecção de PRO (client-side)

```typescript
isPro = user?.plan === 'PRO' || user?.role === 'ADMIN' || user?.role === 'OPERADOR'
```

### Padrão `assertOwnership`

Todos os services verificam se o recurso pertence ao usuário logado antes de qualquer operação:

```typescript
async assertOwnership(vehicleId: string, userId: string) {
  const vehicle = await this.prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
  });
  if (!vehicle) throw new NotFoundException();
  return vehicle;
}
```

---

## 9. Shared Package

**Localização:** `packages/shared/src/`  
**Nome npm:** `@autotrackr/shared`

### Tipos exportados (`types/index.ts`)

```typescript
// Auth
UserProfile          // id, email, name, phone, role, plan, proSince
AuthResponse         // accessToken, refreshToken, user
MobileRefreshResponse

// Veículos
Vehicle              // id, plate, year, mileage, color, vin, brand, model
CreateVehiclePayload

// Combustível
FuelType             // enum
FuelRecord           // vehicleId, date, fuelType, mileage, quantity, pricePerUnit, totalCost, fullTank, station, latitude, longitude, notes
CreateFuelPayload

// Manutenção
MaintenanceType      // name, description, defaultIntervalKm, defaultIntervalMonths
MaintenanceRecord    // vehicleId, maintenanceTypeId, date, mileage, cost, notes, location, reminderDate, reminderMileage, isCompleted
CreateMaintenancePayload

// Trajetos
TripPurpose          // enum: WORK | PERSONAL | BUSINESS | OTHER
Trip                 // vehicleId, date, origin, destination, distanceKm, mileageStart, mileageEnd, durationMin, purpose, passengers, notes
CreateTripPayload

// Receitas
RevenueRecord        // vehicleId, date, category, amount, notes
CreateRevenuePayload
```

### Constantes (`constants/index.ts`)

```typescript
FUEL_TYPES           // Array<{ key: FuelType, label, unit, consumptionLabel }>
REVENUE_CATEGORIES   // string[] — categorias de receita disponíveis
```

### Utilitários (`utils/consumption.ts`)

```typescript
avgConsumption(records: FuelRecord[])
// → { value: number, label: string } | null
// Calcula consumo médio (km/L) entre abastecimentos de tanque cheio

estimateFuel(newQuantity: number, currentMileage: number, prevRecords: FuelRecord[])
// → { days: number, nextMileage: number } | null
// Estima duração em dias e próxima quilometragem de abastecimento
```

### i18n (`i18n/pt.ts`, `i18n/en.ts`)

Namespaces disponíveis:

| Namespace | Conteúdo |
|-----------|----------|
| `common` | save, cancel, edit, delete, loading, actions, date, notes... |
| `nav` | dashboard, maintenance, fuel, trips, revenue, reports, profile |
| `plan` | free, pro, upgrade, limitReached, export, ad labels |
| `auth` | signIn, signUp, email, password, forgotPassword... |
| `dashboard` | welcome, addVehicle, pendingMaintenance, alerts... |
| `fuel` | title, add, types.GASOLINA, estimatedDays, nextRefuelKm... |
| `maintenance` | title, add, type, mileage, reminderDate... |
| `trips` | title, add, origin, destination, purposes.PERSONAL... |
| `revenue` | title, add, category, amount... |
| `reports` | tabs, periods, totalExpense, avgConsumption... |
| `profile` | name, email, phone, changePassword, theme, language... |

---

## 10. Estrutura de Diretórios

```
backend/src/
├── admin/
├── ai/
├── auth/
│   ├── decorators/
│   ├── dto/
│   ├── guards/
│   └── strategies/        jwt.strategy.ts, jwt-refresh.strategy.ts
├── billing/
│   ├── checkout/
│   ├── coupons/
│   └── gateways/
├── bootstrap/
├── brands/
├── fuel/
├── integrations/
├── mail/
├── maintenance/
├── models/
├── prisma/
├── reminders/
├── reports/
├── revenue/
├── trips/
├── users/
├── vehicles/
├── whatsapp/
├── app.module.ts
└── main.ts

frontend/src/
├── api/                   auth.api.ts, vehicles.api.ts, fuel.api.ts...
├── components/            AdBanner, StatCard, StationMapPicker...
├── contexts/              AuthContext, ThemeContext, SnackbarContext
├── layouts/               AuthLayout, ProtectedLayout, AdminLayout
├── pages/
│   ├── admin/             AdminDashboard, UsersManager, BrandsManager...
│   ├── Dashboard.tsx
│   ├── FuelTracking.tsx
│   ├── Maintenance.tsx
│   ├── Trips.tsx
│   ├── Revenue.tsx
│   ├── Reports.tsx
│   ├── Profile.tsx
│   ├── UpgradePro.tsx
│   ├── Login.tsx
│   └── Register.tsx
└── App.tsx

mobile/
├── app/
│   ├── (auth)/            login.tsx, register.tsx
│   └── (tabs)/
│       ├── index.tsx      Dashboard
│       ├── fuel/index.tsx
│       ├── maintenance/index.tsx
│       ├── trips/index.tsx
│       ├── profile/       index, language, theme, upgrade
│       └── _layout.tsx    Tab navigator (5 tabs)
├── components/
│   ├── FormSheet.tsx      Bottom sheet para formulários
│   ├── LocationPicker.tsx Mapa Google Maps + geocoding
│   ├── FuelForm.tsx
│   ├── MaintenanceForm.tsx
│   ├── TripForm.tsx
│   ├── RevenueForm.tsx
│   ├── AdBanner.tsx
│   └── AdInterstitial.tsx
├── contexts/              AuthContext, ThemeContext, VehicleContext
├── hooks/                 useAdInterstitial
└── lib/                   api.ts (Axios + interceptors), queryClient.ts

packages/shared/src/
├── types/index.ts
├── constants/index.ts
├── utils/consumption.ts
└── i18n/
    ├── pt.ts
    └── en.ts
```

---

## 11. Setup Local

### Pré-requisitos

- Node.js 20+
- Yarn (`npm install -g yarn`)
- Docker + Docker Compose
- (Mobile) Android Studio ou Xcode + Expo CLI

### Passo a passo

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd autotrackr

# 2. Instale dependências de todos os workspaces
yarn install

# 3. Configure o backend
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações (ver seção 12)

# 4. Suba o banco de dados (Docker)
npm run db:up

# 5. Execute as migrations e seed inicial
npm run db:migrate
npm run db:seed

# 6. Inicie os serviços
npm run dev:backend    # Terminal 1 — API na porta 3000
npm run dev:frontend   # Terminal 2 — Web na porta 5173
npm run dev:mobile     # Terminal 3 — Expo (QR code para app)
```

### Banco de dados local (Docker)

```
Container: autotrackr_db
Porta:     5432
Usuário:   autotrackr
Senha:     localdev
Database:  autotrackr

pgAdmin:   http://localhost:5050
           Login: admin@autotrackr.local / admin
```

### Verificar instalação

```bash
# API funcionando:
curl http://localhost:3000/api/v1/auth/me

# Swagger disponível:
open http://localhost:3000/api/docs

# Frontend:
open http://localhost:5173
```

---

## 12. Variáveis de Ambiente

Arquivo: `backend/.env`

| Variável | Descrição | Obrigatório |
|----------|-----------|:-:|
| `DATABASE_URL` | Connection string PostgreSQL | Sim |
| `JWT_SECRET` | Segredo do access token (mín. 32 chars) | Sim |
| `JWT_EXPIRES_IN` | Expiração do access token (padrão: `15m`) | Não |
| `REFRESH_TOKEN_EXPIRES_IN` | Expiração do refresh token (padrão: `7d`) | Não |
| `FRONTEND_URL` | URL do frontend para CORS em produção | Sim |
| `PORT` | Porta do servidor (padrão: `3000`) | Não |
| `ADMIN_EMAIL` | E-mail do admin criado no bootstrap | Sim |
| `ADMIN_PASSWORD` | Senha do admin do bootstrap | Sim |
| `ADMIN_NAME` | Nome do admin do bootstrap | Não |
| `SMTP_HOST` | Host SMTP para envio de e-mail | Para lembretes |
| `SMTP_PORT` | Porta SMTP (padrão: `587`) | Para lembretes |
| `SMTP_USER` | Usuário SMTP | Para lembretes |
| `SMTP_PASS` | Senha SMTP | Para lembretes |
| `SMTP_FROM` | Remetente dos e-mails | Para lembretes |

**Integrações opcionais** (configuráveis via painel admin após inicializar):
- Evolution API (WhatsApp): URL, instância, API key
- Mercado Pago, Stripe, PIX: tokens e chaves armazenados em `PaymentGateway.config`
- IA (Anthropic, OpenAI, Gemini, Ollama): API keys em `AiModelConfig`

**Exemplo de `.env` para desenvolvimento:**

```env
DATABASE_URL="postgresql://autotrackr:localdev@localhost:5432/autotrackr"
JWT_SECRET="dev-secret-substitua-em-producao-minimo-32-chars"
FRONTEND_URL="http://localhost:5173"
PORT=3000
ADMIN_EMAIL="admin@autotrackr.local"
ADMIN_PASSWORD="Admin@123456"
ADMIN_NAME="Administrador"
```

---

## 13. Deploy

### Backend

**Opção recomendada: Railway / Render / VPS**

```bash
# Build
cd backend
npm run build

# Start produção
npm run start:prod
# ou: node dist/main.js
```

Variáveis de ambiente necessárias em produção: todas as marcadas como "Sim" na seção 12, mais `NODE_ENV=production`.

### Frontend Web

**Opção recomendada: Vercel / Netlify / Nginx**

```bash
cd frontend
npm run build
# Saída em: frontend/dist/

# Vercel (automático via git push)
# Nginx: servir dist/ como static files com fallback para index.html
```

Variável necessária na build: `VITE_API_URL=https://api.seudominio.com`

### Mobile

**Distribuição via Expo EAS Build:**

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login na conta Expo
eas login

# Build para Android (APK/AAB)
eas build --platform android

# Build para iOS
eas build --platform ios

# OTA update (sem passar pelas lojas)
eas update --branch production
```

**Identificadores do app:**
- Bundle ID / Package: `com.labapp.autotrackr`
- Nome: `AutoTrackr`
- Versão: `1.0.0`

Variável necessária: `EXPO_PUBLIC_API_URL=https://api.seudominio.com` em `mobile/.env`
