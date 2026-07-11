import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  await signOut();
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";
  return NextResponse.redirect(new URL("/", base));
}
