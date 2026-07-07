"use client";

import { useEffect, useState } from "react";
import type { Content, ContentStatus } from "@/types/content";

type ContentWithActions = Content & { onApprove: (id: string) => void; onReject: (id: string) => void };

function StatusBadge({ status }: { status: ContentStatus }) {
  const colors: Record<ContentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
}

function ContentCard({ item }: { item: ContentWithActions }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{item.department} • {new Date(item.created_at).toLocaleString("vi-VN")}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Original</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">{item.original_content}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">AI Content</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">
            {item.ai_content ?? <em className="text-gray-400">Đang chờ AI xử lý...</em>}
          </p>
        </div>
      </div>

      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{tag}</span>
          ))}
        </div>
      )}

      {item.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => item.onApprove(item.id)}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Duyệt
          </button>
          <button
            onClick={() => item.onReject(item.id)}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Từ chối
          </button>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [items, setItems] = useState<Content[]>([]);
  const [filter, setFilter] = useState<ContentStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/contents${filter !== "all" ? `?status=${filter}` : ""}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function handleApprove(id: string) {
    await fetch(`/api/contents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" })
    });
    load();
  }

  async function handleReject(id: string) {
    await fetch(`/api/contents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" })
    });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Audit Nội Dung</h1>

      <div className="mb-4 flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded text-sm ${filter === s ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            {s === "all" ? "Tất cả" : s}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Không có bài viết nào.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ContentCard key={item.id} item={{ ...item, onApprove: handleApprove, onReject: handleReject }} />
          ))}
        </div>
      )}
    </div>
  );
}
