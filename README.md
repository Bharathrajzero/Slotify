<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=28&pause=1000&color=9C86FF&center=true&vCenter=true&width=800&height=60&lines=Slotify;Shift-Scheduler+%26+Conflict+Resolver" alt="Slotify Header Animation" />
</p>

<p align="center">
  <strong>An enterprise-grade, full-stack workforce scheduling platform powered by a Constraint-Satisfaction Problem (CSP) optimization engine.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OR--Tools-CP--SAT-blueviolet?style=for-the-badge&logo=google" alt="Google OR-Tools" />
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License MIT" />
</p>

---
## Project Showcase

<details open>
  <summary>📸 Expand / Collapse App Screenshots</summary>
  <br/>
  <p align="center">
    <img width="100%" alt="Dashboard Overview" src="https://github.com/user-attachments/assets/baac6d9d-67e1-4042-9bce-66b09cc28895" style="border-radius: 8px; margin: 1%;" />
    <img width="100%" alt="Roster Grid View" src="https://github.com/user-attachments/assets/9dca3a87-d6a7-4611-bd3c-0cf333f250d6" style="border-radius: 8px; margin: 1%;" />
  </p>
  <p align="center">
    <img width="100%" alt="Solver Configuration" src="https://github.com/user-attachments/assets/36cfc682-abd0-4cd2-96ae-2d69ba3e49da" style="border-radius: 8px; margin: 1%;" />
    <img width="100%" alt="Compliance Diagnostics" src="https://github.com/user-attachments/assets/59abbb79-3a55-4900-886c-5784edbce1a3" style="border-radius: 8px; margin: 1%;" />
  </p>
  <p align="center">
    <img width="100%" alt="Employee Workspace" src="https://github.com/user-attachments/assets/7ac9247f-ce7f-49c4-808d-c42b0dc8324e" style="border-radius: 8px; margin: 1%;" />
    <img width="100%" alt="Roster Generation Engine" src="https://github.com/user-attachments/assets/fc79d019-ec56-46e4-abf4-9dab7c726dd3" style="border-radius: 8px; margin: 1%;" />
  </p>
</details>

---

## Architecture & Tech Stack

Slotify is structured as a high-performance monorepo utilizing decoupled services for the frontend workspace and the high-compute mathematical solver engine.

```text
Slotify/
├── apps/
│   └── web/                        # Next.js 15 Web Application
│       ├── src/app/actions/        # Secure Server Actions (Auth, Roster, Solver orchestration)
│       ├── src/lib/db/             # SQLite Client initialization, schema definitions & seeds
│       └── local.db                # High-concurrency WAL-enabled SQLite instance
├── services/
│   └── solver/                     # Python Optimization Microservice
│       ├── csp_solver.py           # Core CP-SAT scheduling model logic
│       ├── scheduler_daemon.py     # Multi-threaded background SQLite queue consumer
│       └── main.py                 # FastAPI operational HTTP wrapper
└── supabase/                       # Production PostgreSQL migrations & RLS policy rules

```

### Core Technology Matrix

| Layer | Stack Composition | Key System Capabilities |
| --- | --- | --- |
| **Frontend UI** | Next.js 15 (App Router), React 19, Tailwind CSS | Server-side rendering, instant optimistic grid updates, complex UI state caching. |
| **Backend Orchestration** | Next.js Server Actions | Secure server-side execution context, bypassing REST endpoints for lower latencies. |
| **Local Database** | Embedded SQLite via `@libsql/client` | Zero-configuration database implementation featuring highly concurrent **WAL mode**. |
| **Production Database** | Supabase (PostgreSQL + RLS) | Real-time listeners, strict Row-Level Security parameters, cloud-ready execution. |
| **Compute Solver** | Python 3.10+, Google OR-Tools CP-SAT | Advanced linear programming solver utilizing highly parallel search workers. |
| **Service Ingestion** | FastAPI + Uvicorn | High-throughput asynchronous gateway endpoints for direct programmatic solver access. |

---

## Mathematical Constraint Matrix

The CP-SAT solver goes beyond heuristic guessing; it mathematically enforces physical and legal bounds while optimizing for employee satisfaction parameters.

### Hard Constraints (Strict Compliance)

> Mandatory restrictions that cannot be breached. The engine guarantees 100% adherence.

* **Single Shift Allocation Limit:** Employees are physically locked to a maximum of one shift per 24-hour cycle to protect worker health.
* **Ergonomic Rest Windows:** Restrictive protection against back-to-back scheduling (e.g., a Night shift worker cannot be scheduled for the following day's Morning shift).
* **Hard Availability Blackouts:** Structural assurance that explicit employee blackout dates are strictly respected.
* **Weekly Labor Hour Caps:** Strict validation ensures no employee shifts push them past their configured weekly maximum hours cap.

### Soft Constraints & Objectives (Optimization Targets)

> Mathematical weights shifted by the solver to approach an optimal target score.

* **Soft Capacity Slacks:** Features an elastic slack variable layer. If a labor deficit occurs, the engine dynamically isolates empty slots instead of experiencing an application crash, returning a `FEASIBLE` layout.
* **Preference Score Maximization:** Calculates and scales weight distributions (from -10 to +10) based on worker sentiment targets to optimize staff retention.
* **Senior Supervision Margins:** Enforces specialized roles where shifts demand a critical baseline of senior engineers or managers.
* **Subordinate Ratios:** Dynamically maintains proportional balance between junior and senior personnel across operational windows.

---

## Getting Started (Local Development)

### System Prerequisites

* **Node.js** >= 18.18
* **pnpm** >= 8
* **Python** >= 3.10

### 1. Initialize Frontend Monorepo

Clone the repository, download dependencies, and boot up the UI environment:

```bash
pnpm install
pnpm dev

```

The application will spin up at `http://localhost:3000`. The local SQLite database (`apps/web/local.db`) will instantly auto-generate on the first request and seed itself with default system fixtures.

### 2. Configure the Python Engine

Open a separate terminal window, isolate the solver service, and spin up the daemon pipeline:

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

## Local Access Matrix

Authentication runs via a secure passwordless email session system for rapid local testing and credential verification:

| Seeded User Identity | System Access Level | Target Redirect Endpoint | Access Permissions |
| --- | --- | --- | --- |
| `manager@local.dev` | Global Manager | `/dashboard` | Full Administrative Hub & Solver Control |
| `senior@local.dev` | Senior Staff | `/schedule/dev-senior-002` | Isolated Personal Portal Only |
| `jane@local.dev` | Junior Staff | `/schedule/dev-junior-003` | Isolated Personal Portal Only |
| `john@local.dev` | Junior Staff | `/schedule/dev-junior-004` | Isolated Personal Portal Only |

> **Note:** `/dashboard/*` routes are heavily protected by middleware. Any non-manager session is rejected and seamlessly routed back to their matching personal user space. `/schedule/[id]` verifies that token parameters match the request query. Employees are barred from viewing other team members' portals.

---

## Production Transition (Supabase Deployments)

Migrating the application from a local SQLite instance to a production cloud architecture takes just a few steps:

1. **Deploy Schemas:** Execute the structured data tracking tables on your Supabase cluster using the migration utility:
```bash
supabase db push

```


2. **Environment Configuration:** Update `apps/web/.env.local` with your cloud cluster endpoints:
```env
NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

```


3. **Switch Data Layer Hooks:** Swap the imports inside your Server Actions (`src/app/actions/jobs.ts`, `schedule.ts`, `employees.ts`) from `@/lib/db/client` to use the server-side Supabase client utility wrapper `@/lib/supabase/server`.
4. **Daemon Launch:** Pass your Supabase environment connection strings to `scheduler_daemon.py` to seamlessly decouple the engine from SQLite and listen to your live production cloud queue instead.

---

---

## Author

* **Developer:** Bharath Raj
* **GitHub Profile:** [github.com/bharathrajzero](https://github.com/bharathrajzero)
  
---

## License

Distributed under the terms of the MIT License. See `LICENSE` for details.
