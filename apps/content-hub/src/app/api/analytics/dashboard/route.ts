// @ts-nocheck
import { createServerClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cached: ReturnType<typeof createServerClient> | null = null;
function getSupabase() {
  if (!cached) cached = createServerClient();
  return cached;
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: contents } = await supabase.from("contents").select("status, department, created_at, tags, title, id");

    const all = contents ?? [];
    const total = all.length;
    const pending = all.filter((c) => c.status === "pending").length;
    const approved = all.filter((c) => c.status === "approved").length;
    const rejected = all.filter((c) => c.status === "rejected").length;

    const byDept: Record<string, { total: number; pending: number; approved: number; rejected: number }> = {};
    all.forEach((c) => {
      if (!byDept[c.department]) byDept[c.department] = { total: 0, pending: 0, approved: 0, rejected: 0 };
      byDept[c.department].total++;
      byDept[c.department][c.status]++;
    });

    const daily: Record<string, number> = {};
    all.forEach((c) => {
      const day = c.created_at?.split("T")[0] ?? "";
      daily[day] = (daily[day] || 0) + 1;
    });

    const tagCounts: Record<string, number> = {};
    all.forEach((c) => {
      (c.tags ?? []).forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });
    const tagCloud = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }));

    const recent = [...all].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map((c) => ({
      id: c.id, title: c.title, status: c.status, department: c.department, created_at: c.created_at,
    }));

    const enriched = all.filter((c) => c.ai_content?.length).length;
    const enrichmentRate = total > 0 ? Math.round((enriched / total) * 100) : 0;

    return NextResponse.json({
      summary: { total, pending, approved, rejected, enrichmentRate },
      byDepartment: byDept,
      dailyTrend: daily,
      tagCloud,
      recent,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
