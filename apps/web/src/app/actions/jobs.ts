// src/app/actions/jobs.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, initDb } from "@/lib/db/client";

const dateStrSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD.");

// Dev: hardcoded manager session
const DEV_MANAGER_ID = "dev-manager-001";

export async function triggerRosterOptimization(
  weekStartDate: unknown
): Promise<{ success: boolean; error?: string; jobId?: string }> {
  await initDb();

  const parsedDate = dateStrSchema.safeParse(weekStartDate);
  if (!parsedDate.success) {
    return { success: false, error: "Invalid date format. Use YYYY-MM-DD." };
  }
  const dateStr = parsedDate.data;

  const employeesRes = await db.execute(
    "SELECT id, role, max_hours_per_week FROM employees WHERE is_active = 1"
  );
  const constraintsRes = await db.execute(
    "SELECT employee_id, day_of_week, shift_index, is_hard_constraint, preference_weight FROM employee_constraints"
  );

  const defaultRequirements = [];
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 3; s++) {
      defaultRequirements.push({
        day_of_week: d,
        shift_index: s,
        min_staff_count: 2,
        min_senior_count: s === 2 ? 1 : 0,
        subordinate_per_senior_ratio: 3,
      });
    }
  }

  const engineInputPayload = {
    employees: employeesRes.rows.map((e) => ({
      id: e.id,
      role: e.role,
      max_hours_per_week: Number(e.max_hours_per_week),
    })),
    constraints: constraintsRes.rows.map((c) => ({
      employee_id: c.employee_id,
      day_of_week: c.day_of_week,
      shift_index: c.shift_index,
      is_hard_constraint: Boolean(c.is_hard_constraint),
      preference_weight: c.preference_weight,
    })),
    requirements: defaultRequirements,
  };

  const jobId = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO schedule_jobs (id, requested_by, week_start_date, status, input_payload)
          VALUES (?, ?, ?, 'pending', ?)`,
    args: [jobId, DEV_MANAGER_ID, dateStr, JSON.stringify(engineInputPayload)],
  });

  revalidatePath("/dashboard/roster");
  return { success: true, jobId };
}
