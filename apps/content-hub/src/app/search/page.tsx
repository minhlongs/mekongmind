"use client";

import { useEffect, useState } from "react";
import type { SearchResult } from "@/types/content";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setSearching(false);
  }

  useEffect(() => { handleSearch(new Event("submit") as unknown as React.FormEvent); }, []);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Semantic Search Vault</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm bằng từ khóa hoặc ngữ nghĩa..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? "Đang tìm..." : "Search"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {results.length === 0 ? (
          <p className="text-gray-500">Không tìm thấy kết quả.</p>
        ) : (
          results.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">{r.title}</h3>
                <span className="text-xs text-gray-500">{(r.similarity * 100).toFixed(1)}% match</span>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{r.ai_content ?? r.original_content}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">{r.department}</span>
                {r.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">{tag}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
