"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-gray-900">Mekong Content Hub</h1>
        <p className="text-xl text-gray-600">AI-Powered Content Management Platform</p>

        <div className="flex gap-4 justify-center mt-8">
          <Link href="/submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Submit Content
          </Link>
          <Link href="/audit" className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-medium">
            Audit
          </Link>
          <Link href="/search" className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-medium">
            Search
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Submit → AI Enrichment → Manager Approval → Auto-Tag → Semantic Search
        </p>
      </div>
    </div>
  );
}
