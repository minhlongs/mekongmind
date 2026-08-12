"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
 sprintId: string;
 taskId: string;
};

export default function UnassignSprint({ sprintId, taskId }: Props) {
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 async function handleUnassign(e: React.MouseEvent) {
 e.stopPropagation();
 e.preventDefault();
 setLoading(true);
 try {
 await fetch(`/api/sprints/${sprintId}/tasks/${taskId}`, {
 method: "DELETE",
 });
 router.refresh();
 } catch {
 // silent
 } finally {
 setLoading(false);
 }
 }

 return (
 <button
 type="button"
 onClick={handleUnassign}
 disabled={loading}
 className="rounded p-0.5 text-xs text-[#787880] hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-40"
 aria-label="Unassign from sprint"
 title="Unassign"
 >
 {loading ? "…" : "✕"}
 </button>
 );
}
