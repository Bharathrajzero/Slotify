// src/app/dashboard/employees/EmployeeForm.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createEmployee } from "@/app/actions/employees";

export default function EmployeeForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({
    fullName: "", email: "", role: "junior_staff", maxHoursPerWeek: 40, hourlyRate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await createEmployee({
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        maxHoursPerWeek: Number(form.maxHoursPerWeek),
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      });
      if (res.success) {
        setMessage({ text: "Employee added successfully.", ok: true });
        setForm({ fullName: "", email: "", role: "junior_staff", maxHoursPerWeek: 40, hourlyRate: "" });
      } else {
        setMessage({ text: res.error, ok: false });
      }
    });
  };

  const field = "w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Add New Employee</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
          <input required className={field} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
          <input type="email" required className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
          <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="junior_staff">Junior Staff</option>
            <option value="senior_staff">Senior Staff</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Max Hours/Week</label>
          <input type="number" min={1} max={168} required className={field} value={form.maxHoursPerWeek} onChange={(e) => setForm({ ...form, maxHoursPerWeek: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Hourly Rate (optional)</label>
          <input type="number" min={0} step="0.01" className={field} value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
        </div>
      </div>
      {message && (
        <p className={`text-xs px-3 py-2 rounded border ${message.ok ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={isPending} className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
        {isPending ? "Adding..." : "Add Employee"}
      </button>
    </form>
  );
}
