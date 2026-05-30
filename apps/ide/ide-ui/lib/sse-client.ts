// SSE client with exponential backoff reconnect.
// EventSource doesn't support headers — token goes in URL query.

import { getToken } from "./auth";

export interface StreamHandlers {
  onMessage: (event: MessageEvent) => void;
  onError?: (err: Event) => void;
  onOpen?: () => void;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.mekong.dev"
  ).replace(/\/$/, "");
}

export class MissionStream {
  private es: EventSource | null = null;
  private retries = 0;
  private closed = false;

  constructor(private missionId: string, private handlers: StreamHandlers) {}

  start(): void {
    if (this.closed) return;
    const token = getToken();
    if (!token) throw new Error("unauthenticated");
    const url = `${apiBase()}/v1/missions/${this.missionId}/stream?token=${encodeURIComponent(
      token
    )}`;

    this.es = new EventSource(url);
    this.es.onopen = () => {
      this.retries = 0;
      this.handlers.onOpen?.();
    };
    this.es.onmessage = (e) => this.handlers.onMessage(e);
    this.es.onerror = (e) => {
      this.handlers.onError?.(e);
      this.es?.close();
      this.es = null;
      if (this.retries < MAX_RETRIES && !this.closed) {
        const delay = BASE_DELAY_MS * Math.pow(2, this.retries);
        this.retries += 1;
        setTimeout(() => this.start(), delay);
      }
    };
  }

  close(): void {
    this.closed = true;
    this.es?.close();
    this.es = null;
  }
}
