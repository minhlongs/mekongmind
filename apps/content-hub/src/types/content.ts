export type ContentStatus = "pending" | "approved" | "rejected";

export interface Content {
  id: string;
  title: string;
  original_content: string;
  ai_content: string | null;
  status: ContentStatus;
  tags: string[];
  department: string;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface ContentInsert {
  title: string;
  original_content: string;
  department: string;
  status?: ContentStatus;
}

export interface ContentUpdate {
  status?: ContentStatus;
  ai_content?: string | null;
  tags?: string[];
  embedding?: number[];
  updated_at?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  original_content: string;
  ai_content: string | null;
  status: ContentStatus;
  tags: string[];
  department: string;
  created_at: string;
  similarity: number;
}
