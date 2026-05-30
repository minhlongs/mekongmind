import z from "zod"

export namespace ToolResult {
  export const Schema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    retryable: z.boolean().default(false),
    metadata: z.record(z.string(), z.any()).optional(),
  })

  export type Info = z.infer<typeof Schema>

  /**
   * Create a success envelope.
   */
  export function ok(data: unknown, metadata?: Record<string, unknown>): Info {
    return { success: true, data, retryable: false, metadata }
  }

  /**
   * Create a failure envelope with retryability hint.
   * @param retryable - true when the LLM should fix input and retry
   */
  export function fail(error: string, retryable = false, metadata?: Record<string, unknown>): Info {
    return { success: false, error, retryable, metadata }
  }

  /**
   * Convert legacy tool output `{title, output, metadata}` into a structured envelope.
   * Keeps backward compatibility — existing execute() return values are unchanged.
   */
  export function wrap(output: { title: string; output: string; metadata?: Record<string, unknown> }): Info {
    return ok(output.output, { title: output.title, ...output.metadata })
  }

  /**
   * Format a result for LLM consumption.
   * - Success: returns the raw data string (identical to current behavior)
   * - Failure: returns actionable error with retryable hint when applicable
   */
  export function format(result: Info): string {
    if (result.success) {
      return typeof result.data === "string" ? result.data : JSON.stringify(result.data)
    }
    const retry = result.retryable ? " (retryable — fix the input and try again)" : ""
    return `Error: ${result.error}${retry}`
  }

  /**
   * Determine if an error message represents a retryable condition.
   * Permission/denial errors are NOT retryable; all others are.
   */
  export function isRetryable(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error)
    const lower = message.toLowerCase()
    return !lower.includes("permission") && !lower.includes("denied") && !lower.includes("rejected")
  }

  /**
   * Build a formatted error string for LLM consumption from a raw error.
   * Adds the retryable hint so the model knows whether to self-correct.
   */
  export function formatError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error)
    const retryable = isRetryable(error)
    return format(fail(message, retryable))
  }
}
