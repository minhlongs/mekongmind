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

// GET /api/analytics — dashboard stats
export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");

    // Total counts by status
    let countQuery = supabase.from("contents").select("status", { count: "exact", head: false });
    if (department) countQuery = countQuery.eq("department", department);

    const { data: allContents } = await supabase.from("contents").select("*");
    const all = allContents ?? [];

    const stats = {
      total: all.length,
      pending: all.filter((c) => c.status === "pending").length,
      approved: all.filter((c) => c.status === "approved").length,
      rejected: all.filter((c) => c.status === "rejected").length,
      byDepartment: {} as Record<string, number>,
      recentActivity: all
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          department: c.department,
          created_at: c.created_at,
        })),
    };

    all.forEach((c) => {
      stats.byDepartment[c.department] = (stats.byDepartment[c.department] || 0) + 1;
    });

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
