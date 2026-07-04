import React from "react";
import { notFound } from "next/navigation";
import { db, initDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

interface ShiftConfig {
  label: string;
  time: string;
  bg: string;
  border: string;
  text: string;
  iconBg: string;
}

const SHIFT_LABELS: Record<string, ShiftConfig> = {
  "0": { label: "Morning",   time: "06:00 – 14:00", bg: "bg-emerald-50/60",  border: "border-emerald-200/80", text: "text-emerald-900", iconBg: "bg-emerald-100 text-emerald-700" },
  "1": { label: "Afternoon", time: "14:00 – 22:00", bg: "bg-blue-50/60",     border: "border-blue-200/80",    text: "text-blue-900",    iconBg: "bg-blue-100 text-blue-700" },
  "2": { label: "Night",     time: "22:00 – 06:00", bg: "bg-indigo-50/60",   border: "border-indigo-200/80",  text: "text-indigo-900",  iconBg: "bg-indigo-100 text-indigo-700" },
};

function getWeekDates(): string[] {
  const current = new Date();
  const day = current.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
    short: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

export default async function EmployeeSchedulePage({ params }: { params: { employeeId: string } }) {
  await initDb();

  const empRes = await db.execute({
    sql: "SELECT id, full_name, email, role FROM employees WHERE id = ? AND is_active = 1",
    args: [params.employeeId],
  });
  if (!empRes.rows.length) notFound();
  const emp = empRes.rows[0];

  const weekDates = getWeekDates();

  const shiftsRes = await db.execute({
    sql: `SELECT shift_date, shift_index, is_sick_leave, notes
          FROM assigned_shifts
          WHERE employee_id = ? AND shift_date >= ? AND shift_date <= ?
          ORDER BY shift_date, shift_index`,
    args: [params.employeeId, weekDates[0], weekDates[6]],
  });

  const shiftMap = new Map<string, { shiftIndex: string; isSickLeave: boolean; notes: string | null }>();
  for (const row of shiftsRes.rows) {
    shiftMap.set(`${row.shift_date}_${row.shift_index}`, {
      shiftIndex: row.shift_index as string,
      isSickLeave: Boolean(row.is_sick_leave),
      notes: row.notes as string | null,
    });
  }

  const totalShifts = shiftsRes.rows.filter((r) => !r.is_sick_leave).length;
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header Block */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
              {(emp.full_name as string).charAt(0)}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{emp.full_name as string}</h1>
              <p className="text-xs text-slate-500 font-medium capitalize">
                {(emp.role as string).replace(/_/g, " ")} <span className="text-slate-300 mx-1.5">•</span> {emp.email as string}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0 border-t border-slate-100 sm:border-0 pt-3 sm:pt-0">
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              {formatDate(weekDates[0]).short} – {formatDate(weekDates[6]).short}
            </span>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md">
              {totalShifts} Assigned Shift{totalShifts !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Roster Layout Stack */}
        <div className="space-y-3">
          {weekDates.map((dateStr) => {
            const { weekday, short } = formatDate(dateStr);
            const dayShifts = (["0", "1", "2"] as const)
              .map((si) => shiftMap.get(`${dateStr}_${si}`))
              .filter(Boolean);

            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`bg-white border rounded-xl p-5 shadow-sm transition-all grid grid-cols-1 sm:grid-cols-[130px_1fr] items-start gap-4 sm:gap-6 ${
                  isToday ? "border-blue-500 ring-1 ring-blue-500/20 bg-gradient-to-r from-blue-50/30 to-white" : "border-slate-200/80"
                }`}
              >
                {/* Fixed Structural Date Column */}
                <div className="flex sm:flex-col items-baseline sm:items-start justify-between sm:justify-center gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isToday ? "text-blue-600" : "text-slate-800"}`}>{weekday}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{short}</span>
                  {isToday && (
                    <span className="sm:mt-2 text-[10px] uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded font-bold shadow-sm">
                      Today
                    </span>
                  )}
                </div>

                {/* Performance Assignment Window */}
                <div className="w-full">
                  {dayShifts.length === 0 ? (
                    <div className="py-3 px-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/40 flex items-center justify-center">
                      <p className="text-xs text-slate-400 font-medium italic tracking-wide">No shifts scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {dayShifts.map((shift) => {
                        const config = SHIFT_LABELS[shift!.shiftIndex];
                        
                        // Render State: Leave Allocation Exception
                        if (shift!.isSickLeave) {
                          return (
                            <div key={shift!.shiftIndex} className="flex items-center gap-3.5 px-4 py-3 bg-rose-50/60 border border-rose-200/70 rounded-xl shadow-xs">
                              <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center text-sm font-bold shrink-0">🤒</div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-rose-800/80 line-through tracking-tight">
                                  {config.label} <span className="font-normal text-rose-500 mx-1">•</span> {config.time}
                                </p>
                                <p className="text-[11px] font-semibold text-rose-600">Sick Leave Active</p>
                              </div>
                            </div>
                          );
                        }

                        // Render State: Active Shift Allocation
                        return (
                          <div key={shift!.shiftIndex} className={`flex items-start gap-3.5 px-4 py-3 ${config.bg} border ${config.border} rounded-xl shadow-xs`}>
                            <div className={`h-8 w-8 rounded-lg ${config.iconBg} flex items-center justify-center text-sm shrink-0 font-bold shadow-xs`}>
                              {shift!.shiftIndex === "0" && "🌅"}
                              {shift!.shiftIndex === "1" && "☀️"}
                              {shift!.shiftIndex === "2" && "🌙"}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2">
                                <p className={`text-xs font-bold ${config.text} tracking-tight`}>{config.label}</p>
                                <span className={`text-[11px] font-medium ${config.text} opacity-70`}>{config.time}</span>
                              </div>
                              {shift!.notes && (
                                <p className="text-[11px] leading-relaxed text-slate-600 bg-white/70 border border-slate-200/50 rounded px-2 py-1 mt-1 font-medium italic break-words">
                                  {shift!.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Gateway Actions */}
        <div className="pt-4 text-center space-y-3">
          <p className="text-[11px] font-medium text-slate-400 tracking-wide">
            Schedule updates automatically. Refresh to sync live modifications.
          </p>
          <div>
            <a 
              href="/schedule/logout" 
              className="inline-flex px-4 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 bg-white rounded-lg transition-all shadow-xs"
            >
              Sign out of Portal
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}