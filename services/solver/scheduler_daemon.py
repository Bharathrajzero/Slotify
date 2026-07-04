"""
scheduler_daemon.py
Polls the local SQLite schedule_jobs table, runs the CP-SAT solver, and writes results back.
"""
from __future__ import annotations

import os
import time
import sys
import sqlite3
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from csp_solver import solve_schedule, to_postgres_bulk_payload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(process)d --- [%(name)s] : %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("scheduler_daemon")

# Resolve DB path relative to the web app root (two levels up from services/solver)
DB_PATH = Path(__file__).resolve().parents[2] / "apps" / "web" / "local.db"
POLL_INTERVAL_SECONDS = 5


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def fetch_and_lock_next_job() -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM schedule_jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1"
        ).fetchone()
        if not row:
            return None
        job = dict(row)
        updated = conn.execute(
            """UPDATE schedule_jobs SET status = 'processing', started_at = ?
               WHERE id = ? AND status = 'pending'""",
            (datetime.now(timezone.utc).isoformat(), job["id"])
        ).rowcount
        if updated == 0:
            return None
        logger.info(f"Acquired lock for Job ID: {job['id']}")
        return job


def write_job_failure(job_id: str, error_msg: str) -> None:
    with get_conn() as conn:
        conn.execute(
            """UPDATE schedule_jobs SET status = 'failed', error_message = ?, completed_at = ?
               WHERE id = ?""",
            (error_msg, datetime.now(timezone.utc).isoformat(), job_id)
        )
    logger.warning(f"Job {job_id} failed: {error_msg}")


def write_job_success(job_id: str, solver_output: dict, shift_rows: list[dict]) -> None:
    with get_conn() as conn:
        if shift_rows:
            conn.executemany(
                """INSERT INTO assigned_shifts
                     (id, employee_id, job_id, shift_date, shift_index, is_sick_leave, is_manual_override)
                   VALUES (lower(hex(randomblob(16))), :employee_id, :job_id, :shift_date, :shift_index, :is_sick_leave, 0)
                   ON CONFLICT(employee_id, shift_date, shift_index) DO NOTHING""",
                shift_rows
            )
        conn.execute(
            """UPDATE schedule_jobs
               SET status = 'completed', result_payload = ?, solver_wall_time_ms = ?, completed_at = ?
               WHERE id = ?""",
            (json.dumps(solver_output), solver_output.get("wall_time_ms", 0),
             datetime.now(timezone.utc).isoformat(), job_id)
        )
    logger.info(f"Job {job_id} completed successfully.")


def execute_worker_loop() -> None:
    if not DB_PATH.exists():
        logger.critical(f"Database not found at {DB_PATH}. Start the Next.js app first to initialize it.")
        sys.exit(1)

    logger.info(f"Daemon listening for jobs on {DB_PATH} ...")
    while True:
        job = fetch_and_lock_next_job()
        if not job:
            time.sleep(POLL_INTERVAL_SECONDS)
            continue

        job_id = job["id"]
        week_start_date = job["week_start_date"]
        input_payload = json.loads(job["input_payload"])

        logger.info(f"Running solver for Job: {job_id} (week: {week_start_date})")
        try:
            solver_result = solve_schedule(input_payload, max_solve_seconds=60.0)
            status_name = solver_result.get("status")

            if status_name in ("OPTIMAL", "FEASIBLE"):
                bulk_shifts = to_postgres_bulk_payload(solver_result, job_id=job_id, week_start_date=week_start_date)
                write_job_success(job_id, solver_result, bulk_shifts)
            else:
                reason = f"Solver returned: {status_name}"
                if "unmet_requirements" in solver_result:
                    reason += f" | {solver_result['unmet_requirements']}"
                write_job_failure(job_id, reason)
        except Exception as err:
            logger.error(f"Crash on job {job_id}: {err}")
            write_job_failure(job_id, f"Runtime exception: {str(err)}")

        time.sleep(1)


if __name__ == "__main__":
    try:
        execute_worker_loop()
    except KeyboardInterrupt:
        logger.info("Daemon stopped.")
        sys.exit(0)
