// src/app/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { db, initDb } from "@/lib/db/client";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "scheduler_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function loginWithEmail(formData: FormData) {
  await initDb();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const res = await db.execute({
    sql: "SELECT id, full_name, role FROM employees WHERE LOWER(email) = ? AND is_active = 1",
    args: [email],
  });

  if (!res.rows.length) return { error: "No active employee found with that email." };

  const emp = res.rows[0];
  const payload = Buffer.from(JSON.stringify({ id: emp.id, role: emp.role })).toString("base64");

  cookies().set(SESSION_COOKIE, payload, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  if (emp.role === "manager") {
    redirect("/dashboard");
  } else {
    redirect(`/schedule/${emp.id}`);
  }
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/schedule/login");
}

export async function getSession(): Promise<{ id: string; role: string } | null> {
  try {
    const cookie = cookies().get(SESSION_COOKIE)?.value;
    if (!cookie) return null;
    return JSON.parse(Buffer.from(cookie, "base64").toString("utf8"));
  } catch {
    return null;
  }
}
