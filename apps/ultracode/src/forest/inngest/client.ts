import { Inngest } from "inngest";
import { logger } from "@/lib/logger";

const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY;

if (!INNGEST_EVENT_KEY) {
  logger.warn(
    "inngest: INNGEST_EVENT_KEY is not set. Inngest client is disabled — reviews will not be processed.",
  );
}

/**
 * Inngest client singleton.
 *
 * - With `INNGEST_EVENT_KEY`: full client that registers the app and sends events.
 * - Without: `undefined` — all callers must guard (`if (inngestClient)`).
 */
export const inngestClient: Inngest | undefined = INNGEST_EVENT_KEY
  ? new Inngest({ id: "ultracode-review", eventKey: INNGEST_EVENT_KEY, logger })
  : undefined;
