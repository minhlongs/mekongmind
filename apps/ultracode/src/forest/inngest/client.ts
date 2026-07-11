import { Inngest } from "inngest";
import { logger } from "@/lib/logger";

const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY;

if (!INNGEST_EVENT_KEY) {
  logger.warn(
    "inngest: INNGEST_EVENT_KEY is not set. Inngest Create will not register this app.",
  );
}

export const inngestClient = INNGEST_EVENT_KEY
  ? new Inngest({ id: "ultracode-review", eventKey: INNGEST_EVENT_KEY, logger })
  : new Inngest({ id: "ultracode-review", logger });
