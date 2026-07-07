"use client";

import { useEffect, useState } from "react";
import { createServerClient } from "@/lib/supabase/client";

export default function RealtimePage() {
  const [events, setEvents] = useState<Array<{ type: string; data: Record<string, unknown>; time: string }>>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createServerClient();

    const channel = supabase
      .channel("content-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "contents" }, (payload) => {
        setEvents((prev) => [
          { type: payload.eventType, data: payload.new || payload.old, time: new Date().toLocaleTimeString("vi-VN") },
          ...prev.slice(0, 49),
        ]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, (payload) => {
        setEvents((prev) => [
          { type: `audit:${payload.eventType}`, data: payload.new || payload.old, time: new Date().toLocaleTimeString("vi-VN") },
          ...prev.slice(0, 49),
        ]);
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const eventColors: Record<string, string> = {
    INSERT: "bg-blue-50 border-blue-200",
    UPDATE: "bg-yellow-50 border-yellow-200",
    DELETE: "bg-red-50 border-red-200",
    approve: "bg-green-50 border-green-200",
    reject: "bg-red-50 border-red-200",
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Real-time Feed</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${connected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Waiting for changes... Submit, approve, or reject content to see live events.</p>
      ) : (
        <div className="space-y-2">
          {events.map((evt, i) => (
            <div key={`${evt.time}-${i}`} className={`p-3 rounded border text-sm ${eventColors[evt.type] || "bg-gray-50 border-gray-200"}`}>
              <div className="flex justify-between">
                <span className="font-medium">{evt.type}</span>
                <span className="text-gray-500">{evt.time}</span>
              </div>
              <pre className="mt-1 text-xs text-gray-600 overflow-auto">{JSON.stringify(evt.data, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
