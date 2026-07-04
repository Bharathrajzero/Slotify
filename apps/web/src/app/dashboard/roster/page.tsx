// src/app/dashboard/roster/page.tsx
import React from "react";
import { db, initDb } from "@/lib/db/client";
import RosterGrid from "./RosterGrid";
import JobTriggerCard from "./JobTriggerCard";
import { triggerRosterOptimization } from "@/app/actions/jobs";

function getWeekDates(): string[] {
  const current = new Date();
  const day = current.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return d.toISOString().split("T")[0];
  });
}

export const dynamic = "force-dynamic";

export default async function RosterDashboardPage() {
  await initDb();
  const weekDates = getWeekDates();

  const [employeesRes, shiftsRes] = await Promise.all([
    db.execute("SELECT id, full_name, role FROM employees WHERE is_active = 1 ORDER BY full_name"),
    db.execute({
      sql: "SELECT id, employee_id, shift_date, shift_index, is_sick_leave, notes FROM assigned_shifts WHERE shift_date >= ? AND shift_date <= ?",
      args: [weekDates[0], weekDates[6]],
    }),
  ]);

  const employees = employeesRes.rows.map((e) => ({
    id: e.id as string,
    fullName: e.full_name as string,
    role: e.role as "junior_staff" | "senior_staff" | "manager",
  }));

  const initialShifts = shiftsRes.rows.map((s) => ({
    id: s.id as string,
    employeeId: s.employee_id as string,
    shiftDate: s.shift_date as string,
    shiftIndex: s.shift_index as "0" | "1" | "2",
    isSickLeave: Boolean(s.is_sick_leave),
    notes: s.notes as string | null,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Enterprise Shift Operational Grid</h1>
        <p className="text-sm text-gray-500">
          Real-time view of staffing assignments. Click any slot to override, assign, or mark an employee as absent.
        </p>
      </div>
      <JobTriggerCard weekStartDate={weekDates[0]} onJobTriggeredAction={triggerRosterOptimization} />
      <RosterGrid employees={employees} initialShifts={initialShifts} weekDates={weekDates} />
    </div>
  );
}
