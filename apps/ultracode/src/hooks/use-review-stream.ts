"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type ReviewEvent =
  | { type: "status"; status: "pending" | "in_progress" | "completed" | "failed"; findingsCount: number }
  | { type: "completed"; reviewId: string; findingsCount: number }
  | { type: "error"; message: string };

type UseReviewStreamOptions = {
  onEvent?: (event: ReviewEvent) => void;
  onComplete?: (data: { findingsCount: number }) => void;
  onError?: (message: string) => void;
};

type UseReviewStreamResult = {
  connected: boolean;
  error: string | null;
  retryCount: number;
};

const MAX_BACKOFF_MS = 30_000;

export function useReviewStream(
  reviewId: string,
  options: UseReviewStreamOptions = {},
): UseReviewStreamResult {
  const { onEvent, onComplete, onError } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const sourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);
  const retryRef = useRef(0);

  const cleanup = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (closedRef.current) return;
    cleanup();

    try {
      const src = new EventSource(
        `/api/reviews/${encodeURIComponent(reviewId)}/events?stream=true`,
      );
      sourceRef.current = src;

      src.onopen = () => {
        setConnected(true);
        setError(null);
        retryRef.current = 0;
        setRetryCount(0);
      };

      src.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data) as ReviewEvent;

          if (data.type === "status") {
            onEvent?.(data);
          } else if (data.type === "completed") {
            onComplete?.({ findingsCount: data.findingsCount });
            src.close();
          } else if (data.type === "error") {
            onError?.(data.message);
            src.close();
          }
        } catch {
          // ignore unparseable SSE payloads
        }
      };

      src.onerror = () => {
        src.close();
        setConnected(false);

        if (!closedRef.current) {
          retryRef.current = Math.min(retryRef.current + 1, 6);
          // cap: 1+2+4+8+16+30 = 61s max
          setRetryCount(retryRef.current);
          const backoff = Math.min(
            2 ** (retryRef.current - 1) * 1000,
            MAX_BACKOFF_MS,
          );
          timerRef.current = setTimeout(connect, backoff);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  }, [reviewId, onEvent, onComplete, onError, cleanup]);

  useEffect(() => {
    closedRef.current = false;
    connect();

    return () => {
      closedRef.current = true;
      cleanup();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reviewId, connect, cleanup]);

  return { connected, error, retryCount };
}
