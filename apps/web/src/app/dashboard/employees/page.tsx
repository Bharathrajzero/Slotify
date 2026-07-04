// src/app/dashboard/employees/page.tsx
import React from "react";
import Link from "next/link";
import { db, initDb } from "@/lib/db/client";
import EmployeeForm from "./EmployeeForm";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  await initDb();
  const res = await db.execute(
    "SELECT id, full_name, email, role, max_hours_per_week, is_active FROM employees ORDER BY full_name"
  );

  const employees = res.rows.map((e) => ({
    id: e.id as string,
    fullName: e.full_name as string,
    email: e.email as string,
    role: e.role as string,
    maxHoursPerWeek: e.max_hours_per_week as number,
    isActive: Boolean(e.is_active),
  }));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Employee Management</h1>
        <p className="text-sm text-gray-500">Add employees and manage their profiles.</p>
      </div>

      <EmployeeForm />

      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Max Hrs/Wk</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Schedule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{emp.fullName}</td>
                <td className="px-4 py-3 text-gray-500">{emp.email}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{emp.role.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-gray-600">{emp.maxHoursPerWeek}h</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {emp.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/employees/${emp.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                    Manage →
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <a href={`/schedule/${emp.id}`} target="_blank" className="text-emerald-600 hover:underline text-xs font-medium">
                    📅 View →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
