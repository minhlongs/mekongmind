// @ts-nocheck
import { createServerClient } from "@/lib/supabase/client";

// @ts-nocheck
async function AnalyticsContent() {
  const supabase = createServerClient();
  const { data } = await supabase.from("contents").select("status, department, created_at, tags, title, id");
  const all = data ?? [];

  const summary = {
    total: all.length,
    pending: all.filter((c) => c.status === "pending").length,
    approved: all.filter((c) => c.status === "approved").length,
    rejected: all.filter((c) => c.status === "rejected").length,
  };

  const byDept: Record<string, { total: number; pending: number; approved: number; rejected: number }> = {};
  all.forEach((c) => {
    if (!byDept[c.department]) byDept[c.department] = { total: 0, pending: 0, approved: 0, rejected: 0 };
    byDept[c.department].total++;
    byDept[c.department][c.status]++;
  });

  const enriched = all.filter((c) => c.ai_content?.length).length;
  const enrichmentRate = summary.total > 0 ? Math.round((enriched / summary.total) * 100) : 0;

  const tagCounts: Record<string, number> = {};
  all.forEach((c) => (c.tags ?? []).forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const tagCloud = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

  return {
    summary, byDept, enrichmentRate, tagCloud, totalContents: all.length,
  };
}

export default async function AnalyticsPage() {
  const data = await AnalyticsContent();
  const { summary, byDept, enrichmentRate, tagCloud } = data;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng bài viết", value: summary.total, color: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "Đang chờ duyệt", value: summary.pending, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
          { label: "Đã duyệt", value: summary.approved, color: "bg-green-50 text-green-700 border-green-200" },
          { label: "Từ chối", value: summary.rejected, color: "bg-red-50 text-red-700 border-red-200" },
        ].map((card) => (
          <div key={card.label} className={`p-4 rounded-lg border ${card.color}`}>
            <p className="text-sm opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Enrichment rate */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">Tỷ lệ AI Enrichment</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${enrichmentRate}%` }} />
        </div>
        <p className="text-sm text-gray-600 mt-2">{enrichmentRate}% bài viết đã được AI xử lý</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* By Department */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Theo Phòng Ban</h2>
          {Object.keys(byDept).length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byDept).map(([dept, counts]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="font-medium">{dept}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-yellow-50 text-yellow-700">{counts.pending} pending</span>
                    <span className="px-2 py-1 rounded bg-green-50 text-green-700">{counts.approved} approved</span>
                    <span className="px-2 py-1 rounded bg-red-50 text-red-700">{counts.rejected} rejected</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tag Cloud */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Tag Cloud</h2>
          {tagCloud.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có tags</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagCloud.map(([tag, count]) => {
                const size = Math.min(1.5, 0.7 + count * 0.15);
                return (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full"
                    style={{ fontSize: `${size}rem` }}
                  >
                    {tag} <span className="text-blue-400 text-xs">({count})</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
