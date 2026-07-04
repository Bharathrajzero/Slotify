// src/app/schedule/logout/route.ts
import { logout } from "@/app/actions/auth";

export async function GET() {
  await logout();
}
