// src/lib/db/client.ts
import { createClient } from "@libsql/client";
import path from "path";

const dbPath = path.join(process.cwd(), "local.db");

export const db = createClient({
  url: `file:${dbPath}`,
});

let initialized = false;

export async function initDb() {
  if (initialized) return;
  initialized = true;

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'junior_staff',
      supervisor_id TEXT,
      max_hours_per_week REAL NOT NULL DEFAULT 40,
      hourly_rate REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS employee_constraints (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      shift_index TEXT NOT NULL CHECK(shift_index IN ('0','1','2')),
      is_hard_constraint INTEGER NOT NULL DEFAULT 0,
      preference_weight INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(employee_id, day_of_week, shift_index)
    );
    CREATE TABLE IF NOT EXISTS schedule_jobs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      requested_by TEXT NOT NULL REFERENCES employees(id),
      week_start_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      input_payload TEXT NOT NULL,
      result_payload TEXT,
      error_message TEXT,
      solver_wall_time_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      started_at TEXT,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS assigned_shifts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      job_id TEXT REFERENCES schedule_jobs(id) ON DELETE SET NULL,
      shift_date TEXT NOT NULL,
      shift_index TEXT NOT NULL CHECK(shift_index IN ('0','1','2')),
      is_sick_leave INTEGER NOT NULL DEFAULT 0,
      is_manual_override INTEGER NOT NULL DEFAULT 0,
      overridden_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(employee_id, shift_date, shift_index)
    );
    INSERT OR IGNORE INTO employees (id, full_name, email, role, max_hours_per_week, hourly_rate, is_active)
    VALUES
      ('dev-manager-001', 'Evelyn Vance (Ops Director)', 'manager@local.dev', 'manager', 40, 75, 1),
      ('dev-senior-002', 'Marcus Broady (Shift Lead)', 'senior@local.dev', 'senior_staff', 40, 42.5, 1),
      ('dev-junior-003', 'Jane Doe (Associate)', 'jane@local.dev', 'junior_staff', 32, 22, 1),
      ('dev-junior-004', 'John Smith (Associate)', 'john@local.dev', 'junior_staff', 24, 21.5, 1);
  `);
}
