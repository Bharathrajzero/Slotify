// src/app/actions/employees.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, initDb } from "@/lib/db/client";

const employeeSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(["junior_staff", "senior_staff", "manager"]),
  maxHoursPerWeek: z.number().min(1).max(168),
  hourlyRate: z.number().min(0).optional(),
});

const constraintSchema = z.object({
  employeeId: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  shiftIndex: z.enum(["0", "1", "2"]),
  isHardConstraint: z.boolean(),
  preferenceWeight: z.number().int().min(-10).max(10),
  reason: z.string().max(500).optional(),
});

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createEmployee(payload: unknown): Promise<ActionResult<{ id: string }>> {
  await initDb();
  const parsed = employeeSchema.safeParse(payload);
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const { fullName, email, role, maxHoursPerWeek, hourlyRate } = parsed.data;
  const id = crypto.randomUUID();

  try {
    await db.execute({
      sql: `INSERT INTO employees (id, full_name, email, role, max_hours_per_week, hourly_rate, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)`,
      args: [id, fullName, email, role, maxHoursPerWeek, hourlyRate ?? null],
    });
    revalidatePath("/dashboard/employees");
    return { success: true, data: { id } };
  } catch {
    return { success: false, error: "Email already exists or database error." };
  }
}

export async function toggleEmployeeActive(id: string, isActive: boolean): Promise<ActionResult<null>> {
  await initDb();
  await db.execute({
    sql: "UPDATE employees SET is_active = ?, updated_at = datetime('now') WHERE id = ?",
    args: [isActive ? 1 : 0, id],
  });
  revalidatePath("/dashboard/employees");
  return { success: true, data: null };
}

export async function upsertConstraint(payload: unknown): Promise<ActionResult<null>> {
  await initDb();
  const parsed = constraintSchema.safeParse(payload);
  if (!parsed.success) return { success: false, error: "Invalid constraint input." };

  const { employeeId, dayOfWeek, shiftIndex, isHardConstraint, preferenceWeight, reason } = parsed.data;
  await db.execute({
    sql: `INSERT INTO employee_constraints
            (id, employee_id, day_of_week, shift_index, is_hard_constraint, preference_weight, reason)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
          ON CONFLICT(employee_id, day_of_week, shift_index) DO UPDATE SET
            is_hard_constraint = excluded.is_hard_constraint,
            preference_weight = excluded.preference_weight,
            reason = excluded.reason,
            updated_at = datetime('now')`,
    args: [employeeId, dayOfWeek, shiftIndex, isHardConstraint ? 1 : 0, preferenceWeight, reason ?? null],
  });
  revalidatePath(`/dashboard/employees/${employeeId}`);
  return { success: true, data: null };
}

export async function deleteConstraint(constraintId: string): Promise<ActionResult<null>> {
  await initDb();
  await db.execute({ sql: "DELETE FROM employee_constraints WHERE id = ?", args: [constraintId] });
  revalidatePath("/dashboard/employees");
  return { success: true, data: null };
}
