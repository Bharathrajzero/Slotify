import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-x-hidden">
      
      {/* 🚀 Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 sm:px-6 py-20 lg:py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            CP-SAT Constraint Satisfaction Core
          </div>

          {/* Core Value Proposition */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 sm:leading-tight">
            Automated Shifts. <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Zero Conflict Scheduling.
            </span>
          </h1>

          {/* Subheading Description */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Slotify couples linear programming matrices with Next.js architecture to generate mathematically perfect rosters while entirely respecting employee blackouts and operational demands.
          </p>

          {/* Dynamic Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/schedule/login"
              className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              Get Started Instantly
              <span className="group-hover:translate-x-1 transition-transform duration-200 text-base">→</span>
            </Link>
            
            <a
              href="https://github.com/bharathrajzero"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* 🛠️ Deep Feature Highlights Grid */}
      <section className="border-t border-slate-200 bg-white py-20 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Built for Complex Operations
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Handling labor laws, employee availability, and resource matching effortlessly in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Item 1 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
              <div className="h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-mono font-black text-xl mb-6 shadow-md shadow-blue-200 group-hover:scale-110 transition-transform duration-200">
                ∑
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">CP-SAT Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Evaluates millions of shift patterns in seconds. Generates resource distributions that meet targets without breaking logic bounds.
              </p>
            </div>

            {/* Feature Item 2 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
              <div className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl mb-6 shadow-md shadow-indigo-200 group-hover:scale-110 transition-transform duration-200">
                🛡️
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Dynamic Hard Rules</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enforces night-to-morning rest intervals, maximum weekly runtime hours, and mandatory senior supervisor ratios automatically.
              </p>
            </div>

            {/* Feature Item 3 */}
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
              <div className="h-12 w-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xl mb-6 shadow-md shadow-emerald-200 group-hover:scale-110 transition-transform duration-200">
                🔐
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Role-Based Insulation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Managers control full layout matrices, override parameters, and view analytics. Workers receive secure, isolated dashboards tailored for mobile devices.
              </p>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}