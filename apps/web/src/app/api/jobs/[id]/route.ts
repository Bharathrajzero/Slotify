// src/app/api/jobs/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

// 1. Make sure your context type reflects that params is a Promise
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext // 2. Accept context as the second parameter
) {
  // 3. Await the params promise before using it
  const { id } = await context.params;

  try {
    const result = await db.execute({
      sql: "SELECT id, status, error_message, solver_wall_time_ms, completed_at FROM schedule_jobs WHERE id = ?",
      args: [id], // 4. Pass the safely awaited id here
    });

    if (!result.rows.length) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}