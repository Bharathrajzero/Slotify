// src/app/dashboard/employees/[id]/ToggleActiveButton.tsx
"use client";

import React, { useTransition } from "react";
import { toggleEmployeeActive } from "@/app/actions/employees";

export default function ToggleActiveButton({ employeeId, isActive }: { employeeId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleEmployeeActive(employeeId, !isActive);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-4 py-2 text-xs font-semibold rounded-md text-white transition-all ${
        isActive
          ? "bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300"
          : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
      }`}
    >
      {isPending ? "Updating..." : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
