"use client";

import React, { useEffect, useState } from "react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        // Strict match check: ensures it only logs in if it says exactly "true"
        const hasSessionKey = localStorage.getItem("isLoggedIn") === "true";
        setIsLoggedIn(hasSessionKey);
      }
    };

    checkAuth();
    
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 w-full px-6 py-4 shadow-sm flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-black tracking-wider text-sm shadow-sm">
          Ω
        </div>
        <span className="font-bold text-slate-800 tracking-tight text-lg">
          Slotify 
          <span className="text-slate-300 font-light mx-1.5">|</span> 
          <span className="font-normal text-slate-500 text-sm tracking-normal">Enterprise Shift Auditor</span>
        </span>
      </div>

      <nav className="flex items-center space-x-1">
        {mounted && isLoggedIn && (
          <>
            <a href="/dashboard" className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">Dashboard</a>
            <a href="/dashboard/roster" className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">Roster</a>
            <a href="/dashboard/employees" className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">Employees</a>
            <a href="/schedule/logout" className="ml-2 px-3 py-1.5 text-sm font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors">Sign out</a>
          </>
        )}
      </nav>
    </header>
  );
}