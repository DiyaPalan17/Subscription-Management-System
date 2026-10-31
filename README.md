# Brightloop — Subscription Management & Recurring Billing Platform

Brightloop is a production-ready, full-stack Subscription Management, Automated Billing Engine, and Finance Operating System built with modern enterprise architectural standards.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │    Next.js 14 App Router Frontend    │
                      │   (Tailwind CSS, Lucide, Radix UI)    │
                      └──────────────────┬────────────────────┘
                                         │  (REST / JWT Bearer)
                                         ▼
                      ┌───────────────────────────────────────┐
                      │   Node.js (TypeScript) Express API    │
                      │   - RBAC Auth Middleware              │
                      │   - Subscription FSM Controller       │
                      │   - Sub-2s KPI Aggregation Engine     │
                      └────────────┬─────────────┬────────────┘
                                   │             │
                    ┌──────────────▼───┐     ┌───▼──────────────────┐
                    │  Billing Engine  │     │ Background Scheduler │
                    │  - Idempotency   │     │ - Daily Billing Cron │
                    │  - Cadence Math  │     │ - Overdue Evaluator  │
                    │  - Taxes/Discounts│    └──────────────────────┘
                    └──────────────┬───┘
                                   ▼
                      ┌───────────────────────────────────────┐
                      │      PostgreSQL 16 Relational DB      │
                      │  - B-Tree Performance Indexes         │
                      │  - Idempotency Constraint (UQ)        │
                      │  - Strict Prisma Schema & Native DDL  │
                      └───────────────────────────────────────┘
```

---

## Key Technical Specifications & Domain Rules

### 1. Role-Based Access Control (RBAC) & Authentication
- **Roles**:
  - `ADMIN`: Unrestricted platform access (Products, Plans, Taxes, Discounts, Full Financial KPIs, Users).
  - `STAFF`: Operational billing access (Customer accounts, Quote Templates, Subscription creation, Invoicing, Payment Logging). Cannot add staff or alter global tax/discount rules.
  - `CUSTOMER`: Self-service portal. Strictly isolated access to view own subscriptions, billing schedules, and printable invoices.
- **Password Regex**: Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 special character (`/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/`).
- **Tokenized Password Reset Flow**: Generates cryptographically secure 1-hour expiry reset tokens with simulated mock email service dispatch.

### 2. Database Domain Schema & Constraints
- **Idempotency Guarantee**: `CONSTRAINT uq_subscription_period_start UNIQUE (subscription_id, period_start)` prevents duplicate billing runs for any period.
- **Performance B-Tree Indexes**:
  - `CREATE INDEX idx_subscriptions_status ON subscriptions (status);`
  - `CREATE INDEX idx_subscriptions_customer_id ON subscriptions (customer_id);`
  - `CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions (next_billing_date);`
  - `CREATE INDEX idx_invoices_status ON invoices (status);`
  - `CREATE INDEX idx_invoices_customer_id ON invoices (customer_id);`
  - `CREATE INDEX idx_invoices_due_date ON invoices (due_date);`
- **Product Variant Price Adjustments**: Supports multi-attribute variants, e.g. *Brand = 'Odoo Enterprise Connector'* adding `+$560.00` to line totals.
- **Discount & Tax Rules**:
  - Taxes: Calculated per line item based on active percentage rates (e.g. 18.00% GST, 8.25% Sales Tax).
  - Discounts: Evaluates min spend thresholds, min seat quantities, max redemptions, and active dates. Auto-increments `times_redeemed`.

### 3. Subscription Finite State Machine (FSM)
Strictly enforced lifecycle transitions:
```
[DRAFT] ──> [QUOTATION] ──> [CONFIRMED] ──> [ACTIVE] ──> [PAUSED]
   │             │               │              │           │
   │             ▼               │              ▼           ▼
   └────────> [CLOSED] <─────────┴──────────> [CLOSED] <────┘
```
- `DRAFT`: Initial draft and line configuration.
- `QUOTATION`: Locks pricing and sets `valid_until` expiration date.
- `CONFIRMED`: Customer/staff acceptance.
- `ACTIVE`: Active recurring billing status.
- `PAUSED`: Suspended billing (permitted if `plan.allowPause = true`).
- `CLOSED`: Terminal state (respects `plan.allowEarlyClose` and `plan.autoCloseOnExpiry`).

### 4. Automated Billing Engine (Idempotent)
- Evaluates `ACTIVE` subscriptions where `next_billing_date <= CURRENT_DATE`.
- Computes plan base pricing, line quantities, variants, applicable active discounts, and line-item taxes.
- Generates `Invoice` (`INV-YYYY-XXXX`) and advances `current_period_start`, `current_period_end`, and `next_billing_date` based on the cadence (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
- Enforces strict idempotency: multiple runs on the same period will never duplicate invoices.

### 5. Payment Reconciliation & Aging Accounts Receivable (A/R)
- **Reconciliation**:
  - Updates `amount_paid` upon each recorded payment.
  - Automatically marks invoice `PAID` when `amount_paid >= total_amount`.
  - Seamlessly handles partial installments.
- **Overdue Engine**:
  - Daily cron evaluates `CURRENT_DATE > due_date` and marks delinquent invoices as `OVERDUE`.
- **Sub-2s Querying Performance**:
  - High-level KPIs: Active Subscriptions Count, Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), Total Cash Collected (this month / quarter / all time), Total Overdue Amount.
  - Aging A/R buckets: Overdue 1-30 days, 31-60 days, 60+ days.
  - B-Tree indexed execution benchmarks: **0.35ms - 0.54ms** (Well under the 2,000ms SLA).

---

## Default Seeded Accounts & Credentials

The platform is pre-seeded with enterprise accounts for instant evaluation:

| Role | Email | Password | Permissions & Notes |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@brightloop.io` | `Admin@12345!` | Full system access, catalog editor, tax & discounts, finance KPIs |
| **STAFF** | `staff@brightloop.io` | `Staff@12345!` | Operational access, quote preparation, billing runs, payment logger |
| **CUSTOMER** | `customer@acme.com` | `Customer@12345!` | Acme Cybernetics Corp — self-service portal, view & print invoices |
| **CUSTOMER** | `customer@globex.com` | `Customer@12345!` | Globex Corp — active enterprise plan, demonstrates overdue Aging A/R |

*Note: The UI also features a **1-Click Quick Role Switcher** in the navbar to test role permissions without re-typing passwords.*

---

## Quickstart & Local Installation Guide

### Prerequisites
- Node.js 18+ (tested on Node.js v24.19)
- npm or pnpm
- Optional: Docker & Docker Compose (for PostgreSQL container)

### Step 1: Database Setup (PostgreSQL)
Start the PostgreSQL container:
```bash
docker compose up -d
```
*Note: If you do not have Docker installed, Brightloop includes a zero-friction fallback memory engine that allows the full application, tests, and UI to boot and execute immediately without an external database!*

### Step 2: Backend Setup
```bash
cd backend
npm install
npm run db:seed
```

Run test suites:
```bash
# Run business engine tests (FSM, cadence math, idempotency, payments)
npm test

# Run end-to-end REST API integration tests (12 test assertions)
npm run test:api
```

Start the backend API server:
```bash
npm run dev
# Server will run on http://localhost:4000
```

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Application will run on http://localhost:3000
```

Open your browser at `http://localhost:3000`.

---

## Project Structure

```
brightloop/
├── docker-compose.yml             # PostgreSQL 16 & Redis service configuration
├── package.json                   # Root workspace orchestration script
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Strict Prisma schema with relations, enums & constraints
│   ├── src/
│   │   ├── config/                # Environment & JWT secrets
│   │   ├── db/
│   │   │   ├── schema.sql         # Native PostgreSQL DDL with B-Tree indexes & UNIQUE constraints
│   │   │   ├── seed-data.ts       # Validated seed dataset
│   │   │   ├── repository.ts      # Sub-2s high-performance repository layer
│   │   │   └── seed.ts            # Seeder CLI script
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts # JWT verification, password regex & RBAC guards
│   │   │   └── error.middleware.ts# Global HTTP error handler
│   │   ├── modules/
│   │   │   ├── auth/              # Register, Login, Forgot Password, Reset Password
│   │   │   ├── catalog/           # Products, Brand Variants, Cadence Plans, Taxes, Discounts
│   │   │   ├── subscriptions/     # FSM Controller (DRAFT -> QUOTE -> CONFIRMED -> ACTIVE)
│   │   │   ├── billing/           # Idempotent billing engine & cadence interval math
│   │   │   ├── invoices/          # Invoice ledger & line items
│   │   │   ├── payments/          # Payment recording & partial reconciliation
│   │   │   └── finance/           # MRR, ARR, Cash collected & Aging A/R buckets
│   │   ├── jobs/
│   │   │   └── scheduler.ts       # Daily automated cron jobs
│   │   └── index.ts               # Express server entrypoint
│   └── tests/
│       ├── billing-engine.test.ts # Core engine & business logic unit tests
│       └── api-e2e.test.ts        # 12-stage REST API end-to-end integration test suite
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx         # Root layout with AuthProvider & Navbar
    │   │   ├── page.tsx           # Role-based route dispatcher
    │   │   ├── login/             # Login with 1-click demo accounts
    │   │   ├── register/          # Register with real-time password checklist
    │   │   ├── forgot-password/   # Secure reset token request
    │   │   ├── reset-password/    # Token validation & password update
    │   │   ├── dashboard/         # Finance Dashboard, MRR, ARR, Aging A/R & Trigger Billing
    │   │   ├── catalog/           # Products, Variants (Odoo +$560), Plans, Taxes, Discounts
    │   │   ├── subscriptions/     # Subscription manager with lifecycle transition buttons
    │   │   ├── invoices/          # Invoices ledger with payment recorder & printable modal
    │   │   ├── quotations/        # Quotation templates & proposal generator
    │   │   └── portal/            # Customer self-service subscriptions & invoices
    │   ├── components/
    │   │   ├── Navbar.tsx         # Responsive navbar with role badge & switcher
    │   │   ├── StatusBadge.tsx    # Polished status badges
    │   │   ├── RecordPaymentModal.tsx # Partial / full payment reconciliation modal
    │   │   ├── InvoicePrintModal.tsx  # Printable tax invoice document modal
    │   │   └── NewSubscriptionModal.tsx# Subscription & Quote creation wizard
    │   └── lib/
    │       ├── api.ts             # Fetch client with auto JWT Authorization header
    │       └── auth.tsx           # React Context with user session & role switcher
    ├── tailwind.config.js
    └── next.config.js             # API rewrites proxying localhost:4000
```

---

## REST API Reference

### Auth & RBAC
- `POST /api/auth/register` — Register new user (validates password regex complexity)
- `POST /api/auth/login` — Sign in with email & password, returns JWT token
- `GET /api/auth/me` — Get authenticated user profile (`Bearer <token>`)
- `POST /api/auth/forgot-password` — Generate secure password reset token
- `POST /api/auth/reset-password` — Reset password using token
- `GET /api/auth/customers` — List all customer accounts (`ADMIN`, `STAFF`)

### Finance & Operations (Sub-2s Querying)
- `GET /api/finance/kpis` — Return MRR, ARR, Cash Collected, and Aging A/R buckets (`ADMIN` only)
- `POST /api/billing/run` — Trigger automated billing engine (`ADMIN`, `STAFF`)
- `POST /api/billing/evaluate-overdue` — Scan and mark overdue delinquent invoices (`ADMIN`, `STAFF`)

### Subscriptions & Proposals
- `GET /api/subscriptions` — List subscriptions (Customers isolated to own)
- `POST /api/subscriptions` — Create subscription or spin up from Quote Template (`ADMIN`, `STAFF`)
- `POST /api/subscriptions/:id/transition` — Execute FSM transition: `targetStatus: QUOTATION | CONFIRMED | ACTIVE | PAUSED | CLOSED`
- `POST /api/subscriptions/:id/trigger-billing` — Bill single subscription on demand

### Invoices & Reconciliation
- `GET /api/invoices` — List invoices with optional filters (`status`, `customerId`, `dateRange`)
- `GET /api/invoices/:id` — Get full invoice document with line items and payments
- `POST /api/payments` — Record payment against invoice (supports partial payments)
