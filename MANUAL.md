# User Manual — Enterprise Shift-Scheduler

> A step-by-step guide for both **Managers** and **Employees** on how to use the platform.

---

## Table of Contents

1. [Logging In](#1-logging-in)
2. [Manager — Dashboard Overview](#2-manager--dashboard-overview)
3. [Manager — Roster Grid](#3-manager--roster-grid)
4. [Manager — Running the Optimizer](#4-manager--running-the-optimizer)
5. [Manager — Employee Management](#5-manager--employee-management)
6. [Manager — Setting Constraints](#6-manager--setting-constraints)
7. [Employee — Viewing Your Schedule](#7-employee--viewing-your-schedule)
8. [Signing Out](#8-signing-out)
9. [Shift Reference](#9-shift-reference)

---

## 1. Logging In

Everyone — managers and employees alike — starts at the same login page.

**URL:** `http://localhost:3000/schedule/login`

![Login Page]

**Steps:**
1. Open the app in your browser
2. Enter your **work email address**
3. Click **View My Schedule →**

**What happens next depends on your role:**

| Your Email | Your Role | You land on |
|---|---|---|
| `manager@local.dev` | Manager | Dashboard |
| `senior@local.dev` | Senior Staff | Your personal schedule |
| `jane@local.dev` | Junior Staff | Your personal schedule |
| `john@local.dev` | Junior Staff | Your personal schedule |

> No password is required in local development mode.

---

## 2. Manager — Dashboard Overview

**URL:** `/dashboard`

After logging in as a manager you land on the dashboard. It shows three live stats at a glance:

| Card | What it shows |
|---|---|
| **Active Employees** | Number of employees currently active in the system |
| **Jobs In Queue** | Optimization jobs that are pending or currently being processed |
| **Upcoming Shifts** | Total shifts assigned from today onwards |

Click any stat card or use the two navigation cards below to jump to:
- **Roster Grid** — view and edit the weekly shift schedule
- **Employees** — manage staff and their constraints

The **header navigation** at the top is always visible and lets you jump between Dashboard, Roster, and Employees from any page.

---

## 3. Manager — Roster Grid

**URL:** `/dashboard/roster`

This is the main scheduling view. It shows a **7-day grid** (Monday to Sunday) with every active employee as a row and three shift slots per day as columns.

### Reading the grid

Each cell contains three shift buttons stacked vertically:

| Appearance | Meaning |
|---|---|
| Dashed grey border | No shift assigned for that slot |
| Coloured + **Live** badge | Shift is assigned and active |
| Red + **Sick** badge + strikethrough | Employee is on sick leave for that slot |

### Assigning a shift

1. Find the employee row and the day column you want
2. Click the **empty dashed slot** for Morning, Afternoon, or Night
3. The slot turns coloured immediately — the shift is saved

### Marking sick leave

1. Find an already-assigned (coloured) slot
2. Click it once
3. It turns red with a **Sick** badge — the employee is marked as on sick leave

### Removing an assignment

1. Find a **red sick leave** slot
2. Click it once
3. The slot clears completely — the assignment is deleted

> Changes are saved to the database instantly. No save button needed.

---

## 4. Manager — Running the Optimizer

**URL:** `/dashboard/roster` (top of the page)

The **CP-SAT Optimization Engine** card sits above the roster grid. It automatically generates a full week's roster using Google OR-Tools, respecting all employee constraints.

### How to trigger it

1. Go to the Roster page
2. Find the **CP-SAT Optimization Engine** card at the top
3. Click **Run Optimization Solver**
4. The button changes to **Queuing...** then a status badge appears

### Status progression

```
Queuing... → Pending → ⏳ Processing... → Completed ✓
```

| Status | Meaning |
|---|---|
| **Pending** | Job is in the queue, waiting for the solver daemon |
| **Processing** | Python solver is actively computing the schedule |
| **Completed** | Roster has been generated and saved — refresh the grid to see it |
| **Failed** | Solver could not find a valid schedule — check constraints |

> **Important:** The Python solver daemon must be running for jobs to be processed. See the README for how to start it (`python scheduler_daemon.py`).

### What the solver respects

- ✅ Hard blackout constraints — employee **cannot** work that slot
- ✅ Soft preference weights — optimizer tries to honour preferences
- ✅ Maximum weekly hours per employee
- ✅ Minimum staff count per shift
- ✅ Minimum senior staff per shift (especially night shifts)
- ✅ No night shift followed by a morning shift the next day
- ✅ Subordinate-to-senior ratio per shift

---

## 5. Manager — Employee Management

**URL:** `/dashboard/employees`

This page lists all employees (active and inactive) and lets you add new ones.

### Adding a new employee

Fill in the **Add New Employee** form at the top:

| Field | Required | Notes |
|---|---|---|
| Full Name | ✅ | Up to 200 characters |
| Email | ✅ | Must be unique — this is their login |
| Role | ✅ | Junior Staff / Senior Staff / Manager |
| Max Hours/Week | ✅ | The solver will not exceed this |
| Hourly Rate | ❌ | Optional, for payroll reference |

Click **Add Employee**. They can immediately log in with their email.

### Employee list

The table shows all employees with:
- Their role and max hours
- Active / Inactive status badge
- **Manage →** link to their detail page
- **📅 View →** link to open their personal schedule

### Activating / Deactivating

1. Click **Manage →** next to an employee
2. On their detail page, click the **Deactivate** or **Activate** button
3. Inactive employees are excluded from the roster grid and the optimizer

---

## 6. Manager — Setting Constraints

**URL:** `/dashboard/employees/[id]`

Each employee can have constraints set per day and shift. These tell the optimizer what to avoid or prefer.

### Types of constraints

| Type | Effect |
|---|---|
| **Hard (Blackout)** | The solver will **never** assign this employee to this slot |
| **Soft (Preference)** | The solver **tries** to honour this — weighted by the preference score |

### Preference weight scale

For soft constraints, the weight ranges from **-10 to +10**:

| Weight | Meaning |
|---|---|
| `+10` | Strongly prefers this slot |
| `+1` to `+9` | Mild to strong preference |
| `0` | Neutral |
| `-1` to `-9` | Mild to strong dislike |
| `-10` | Strongly avoids this slot |

### Adding a constraint

1. Go to **Manage →** for an employee
2. Scroll to the **Shift Constraints** section
3. In the **Add / Update Constraint** form:
   - Select the **Day** (Sunday–Saturday)
   - Select the **Shift** (Morning / Afternoon / Night)
   - Choose **Hard** or **Soft**
   - If Soft, set the **Weight**
   - Optionally add a **Reason** (e.g. "Childcare commitment")
4. Click **Save Constraint**

> If a constraint already exists for that day/shift combination it will be updated, not duplicated.

### Existing constraints

All current constraints for the employee are shown in a table above the form, showing the day, shift, type, weight, and reason.

---

## 7. Employee — Viewing Your Schedule

**URL:** `/schedule/[your-employee-id]`

After logging in, employees are taken directly to their personal weekly schedule. This page shows the **current week** (Monday to Sunday).

### Reading your schedule

Each day appears as a card:

| What you see | Meaning |
|---|---|
| 🌅 **Morning** · 06:00 – 14:00 | You are assigned the morning shift |
| ☀️ **Afternoon** · 14:00 – 22:00 | You are assigned the afternoon shift |
| 🌙 **Night** · 22:00 – 06:00 | You are assigned the night shift |
| 🤒 ~~Morning~~ · Sick leave | You have been marked as on sick leave |
| *No shifts assigned* | You have no shifts for that day |

- **Today's card** is highlighted with a blue border and a **Today** badge
- The total number of shifts for the week is shown at the top
- The page refreshes automatically — just reload to see the latest schedule

### Privacy

- You can **only** see your own schedule
- Trying to access another employee's URL will redirect you back to your own page
- Managers can view any employee's schedule

---

## 8. Signing Out

### From the dashboard (managers)
Click **Sign out** in the top-right navigation bar.

### From the schedule page (employees)
Scroll to the bottom of your schedule page and click **Sign out**.

Both redirect you back to the login page at `/schedule/login`.

---

## 9. Shift Reference

| Shift | Hours | Emoji | Duration |
|---|---|---|---|
| Morning | 06:00 – 14:00 | 🌅 | 8 hours |
| Afternoon | 14:00 – 22:00 | ☀️ | 8 hours |
| Night | 22:00 – 06:00 | 🌙 | 8 hours |

> The solver enforces that no employee works a **Night** shift followed by a **Morning** shift the very next day.

---

*Enterprise Shift-Scheduler · Built by **Bharath Raj** · [github.com/bharathrajzero](https://github.com/bharathrajzero) · © 2026*
