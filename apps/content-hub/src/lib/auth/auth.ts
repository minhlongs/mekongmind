// Auth configuration — using Supabase Auth (not better-auth)
// Supabase handles sessions via cookies automatically
// This file is kept as a re-export point for auth helpers
export { createServerClient } from "@/lib/supabase/client";
