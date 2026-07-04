// src/app/schedule/login/page.tsx
import React from "react";
import { loginWithEmail } from "@/app/actions/auth";

export default function ScheduleLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm">
            Ω
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">View Your Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your work email to see your shifts</p>
        </div>

        <form action={loginWithEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Work Email</label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="you@company.com"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {searchParams.error && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">
              {searchParams.error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2 text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View My Schedule →
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Managers are redirected to the dashboard automatically.
        </p>
      </div>
    </div>
  );
}
