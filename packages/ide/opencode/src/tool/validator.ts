import z from "zod"
import { ToolResult } from "./result"
import type { Tool } from "./tool"

export namespace ToolValidator {
  /**
   * Validate tool input against a zod schema and return actionable errors.
   * Error messages are designed for LLM self-correction: they explain WHAT to fix.
   *
   * @returns `{valid: true, data}` on success, or `{valid: false, result}` with a
   *   retryable ToolResult.Info containing field-level error details.
   */
  export function validate(
    schema: z.ZodType,
    input: unknown,
  ): { valid: true; data: unknown } | { valid: false; result: ToolResult.Info } {
    const parsed = schema.safeParse(input)
    if (parsed.success) return { valid: true, data: parsed.data }

    // Zod v4: issues use z.core.$ZodIssue discriminated union
    const issues = parsed.error.issues.map((issue) => {
      const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "(root)"

      if (issue.code === "invalid_type") {
        // z.core.$ZodIssueInvalidType: has `expected` field
        const typed = issue as z.core.$ZodIssueInvalidType
        return `  ${fieldPath}: expected ${typed.expected}, got ${typeof input}`
      }

      if (issue.code === "too_small") {
        // z.core.$ZodIssueTooSmall: has `minimum` field
        const typed = issue as z.core.$ZodIssueTooSmall
        return `  ${fieldPath}: value too short/small (minimum ${typed.minimum})`
      }

      if (issue.code === "too_big") {
        // z.core.$ZodIssueTooBig: has `maximum` field
        const typed = issue as z.core.$ZodIssueTooBig
        return `  ${fieldPath}: value too long/large (maximum ${typed.maximum})`
      }

      if (issue.code === "invalid_value") {
        // z.core.$ZodIssueInvalidValue: has `values` (allowed values array) — Zod v4 replaces invalid_enum_value
        const typed = issue as z.core.$ZodIssueInvalidValue
        return `  ${fieldPath}: must be one of [${typed.values.join(", ")}]`
      }

      // Fallback: use the human-readable message Zod already generated
      return `  ${fieldPath}: ${issue.message}`
    })

    return {
      valid: false,
      result: ToolResult.fail(
        `Invalid input:\n${issues.join("\n")}\n\nFix the parameters and retry.`,
        true, // validation errors are always retryable
      ),
    }
  }

  /**
   * Wrap a plugin tool execute function with validation + structured result envelope.
   * - Validates input against the provided schema before calling execute
   * - Catches unhandled errors and wraps them in ToolResult.fail with retryability flag
   * - Permission/denied errors are marked NOT retryable
   *
   * Returns the legacy `{title, output, metadata}` shape so the AI SDK layer stays unchanged.
   */
  export function wrap(
    schema: z.ZodType,
    execute: Tool.Def["execute"],
  ): (params: unknown, ctx: Tool.Context) => Promise<{ title: string; output: string; metadata: Record<string, any> }> {
    return async (params, ctx) => {
      const validation = validate(schema, params)

      if (!validation.valid) {
        return {
          title: "Validation Error",
          output: ToolResult.format(validation.result),
          metadata: { error: true, retryable: true },
        }
      }

      try {
        // params type is narrowed by validation above
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await execute(validation.data as any, ctx)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const retryable = ToolResult.isRetryable(error)
        const result = ToolResult.fail(message, retryable)
        return {
          title: "Tool Error",
          output: ToolResult.format(result),
          metadata: { error: true, retryable },
        }
      }
    }
  }
}
