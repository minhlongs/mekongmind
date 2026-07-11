import { logger } from "@/lib/logger";

type LLMProvider = "anthropic" | "openrouter";

interface StreamReviewOptions {
  code: string;
  language: string;
  provider?: LLMProvider;
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const REVIEW_PROMPT = (code: string, language: string) =>
  `You are a senior code reviewer. Analyze the following ${language ?? "code"} and return findings as a valid JSON array only.

Code:
${code.slice(0, 8000)}

For each finding provide exactly: severity ("critical"|"warning"|"info"), category ("bug"|"security"|"performance"|"style"|"best-practice"), title (max 60 chars), description, file_path (or "unknown"), line_start (number|null), line_end (number|null), suggestion (how to fix).

Return ONLY a valid JSON array. No markdown fences, no commentary.`;

function baseProviders(preferred?: LLMProvider): LLMProvider[] {
  const ordered: LLMProvider[] = ["anthropic", "openrouter"];
  const hasKey = (p: LLMProvider) =>
    p === "anthropic" ? Boolean(process.env.ANTHROPIC_API_KEY) : Boolean(process.env.OPENROUTER_API_KEY);
  const available = ordered.filter(hasKey);
  if (!available.length) return [];
  if (preferred && hasKey(preferred) && preferred !== available[0]) {
    const rest = available.filter((p) => p !== preferred);
    return [preferred, ...rest];
  }
  return available;
}

async function* parseAnthropicSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
): AsyncGenerator<string> {
  let buffer = "";
  let eventType = "message_start";
  let dataLine = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const boundaries = buffer.split("\n\n");
    buffer = boundaries.pop() ?? "";
    for (const block of boundaries) {
      const lines = block.split("\n");
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
          dataLine = "";
        } else if (line.startsWith("data:")) {
          dataLine = line.slice(5).trim();
        }
      }
      if (!dataLine) continue;
      try {
        const parsed = JSON.parse(dataLine);
        if (eventType === "content_block_delta" && typeof parsed.delta?.text === "string") {
          yield parsed.delta.text;
        }
      } catch {
        // skip unparseable SSE data
      }
      dataLine = "";
    }
  }
}

async function* parseOpenRouterSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
): AsyncGenerator<string> {
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const boundaries = buffer.split("\n\n");
    buffer = boundaries.pop() ?? "";
    for (const block of boundaries) {
      const line = block.replace(/^data:\s*/, "").trim();
      if (!line || line === "[DONE]") continue;
      try {
        const parsed = JSON.parse(line);
        const token = parsed.choices?.[0]?.delta?.content;
        if (typeof token === "string") yield token;
      } catch {
        // skip
      }
    }
  }
}

export class LLMClient {
  private anthropicKey: string | undefined;
  private openrouterKey: string | undefined;

  constructor() {
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
    this.openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!this.anthropicKey && !this.openrouterKey) {
      logger.warn("LLM: no API keys configured (ANTHROPIC_API_KEY / OPENROUTER_API_KEY).");
    }
  }

  async *streamReview({ code, language, provider }: StreamReviewOptions): AsyncGenerator<string, void, unknown> {
    const providers = baseProviders(provider);
    if (!providers.length) throw new Error("No LLM provider configured.");
    let lastError: Error | undefined;
    for (const p of providers) {
      try {
        if (p === "anthropic") yield* this.streamAnthropic(code, language);
        else yield* this.streamOpenRouter(code, language);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.warn(`LLM: provider ${p} failed — ${lastError.message}`);
      }
    }
    throw new Error(`All LLM providers failed. Last: ${lastError?.message}`);
  }

  private async *streamAnthropic(code: string, language: string): AsyncGenerator<string> {
    if (!this.anthropicKey) throw new Error("ANTHROPIC_API_KEY not set.");
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{ role: "user", content: REVIEW_PROMPT(code, language) }],
        stream: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "unknown error");
      throw new Error(`Anthropic ${res.status}: ${text.slice(0, 300)}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Anthropic returned empty response body.");
    const decoder = new TextDecoder();
    yield* parseAnthropicSSE(reader, decoder);
  }

  private async *streamOpenRouter(code: string, language: string): AsyncGenerator<string> {
    if (!this.openrouterKey) throw new Error("OPENROUTER_API_KEY not set.");
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openrouterKey}`,
        "HTTP-Referer": "https://ultracode.dev",
        "X-Title": "Ultracode",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{ role: "user", content: REVIEW_PROMPT(code, language) }],
        stream: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "unknown error");
      throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error("OpenRouter returned empty response body.");
    const decoder = new TextDecoder();
    yield* parseOpenRouterSSE(reader, decoder);
  }
}

export const llmClient = new LLMClient();
