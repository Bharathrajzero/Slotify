// apps/web/src/app/layout.tsx
import React from "react";
import Navbar from "@/app/Navbar"; // Adjust this import path based on your folder structure
import "./globals.css";

export const metadata = {
  title: "Slotify",
  description: "Enterprise Shift-Scheduler & Conflict Resolver",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="min-h-screen">
      <body className="min-h-screen flex flex-col font-sans text-slate-900 antialiased bg-slate-50">
        <Navbar />

        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>

        <footer className="w-full border-t border-slate-200 bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs">
                Ω
              </div>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">CP-SAT Optimization Engine</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Built with Next.js 15 · OR-Tools · SQLite</span>
              <span className="text-slate-300">|</span>
              <a
                href="https://github.com/bharathrajzero"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors font-medium"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                bharathrajzero
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="font-semibold text-slate-600">Built by Bharath Raj</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}