// apps/web/src/app/dashboard/roster/RosterGrid.tsx
"use client";

import React, { useState, useTransition } from "react";
import { manualOverrideShift, deleteShiftOverride } from "@/app/actions/schedule";

interface EmployeeRow {
  id: string;
  fullName: string;
  role: "junior_staff" | "senior_staff" | "manager";
}

interface AssignedShift {
  id: string;
  employeeId: string;
  shiftDate: string;
  shiftIndex: "0" | "1" | "2";
  isSickLeave: boolean;
  notes?: string | null;
}

interface RosterGridProps {
  employees: EmployeeRow[];
  initialShifts: AssignedShift[];
  weekDates: string[]; // Array of 7 ISO Date strings (YYYY-MM-DD)
}

const SHIFT_LABELS = {
  "0": { label: "Morning", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "1": { label: "Afternoon", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  "2": { label: "Night", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

export default function RosterGrid({ employees, initialShifts, weekDates }: RosterGridProps) {
  const [shifts, setShifts] = useState<AssignedShift[]>(initialShifts);
  const [isPending, startTransition] = useTransition();
  const [errorLog, setErrorLog] = useState<string | null>(null);

  // Quick lookup cache mapping: [employeeId_date_shiftIndex] -> Shift object
  const shiftMap = React.useMemo(() => {
    const map = new Map<string, AssignedShift>();
    shifts.forEach((s) => {
      map.set(`${s.employeeId}_${s.shiftDate}_${s.shiftIndex}`, s);
    });
    return map;
  }, [shifts]);

  const handleCellClick = async (employeeId: string, dateStr: string, shiftIndex: "0" | "1" | "2") => {
    const lookupKey = `${employeeId}_${dateStr}_${shiftIndex}`;
    const existingShift = shiftMap.get(lookupKey);

    setErrorLog(null);

    startTransition(async () => {
      if (existingShift) {
        // If shift exists, toggle sick leave or delete it
        if (!existingShift.isSickLeave) {
          // Toggle to sick leave state
          const payload = {
            employeeId,
            shiftDate: dateStr,
            shiftIndex,
            isSickLeave: true,
            notes: "Marked sick via grid dashboard override",
          };
          const res = await manualOverrideShift(payload);
          if (res.success) {
            setShifts((prev) =>
              prev.map((s) => (s.id === existingShift.id ? { ...s, isSickLeave: true, notes: payload.notes } : s))
            );
          } else {
            setErrorLog(res.error);
          }
        } else {
          // If already sick leave, wipe the override entry completely
          const res = await deleteShiftOverride({ shiftId: existingShift.id });
          if (res.success) {
            setShifts((prev) => prev.filter((s) => s.id !== existingShift.id));
          } else {
            setErrorLog(res.error);
          }
        }
      } else {
        // Create a new manual shift override
        const payload = {
          employeeId,
          shiftDate: dateStr,
          shiftIndex,
          isSickLeave: false,
          notes: "Manual placement override",
        };
        const res = await manualOverrideShift(payload);
        if (res.success) {
          const newShift: AssignedShift = {
            id: res.data.shiftId,
            employeeId,
            shiftDate: dateStr,
            shiftIndex,
            isSickLeave: false,
            notes: payload.notes,
          };
          setShifts((prev) => [...prev, newShift]);
        } else {
          setErrorLog(res.error);
        }
      }
    });
  };

  return (
    <div className="flex flex-col w-full h-full space-y-4">
      {errorLog && (
        <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
          <strong>Security / Mutation Error:</strong> {errorLog}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Employee Profiles</th>
              {weekDates.map((dateStr) => {
                const parsedDate = new Date(dateStr + "T00:00:00");
                const dayLabel = parsedDate.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = parsedDate.toLocaleDateString("en-US", { day: "numeric", month: "short" });
                return (
                  <th key={dateStr} className="px-2 py-3 font-semibold text-gray-900 text-center border-r border-gray-200 min-w-[140px]">
                    <div>{dayLabel}</div>
                    <div className="text-xs text-gray-400 font-normal">{dayNum}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900 border-r border-gray-200">
                  <div>{emp.fullName}</div>
                  <div className="text-xs text-gray-400 font-normal capitalize">{emp.role.replace("_", " ")}</div>
                </td>
                {weekDates.map((dateStr) => (
                  <td key={dateStr} className="p-1 border-r border-gray-200 alignment-stretch vertical-top">
                    <div className="flex flex-col space-y-1 h-full min-h-[90px]">
                      {(["0", "1", "2"] as const).map((shiftIndex) => {
                        const activeShift = shiftMap.get(`${emp.id}_${dateStr}_${shiftIndex}`);
                        const config = SHIFT_LABELS[shiftIndex];
                        const isActive = !!activeShift;
                        const isSick = activeShift?.isSickLeave;

                        return (
                          <button
                            key={shiftIndex}
                            disabled={isPending}
                            onClick={() => handleCellClick(emp.id, dateStr, shiftIndex)}
                            className={`w-full text-left px-2 py-1 text-xs rounded border transition-all ${
                              isActive
                                ? isSick
                                  ? "bg-rose-50 text-rose-700 border-rose-200 line-through font-medium"
                                  : `${config.bg} font-semibold shadow-sm`
                                : "bg-transparent text-gray-300 border-dashed border-gray-100 hover:border-gray-300 hover:text-gray-500"
                            }`}
                            title={activeShift?.notes || `Click to assign ${config.label} shift`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{config.label}</span>
                              {isActive && (
                                <span className="text-[10px] uppercase tracking-wider font-bold">
                                  {isSick ? "Sick" : "Live"}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}