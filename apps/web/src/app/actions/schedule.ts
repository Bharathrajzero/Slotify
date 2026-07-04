// src/app/actions/schedule.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, initDb } from "@/lib/db/client";

const uuidSchema = z.string().min(1);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const shiftIndexSchema = z.enum(["0", "1", "2"]);

const manualOverrideShiftSchema = z.object({
  employeeId: uuidSchema,
  shiftDate: isoDateSchema,
  shiftIndex: shiftIndexSchema,
  isSickLeave: z.boolean().default(false),
  notes: z.string().max(1000).trim().optional().transform((v) => v || undefined),
});

const deleteShiftOverrideSchema = z.object({ shiftId: uuidSchema });

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Dev: hardcoded manager id
const DEV_MANAGER_ID = "dev-manager-001";

export async function manualOverrideShift(
  payload: unknown
): Promise<ActionResult<{ shiftId: string }>> {
  await initDb();

  const parsed = manualOverrideShiftSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Input validation failed." };
  }

  const { employeeId, shiftDate, shiftIndex, isSickLeave, notes } = parsed.data;

  const emp = await db.execute({
    sql: "SELECT id FROM employees WHERE id = ? AND is_active = 1",
    args: [employeeId],
  });
  if (!emp.rows.length) {
    return { success: false, error: "Employee not found or inactive." };
  }

  const shiftId = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO assigned_shifts
            (id, employee_id, shift_date, shift_index, is_sick_leave, is_manual_override, overridden_by, notes)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?)
          ON CONFLICT(employee_id, shift_date, shift_index)
          DO UPDATE SET
            is_sick_leave = excluded.is_sick_leave,
            is_manual_override = 1,
            overridden_by = excluded.overridden_by,
            notes = excluded.notes,
            updated_at = datetime('now')`,
    args: [shiftId, employeeId, shiftDate, shiftIndex, isSickLeave ? 1 : 0, DEV_MANAGER_ID, notes ?? null],
  });

  // Fetch the actual id (may differ if it was an update)
  const row = await db.execute({
    sql: "SELECT id FROM assigned_shifts WHERE employee_id = ? AND shift_date = ? AND shift_index = ?",
    args: [employeeId, shiftDate, shiftIndex],
  });

  revalidatePath("/dashboard/roster");
  return { success: true, data: { shiftId: row.rows[0].id as string } };
}

export async function deleteShiftOverride(
  payload: unknown
): Promise<ActionResult<{ deleted: boolean }>> {
  await initDb();

  const parsed = deleteShiftOverrideSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const result = await db.execute({
    sql: "DELETE FROM assigned_shifts WHERE id = ?",
    args: [parsed.data.shiftId],
  });

  if (!result.rowsAffected) {
    return { success: false, error: "Shift record not found." };
  }

  revalidatePath("/dashboard/roster");
  return { success: true, data: { deleted: true } };
}
