"use client";

import { useEffect, useState } from "react";
import { createServerClient } from "@/lib/supabase/client";

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createServerClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) setUserId(data.user.id);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (!userId) {
      setMessage({ type: "error", text: "Vui lòng đăng nhập." });
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        original_content: content,
        department: department || "general",
        author_id: userId,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage({ type: "success", text: "Đã submit bài viết thành công! AI sẽ tự động xử lý." });
      setTitle("");
      setContent("");
    } else {
      setMessage({ type: "error", text: data.error ?? "Submit failed" });
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Submit Nội Dung</h1>

      {message && (
        <div className={`p-4 rounded mb-4 ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tiêu đề bài viết..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Chọn phòng ban —</option>
            <option value="marketing">Marketing</option>
            <option value="engineering">Engineering</option>
            <option value="sales">Sales</option>
            <option value="hr">HR</option>
            <option value="finance">Finance</option>
            <option value="general">General</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung gốc</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập nội dung bài viết..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Đang submit..." : "Submit Bài Viết"}
        </button>
      </form>
    </div>
  );
}
