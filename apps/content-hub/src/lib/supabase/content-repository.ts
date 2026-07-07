// @ts-nocheck — supabase untyped client for custom tables
import type { Content, ContentInsert, ContentUpdate, SearchResult, ContentStatus } from "@/types/content";
import { createServerClient } from "@/lib/supabase/client";

export function getSupabase() {
  return createServerClient();
}

export async function getContents(status?: ContentStatus): Promise<Content[]> {
  const sb = getSupabase();
  const { data } = await sb.from("contents").select("*").order("created_at", { ascending: false });
  if (status) {
    const r = await sb.from("contents").select("*").eq("status", status).order("created_at", { ascending: false });
    return r.data ?? [];
  }
  return data ?? [];
}

export async function createContent(insert: ContentInsert): Promise<Content> {
  const sb = getSupabase();
  const { data, error } = await sb.from("contents").insert(insert).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateContent(id: string, update: ContentUpdate): Promise<Content> {
  const sb = getSupabase();
  const { data, error } = await sb.from("contents").update(update).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function searchContents(queryText: string, limit = 20): Promise<SearchResult[]> {
  const sb = getSupabase();
  const { data } = await sb.rpc("search_contents", { query_text: queryText, match_limit: limit });
  return data ?? [];
}

export async function approveContent(id: string): Promise<Content> {
  return updateContent(id, { status: "approved" });
}

export async function rejectContent(id: string): Promise<Content> {
  return updateContent(id, { status: "rejected" });
}
