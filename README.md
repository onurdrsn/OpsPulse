# OpsPulse — Autonomous Incident & Workflow Automation Platform

> **Live Production URL:** [https://opspulse.pages.dev](https://opspulse.pages.dev)  
> **API Worker Gateway:** [https://opspulse-api.workers.dev](https://opspulse-api.workers.dev)  
> **Source Repository:** [https://github.com/onurdrsn/opspulse](https://github.com/onurdrsn/opspulse)  
> **Submission Git Commit SHA:** `7e4f1a9c3d2e8b0a1f5d6c7b9e0a4f2d8c1b3a5e`

---

## 1. Executive Summary & Problem Scope

Modern distributed architectures (Kubernetes, microservices, Kafka/RabbitMQ queue topographies) generate telemetry volumes that overwhelm engineering response teams. Traditional alerting pipelines often lead to cascading incident alerts, alert fatigue, and delayed root-cause isolation.

**OpsPulse** is a specialized B2B technology service providing autonomous incident triage, queue bottleneck isolation, and distributed task automation workflows. This project delivers a responsive landing page combined with an edge-deployed, persistent inquiry intake pipeline engineered to guarantee:
- Resilient client- and server-side data validation.
- Zero-loss persistent storage across serverless database transactions.
- WAI-ARIA compliant accessibility and client status feedback.
- Edge-native execution with sub-second execution overhead.

---

## 2. Architecture & Tech Stack

The system is architected as an optimized monorepo managed via `npm workspaces` and automated via a root `Makefile`:

```text
opspulse/
├── apps/
│   ├── web/               # Cloudflare Pages: React 18, Vite, Tailwind CSS v4, Lucide Icons
│   └── worker/            # Cloudflare Workers: Hono, Drizzle ORM, Zod, @neondatabase/serverless
├── Makefile               # Unified lifecycle automation interface
├── package.json           # Workspace configurations
├── README.md              # Architectural & operational specification
└── AI_LOG.md              # Engineering decision log & AI audit trail
```

### Technology Matrix & Architectural Rationale

| Layer | Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Minimal bundle footprint, fast hydration, deterministic build steps. |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Native CSS-first engine, zero legacy PostCSS/config latency, strict design token encapsulation. |
| **Backend Runtime** | Cloudflare Workers (`workerd`) | Global edge distribution, zero cold-starts, isolated V8 execution context. |
| **API Framework** | Hono | Ultra-lightweight edge router (<15kB) with standard Web Fetch APIs and strict TypeScript ergonomics. |
| **Data Layer & ORM** | Drizzle ORM + Drizzle Kit | Zero runtime reflection overhead, direct SQL mapping, automated migration pipelines. |
| **Database** | Neon Serverless PostgreSQL | Distributed relational storage via serverless WebSocket/HTTP drivers with connection pooling. |
| **Validation** | Zod | Single source of truth for runtime type validation across boundary boundaries. |

---

## 3. Data Flow & Security Implementation

```
[User Browser]
       │
       ▼ (WAI-ARIA Form Client Validation)
[Vite Frontend / Cloudflare Pages]
       │
       ▼ HTTPS POST /api/leads (JSON Payload + Invisible Honeypot)
[Cloudflare Edge Worker / Hono Router]
       │
       ├──► [Honeypot Inspection] ──── (Bot Detected) ────► 201 Simulated Response
       │
       ├──► [Zod Strict Schema Validation]
       │         │
       │         └──► (Invalid) ────► 400 Bad Request (Field-level error map)
       │
       ▼ (Valid Payload)
[Drizzle ORM Engine]
       │
       ▼ Secure Parameterized SQL over HTTP/WebSocket
[Neon Serverless Postgres] ────► INSERT INTO leads ... RETURNING id
       │
       ▼ (Database Transaction Confirmed)
[HTTP 201 Created Response]
       │
       ▼
[UI Renders Persistent Record ID & Success Banner]
```

### Key Security & Defensive Features
1. **Defensive Bot Mitigation (Honeypot):** A hidden, non-tabbable input field (`website`) traps automated submission crawlers. If populated, the pipeline immediately short-circuits without touching database connections.
2. **Parameterized Queries:** SQL injection vectors are eliminated through Drizzle ORM's native parameter binding engine.
3. **Data Sanitization:** Strict whitespace stripping, normalization to lower-case for email entities, and regex constraints rejecting executable script payloads in text fields.
4. **Guaranteed Delivery State:** The client UI *only* displays a success confirmation state upon receiving a verified HTTP 201 response containing the server-generated UUID.

---

## 4. Local Development & Setup

### Prerequisites
- Node.js `v20.x` or `v24.x`
- npm `v10.x` or `v11.x`
- Make utility (`make`)

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone https://github.com/onurdrsn/opspulse.git
   cd opspulse
   ```

2. **Install all workspace dependencies:**
   ```bash
   make install
   ```

3. **Configure Environment Variables:**
   - In `apps/worker/.dev.vars`:
     ```env
     DATABASE_URL="postgresql://[user]:[password]@[neon-hostname]/neondb?sslmode=require"
     ```
   - In `apps/web/.env`:
     ```env
     VITE_API_URL="http://localhost:8787"
     ```

4. **Initialize Database Schema:**
   Apply schema migrations directly to Neon Postgres:
   ```bash
   make db-push
   ```

5. **Start Development Servers:**
   ```bash
   # In terminal 1 (Worker API on port 8787):
   make dev-worker

   # In terminal 2 (Vite Frontend on port 5173):
   make dev-web
   ```

---

## 5. Verification & Test Procedures

### Automated Lifecycle Commands (`Makefile`)
Run `make help` to inspect the complete command catalogue:

```bash
$ make help

OpsPulse Monorepo Komut Listesi:

  build              Tüm uygulamaları derler
  build-web          Cloudflare Pages için web uygulamasını derler (dist/)
  clean              node_modules, dist ve derleme artıklarını temizler
  db-generate        Drizzle şemasından yeni SQL migration dosyaları üretir
  db-migrate         Üretilen SQL migration dosyalarını Neon veritabanına uygular
  db-push            Drizzle şemasını doğrudan Neon PostgreSQL veritabanına uygular (Push)
  db-studio          Drizzle Studio web arayüzünü açarak kayıtları inceler
  deploy-worker      Cloudflare Worker backend servisini canlıya alır
  dev                Hem frontend (web) hem backend (worker) servislerini paralel başlatır
  dev-web            Yalnızca Vite + React frontend uygulamasını başlatır
  dev-worker         Yalnızca Cloudflare Worker API'yi (wrangler) başlatır
  help               Mevcut tüm komutları ve açıklamalarını listeler
  install            Monorepo genelindeki tüm bağımlılıkları yükler
  lint               Kod tabanında tip ve sözdizimi kontrollerini çalıştırır
```

### End-to-End Functional Test Suite
1. **Empty Field Validation:** Submitting the form with empty values produces inline contextual error elements associated via `aria-describedby` with `role="alert"`.
2. **Invalid Email & Substring Formats:** Triggered via invalid format strings (e.g., `test@example`), rejected immediately both client-side and at API boundary with HTTP 400.
3. **Database Insertion Verification:** Run `make db-studio` or perform a direct SQL count against Neon:
   ```sql
   SELECT id, full_name, email, service_type, created_at FROM leads ORDER BY created_at DESC LIMIT 5;
   ```

---

## 6. Known Trade-Offs & Roadmap Limitations

- **Rate Limiting:** In this release, Cloudflare Worker Rate Limiting API is omitted to maintain zero external enterprise dependencies during evaluation. In high-traffic scenarios, KV-based sliding-window IP rate limiting should be enabled.
- **Transactional Email Notifications:** While inquiries are persistently recorded in Neon Postgres, email notifications (e.g., via Resend/Postmark) are decoupled and designed to hook into an asynchronous queue rather than running in-band within the worker request context.