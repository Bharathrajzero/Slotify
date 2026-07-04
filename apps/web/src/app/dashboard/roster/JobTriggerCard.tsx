// src/app/dashboard/roster/JobTriggerCard.tsx
"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";

interface JobTriggerCardProps {
  weekStartDate: string;
  onJobTriggeredAction: (weekStart: string) => Promise<{ success: boolean; error?: string; jobId?: string }>;
}

type JobStatus = "pending" | "processing" | "completed" | "failed";

export default function JobTriggerCard({ weekStartDate, onJobTriggeredAction }: JobTriggerCardProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "info" | "success" | "error" } | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const pollJobStatus = (jobId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        const status: JobStatus = data.status;
        setJobStatus(status);

        if (status === "completed") {
          stopPolling();
          setMessage({ text: `Optimization complete! Solver ran in ${data.solver_wall_time_ms}ms. Refresh to see updated roster.`, type: "success" });
        } else if (status === "failed") {
          stopPolling();
          setMessage({ text: `Solver failed: ${data.error_message || "Unknown error"}`, type: "error" });
        }
      } catch {
        stopPolling();
        setMessage({ text: "Lost connection while polling job status.", type: "error" });
      }
    }, 2000);
  };

  const handleTrigger = () => {
    setMessage(null);
    setJobStatus(null);
    startTransition(async () => {
      const result = await onJobTriggeredAction(weekStartDate);
      if (result.success && result.jobId) {
        setJobStatus("pending");
        setMessage({ text: `Job queued (ID: ${result.jobId}). Waiting for solver...`, type: "info" });
        pollJobStatus(result.jobId);
      } else {
        setMessage({ text: result.error || "Failed to queue optimization job.", type: "error" });
      }
    });
  };

  const statusColor = {
    pending: "text-yellow-700 bg-yellow-50 border-yellow-200",
    processing: "text-blue-700 bg-blue-50 border-blue-200",
    completed: "text-emerald-700 bg-emerald-50 border-emerald-200",
    failed: "text-rose-700 bg-rose-50 border-rose-200",
  };

  const messageColor = {
    info: "text-blue-800 bg-blue-50 border-blue-200",
    success: "text-emerald-800 bg-emerald-50 border-emerald-200",
    error: "text-rose-800 bg-rose-50 border-rose-200",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">CP-SAT Optimization Engine</h3>
          <p className="text-xs text-slate-500">
            Triggers the background Python solver for week beginning{" "}
            <span className="font-semibold text-slate-700">{weekStartDate}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {jobStatus && (
            <span className={`px-2 py-1 text-xs font-semibold rounded border capitalize ${statusColor[jobStatus]}`}>
              {jobStatus === "processing" ? "⏳ Processing..." : jobStatus}
            </span>
          )}
          <button
            onClick={handleTrigger}
            disabled={isPending || jobStatus === "pending" || jobStatus === "processing"}
            className={`px-4 py-2 text-xs font-semibold rounded-md shadow-sm text-white transition-all ${
              isPending || jobStatus === "pending" || jobStatus === "processing"
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {isPending ? "Queuing..." : "Run Optimization Solver"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 text-xs border rounded-md ${messageColor[message.type]}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
