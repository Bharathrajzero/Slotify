// src/app/dashboard/page.tsx
import React from "react";
import Link from "next/link";
import { db, initDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await initDb();

  const [empRes, jobRes, shiftRes] = await Promise.all([
    db.execute("SELECT COUNT(*) as count FROM employees WHERE is_active = 1"),
    db.execute("SELECT COUNT(*) as count FROM schedule_jobs WHERE status = 'pending' OR status = 'processing'"),
    db.execute("SELECT COUNT(*) as count FROM assigned_shifts WHERE shift_date >= date('now')"),
  ]);

  const stats = [
    { label: "Active Employees", value: empRes.rows[0].count as number, href: "/dashboard/employees" },
    { label: "Jobs In Queue", value: jobRes.rows[0].count as number, href: "/dashboard/roster" },
    { label: "Upcoming Shifts", value: shiftRes.rows[0].count as number, href: "/dashboard/roster" },
  ];

  const navCards = [
    { title: "Roster Grid", description: "View and manually override the weekly shift schedule.", href: "/dashboard/roster", color: "bg-blue-600" },
    { title: "Employees", description: "Add employees, set roles, manage constraints and availability.", href: "/dashboard/employees", color: "bg-emerald-600" },
  ];

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500">Enterprise Shift-Scheduler — Local Dev Mode</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-black text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {navCards.map((card) => (
          <Link key={card.href} href={card.href} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className={`h-8 w-8 ${card.color} rounded flex items-center justify-center text-white font-black text-sm mb-3`}>→</div>
            <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{card.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
