# SLOTIFY

### *Enterprise Shift-Scheduler & Conflict Resolver*

An enterprise-grade, full-stack workforce scheduling platform powered by a **Constraint-Satisfaction Problem (CSP)** optimization engine. Managers can view and manually override a real-time weekly roster grid, trigger an automated **Google OR-Tools CP-SAT** solver to generate mathematically optimal, conflict-free shift assignments, and manage complex employee compliance rules. Employees get an isolated, mobile-friendly personal schedule portal.

```
┌────────────────────────────────────────────────────────────────────────┐
│  [!] High-Performance Monorepo Architecture                           │
│  └─ Decoupled Next.js 15 UI Framework ──► Python CP-SAT Solver Daemon │
└────────────────────────────────────────────────────────────────────────┘

```

---

## ─── ARCHITECTURE & TECH STACK ────────────────────────────────────────

The application is structured as a high-performance monorepo utilizing decoupled services for the frontend workspace and the high-compute mathematical solver.

```
Slotify/
├── apps/
│   └── web/                        # Next.js 15 Web Application[cite: 1]
│       ├── src/app/actions/        # Secure Server Actions (Auth, Roster, Solver orchestration)[cite: 1]
│       ├── src/lib/db/             # SQLite Client initialization, schema definitions & seeds[cite: 1]
│       └── local.db                # High-concurrency WAL-enabled SQLite instance[cite: 1]
├── services/
│   └── solver/                     # Python Optimization Microservice[cite: 1]
│       ├── csp_solver.py           # Core CP-SAT scheduling model logic[cite: 1]
│       ├── scheduler_daemon.py     # Multi-threaded background SQLite queue consumer[cite: 1]
│       └── main.py                 # FastAPI operational HTTP wrapper[cite: 1]
└── supabase/                       # Production PostgreSQL migrations & RLS policy rules[cite: 1]

```

### Technology Matrix

| Layer | Stack | Key Capabilities |
| --- | --- | --- |
| **Frontend UI** | Next.js 15 (App Router), React 19, Tailwind CSS | Server-side rendering, instant optimistic grid updates, UI state caching.

 |
| **Backend Orchestration** | Next.js Server Actions | Secure server-side execution context, bypassing REST endpoints for lower latencies.

 |
| **Local Database** | Embedded SQLite via `@libsql/client` | Zero-configuration database implementation featuring highly concurrent **WAL mode**.

 |
| **Production Database** | Supabase (PostgreSQL + RLS) | Real-time listeners, strict Row-Level Security parameters, cloud-ready execution.

 |
| **Compute Solver** | Python 3.10+, Google OR-Tools CP-SAT | Advanced linear programming solver utilizing highly parallel search workers.

 |
| **Service Ingestion** | FastAPI + Uvicorn | High-throughput asynchronous gateway endpoints for direct programmatic solver access.

 |

---

## ─── MATHEMATICAL CONSTRAINT MATRIX ───────────────────────────────────

The CP-SAT solver doesn't just guess schedules; it mathematically enforces physical and legal bounds while optimizing for employee preferences:

### Hard Constraints (Strict Compliance)

* **Single Shift Allocation Limit:** Employees are physically locked to a maximum of one shift per $24\text{-hour}$ cycle to protect worker health.


* **Ergonomic Rest Windows:** Restrictive protection against back-to-back scheduling (e.g., a Night shift worker cannot be scheduled for the following day's Morning shift).


* **Hard Availability Blackouts:** Structural assurance that explicit employee blackout dates are strictly respected.


* **Weekly Labor Hour Caps:** Strict validation ensures no employee shifts push them past their configured weekly maximum hours cap.



### Soft Constraints & Objectives (Optimization Targets)

* **Soft Capacity Slacks:** Features an elastic slack variable layer. If a labor deficit occurs, the engine dynamically isolates empty slots instead of experiencing an application crash, returning a `FEASIBLE` layout.


* **Preference Score Maximization:** Calculates and scales weight distributions (from $-10$ to $+10$) based on worker sentiment targets to optimize staff retention.


* **Senior Supervision Margins:** Enforces specialized roles where shifts demand a critical baseline of senior engineers or managers.


* **Subordinate Ratios:** Dynamically maintains proportional balance between junior and senior personnel across operational windows.



---

## ─── GETTING STARTED (LOCAL DEVELOPMENT) ──────────────────────────────

### Prerequisites

* **Node.js** $\ge$ 18.18


* **pnpm** $\ge$ 8


* **Python** $\ge$ 3.10



### 1. Initialize Frontend Monorepo

Clone the repository and install the JavaScript workspace dependencies:

```bash
pnpm install

```

Start the Next.js development server:

```bash
pnpm dev

```

The application will spin up at `http://localhost:3000`. The local SQLite database (`apps/web/local.db`) will instantly auto-generate on the first request and seed itself with default system fixtures.

### 2. Configure the Python Engine

Open a separate terminal window, navigate to the solver container, and establish your virtual environment variables:

```bash
cd services/solver
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

```

Launch the continuous execution daemon process (polls the SQLite queue for incoming scheduling operations):

```bash
python scheduler_daemon.py

```

*(Optional)* Start the independent FastAPI HTTP gateway for programmatic endpoints:

```bash
uvicorn main:app --reload --port 8000

```

---

## ─── LOCAL ACCESS MATRIX ─────────────────────────────────────────────

Authentication runs via a secure passwordless email session system for rapid local testing:

| Seeded User Identity | System Access Level | Target Redirect Endpoint |
| --- | --- | --- |
| `manager@local.dev` | **Global Manager** | `/dashboard` (Full Administrative Hub)

 |
| `senior@local.dev` | Senior Staff | `/schedule/dev-senior-002` (Isolated Portal)

 |
| `jane@local.dev` | Junior Staff | `/schedule/dev-junior-003` (Isolated Portal)

 |
| `john@local.dev` | Junior Staff | `/schedule/dev-junior-004` (Isolated Portal)

 |

### Access Control Rules

* `/dashboard/*` routes are heavily protected by middleware. Any non-manager session is rejected and seamlessly routed back to their matching personal user space.


* `/schedule/[id]` verifies that token parameters match the request query. Employees are barred from viewing other team members' portals.



---

## ─── PRODUCTION TRANSITION (SUPABASE DEPLOYMENTS) ─────────────────────

Migrating the application from a local SQLite instance to a production cloud architecture takes just a few steps:

1. **Deploy Schemas:** Execute the structured data tracking tables on your Supabase cluster using the migration utility:


```bash
supabase db push

```


2. **Environment Configuration:** Update `apps/web/.env.local` with your cloud cluster endpoints:


```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

```


3. **Switch Data Layer Hooks:** Swap the imports inside your Server Actions (`src/app/actions/jobs.ts`, `schedule.ts`, `employees.ts`) from `@/lib/db/client` to use the server-side Supabase client utility wrapper `@/lib/supabase/server`.


4. **Daemon Launch:** Pass your Supabase environment connection strings to `scheduler_daemon.py` to seamlessly decouple the engine from SQLite and listen to your live production cloud queue instead.



---

## ─── LICENSE ─────────────────────────────────────────────────────────

Distributed under the terms of the MIT License. See `LICENSE` for details.

---
