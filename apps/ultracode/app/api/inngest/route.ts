import { serve } from "inngest/next";
import { inngestClient } from "@/forest/inngest/client";
import { reviewJob } from "@/forest/inngest/review-job";

const handler = serve({ client: inngestClient, functions: [reviewJob] });

export const { GET, POST } = handler;
