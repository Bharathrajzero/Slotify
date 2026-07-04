// src/app/dashboard/employees/[id]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, initDb } from "@/lib/db/client";
import ConstraintManager from "./ConstraintManager";
import ToggleActiveButton from "./ToggleActiveButton";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHIFT_LABELS: Record<string, string> = { "0": "Morning", "1": "Afternoon", "2": "Night" };

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  await initDb();

  const empRes = await db.execute({
    sql: "SELECT * FROM employees WHERE id = ?",
    args: [params.id],
  });
  if (!empRes.rows.length) notFound();
  const emp = empRes.rows[0];

  const constraintsRes = await db.execute({
    sql: "SELECT * FROM employee_constraints WHERE employee_id = ? ORDER BY day_of_week, shift_index",
    args: [params.id],
  });

  const constraints = constraintsRes.rows.map((c) => ({
    id: c.id as string,
    dayOfWeek: c.day_of_week as number,
    shiftIndex: c.shift_index as string,
    isHardConstraint: Boolean(c.is_hard_constraint),
    preferenceWeight: c.preference_weight as number,
    reason: c.reason as string | null,
  }));

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/employees" className="text-xs text-blue-600 hover:underline">← Employees</Link>
        <a
          href={`/schedule/${params.id}`}
          target="_blank"
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"
        >
          📅 View My Schedule →
        </a>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{emp.full_name as string}</h1>
          <p className="text-sm text-gray-500">{emp.email as string}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs capitalize text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
              {(emp.role as string).replace(/_/g, " ")}
            </span>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
              {emp.max_hours_per_week as number}h/week max
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${emp.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              {emp.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <ToggleActiveButton employeeId={params.id} isActive={Boolean(emp.is_active)} />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Shift Constraints</h2>
        <p className="text-xs text-slate-500">Hard constraints block the solver from assigning that slot. Soft constraints influence the optimization objective.</p>

        {constraints.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Day</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Shift</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Weight</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {constraints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{DAY_LABELS[c.dayOfWeek]}</td>
                    <td className="px-4 py-2">{SHIFT_LABELS[c.shiftIndex]}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.isHardConstraint ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                        {c.isHardConstraint ? "Hard (Blackout)" : "Soft (Preference)"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{c.isHardConstraint ? "—" : c.preferenceWeight}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{c.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConstraintManager employeeId={params.id} />
      </div>
    </div>
  );
}
