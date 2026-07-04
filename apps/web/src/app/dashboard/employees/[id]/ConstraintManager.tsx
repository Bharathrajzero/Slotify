// src/app/dashboard/employees/[id]/ConstraintManager.tsx
"use client";

import React, { useState, useTransition } from "react";
import { upsertConstraint } from "@/app/actions/employees";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ConstraintManager({ employeeId }: { employeeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({
    dayOfWeek: 0,
    shiftIndex: "0" as "0" | "1" | "2",
    isHardConstraint: true,
    preferenceWeight: 0,
    reason: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await upsertConstraint({ ...form, employeeId });
      setMessage(res.success
        ? { text: "Constraint saved.", ok: true }
        : { text: res.error, ok: false }
      );
    });
  };

  const field = "w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-gray-100">
      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Add / Update Constraint</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Day</label>
          <select className={field} value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}>
            {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Shift</label>
          <select className={field} value={form.shiftIndex} onChange={(e) => setForm({ ...form, shiftIndex: e.target.value as "0" | "1" | "2" })}>
            <option value="0">Morning</option>
            <option value="1">Afternoon</option>
            <option value="2">Night</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
          <select className={field} value={form.isHardConstraint ? "hard" : "soft"} onChange={(e) => setForm({ ...form, isHardConstraint: e.target.value === "hard" })}>
            <option value="hard">Hard (Blackout)</option>
            <option value="soft">Soft (Preference)</option>
          </select>
        </div>
        {!form.isHardConstraint && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Weight (-10 to 10)</label>
            <input type="number" min={-10} max={10} className={field} value={form.preferenceWeight} onChange={(e) => setForm({ ...form, preferenceWeight: Number(e.target.value) })} />
          </div>
        )}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">Reason (optional)</label>
          <input className={field} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Childcare commitment" />
        </div>
      </div>
      {message && (
        <p className={`text-xs px-3 py-2 rounded border ${message.ok ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={isPending} className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
        {isPending ? "Saving..." : "Save Constraint"}
      </button>
    </form>
  );
}
