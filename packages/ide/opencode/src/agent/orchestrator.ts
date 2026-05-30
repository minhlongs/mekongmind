import { Effect } from "effect"
import { Session } from "../session"
import { SessionID } from "../session/schema"
import { SessionPrompt } from "../session/prompt"
import { Worktree } from "../worktree"
import { type ModelID, type ProviderID } from "../provider/schema"
import { Checkpoint, type CheckpointData } from "./checkpoint"
import { Instance } from "../project/instance"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"
import * as Stream from "effect/Stream"

/** A single unit of parallel work dispatched by the orchestrator. */
export interface Subtask {
  /** Unique ID within this orchestration run. */
  id: string
  /** Short human-readable label (3-5 words). */
  description: string
  /** Full prompt sent to the child agent. */
  prompt: string
  /** "general" for read+write, "explore" for read-only. */
  agentType: "general" | "explore"
  /** Worktree path assigned for this subtask (general agents only). */
  worktreePath?: string
  status: "pending" | "running" | "done" | "failed"
  result?: string
  error?: string
}

export namespace Orchestrator {
  const MAX_CONCURRENCY = 3

  // ---------------------------------------------------------------------------
  // git helper — spawns git in the primary worktree
  // ---------------------------------------------------------------------------

  const git = Effect.fn("Orchestrator.git")(function* (
    args: string[],
    opts?: { cwd?: string },
  ) {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
    const handle = yield* spawner.spawn(
      ChildProcess.make("git", args, {
        cwd: opts?.cwd ?? Instance.worktree,
        extendEnv: true,
        stdin: "ignore",
      }),
    )
    const [text, stderr] = yield* Effect.all(
      [Stream.mkString(Stream.decodeText(handle.stdout)), Stream.mkString(Stream.decodeText(handle.stderr))],
      { concurrency: 2 },
    )
    const code = yield* handle.exitCode
    return { code, text, stderr }
  }, Effect.scoped)

  // ---------------------------------------------------------------------------
  // executeSubtask — create child session, run prompt, return text result
  // ---------------------------------------------------------------------------

  export const executeSubtask = Effect.fn("Orchestrator.executeSubtask")(function* (
    subtask: Subtask,
    parentSessionID: string,
    model: { modelID: ModelID; providerID: ProviderID },
  ) {
    const session = yield* Effect.promise(() =>
      Session.create({
        parentID: SessionID.make(parentSessionID),
        title: subtask.description + ` (@${subtask.agentType} subagent)`,
      }),
    )

    const parts = yield* Effect.promise(() => SessionPrompt.resolvePromptParts(subtask.prompt))

    const result = yield* Effect.promise(() =>
      SessionPrompt.prompt({
        sessionID: session.id,
        model,
        agent: subtask.agentType,
        parts,
      }),
    )

    const text = result.parts.findLast((p) => p.type === "text")?.text ?? ""
    return text
  })

  // ---------------------------------------------------------------------------
  // checkConflicts — run git merge-tree to detect conflicts per worktree branch
  // ---------------------------------------------------------------------------

  export const checkConflicts = Effect.fn("Orchestrator.checkConflicts")(function* (
    subtasks: Subtask[],
  ) {
    const conflicted: string[] = []
    const clean: Subtask[] = []

    for (const subtask of subtasks) {
      if (!subtask.worktreePath || subtask.status !== "done") continue

      // Get branch name from the worktree directory
      const branchResult = yield* git(
        ["rev-parse", "--abbrev-ref", "HEAD"],
        { cwd: subtask.worktreePath },
      )
      if (branchResult.code !== 0) {
        conflicted.push(subtask.id)
        continue
      }
      const branch = branchResult.text.trim()

      // Use merge-tree to check for conflicts against HEAD
      const mergeResult = yield* git([
        "merge-tree",
        "--write-tree",
        "HEAD",
        branch,
      ])

      // Exit code 1 = conflicts; 0 = clean
      if (mergeResult.code !== 0 || mergeResult.stderr.includes("CONFLICT")) {
        conflicted.push(subtask.id)
      } else {
        clean.push(subtask)
      }
    }

    return { clean, conflicted }
  })

  // ---------------------------------------------------------------------------
  // mergeWorktrees — no-ff merge of clean branches into HEAD
  // ---------------------------------------------------------------------------

  export const mergeWorktrees = Effect.fn("Orchestrator.mergeWorktrees")(function* (
    subtasks: Subtask[],
  ) {
    const merged: string[] = []
    const failed: string[] = []

    for (const subtask of subtasks) {
      if (!subtask.worktreePath) continue

      const branchResult = yield* git(
        ["rev-parse", "--abbrev-ref", "HEAD"],
        { cwd: subtask.worktreePath },
      )
      if (branchResult.code !== 0) {
        failed.push(subtask.id)
        continue
      }
      const branch = branchResult.text.trim()

      const mergeResult = yield* git([
        "merge",
        "--no-ff",
        "-m",
        `Merge subtask ${subtask.id}: ${subtask.description}`,
        branch,
      ])

      if (mergeResult.code === 0) {
        merged.push(subtask.id)
      } else {
        failed.push(subtask.id)
      }
    }

    return { merged, failed }
  })

  // ---------------------------------------------------------------------------
  // execute — top-level orchestration entry point
  // ---------------------------------------------------------------------------

  export const execute = Effect.fn("Orchestrator.execute")(function* (input: {
    sessionID: string
    taskDescription: string
    subtasks: Subtask[]
    model: { modelID: ModelID; providerID: ProviderID }
  }) {
    const { sessionID, taskDescription, model } = input
    let subtasks = [...input.subtasks]

    // Assign worktrees to general subtasks
    const worktreeService = yield* Worktree.Service
    for (const subtask of subtasks) {
      if (subtask.agentType === "general") {
        const info = yield* worktreeService.create({ name: subtask.id })
        subtask.worktreePath = info.directory
      }
    }

    // Save initial checkpoint
    const checkpointData: CheckpointData = {
      taskDescription,
      subtasks: subtasks.map((s) => ({ ...s })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    yield* Effect.promise(() => Checkpoint.save(sessionID, checkpointData))

    // Run subtasks in parallel with bounded concurrency
    const results = yield* Effect.forEach(
      subtasks,
      (subtask) =>
        Effect.gen(function* () {
          subtask.status = "running"
          const text = yield* executeSubtask(subtask, sessionID, model).pipe(
            Effect.map((t) => {
              subtask.status = "done"
              subtask.result = t
              return t
            }),
            Effect.catchAll((err) =>
              Effect.sync(() => {
                subtask.status = "failed"
                subtask.error = err instanceof Error ? err.message : String(err)
                return ""
              }),
            ),
          )
          // Update checkpoint after each subtask
          checkpointData.subtasks = subtasks.map((s) => ({ ...s }))
          checkpointData.updatedAt = Date.now()
          yield* Effect.promise(() => Checkpoint.save(sessionID, checkpointData))
          return text
        }),
      { concurrency: MAX_CONCURRENCY },
    )

    // Check conflicts on general subtasks that succeeded
    const doneGenerals = subtasks.filter((s) => s.agentType === "general" && s.status === "done")
    const { clean, conflicted } = yield* checkConflicts(doneGenerals)

    // Merge clean branches
    const mergeOutcome = yield* mergeWorktrees(clean)

    // Clean up all worktrees
    yield* Effect.forEach(
      subtasks.filter((s) => s.worktreePath),
      (subtask) =>
        worktreeService.remove({ directory: subtask.worktreePath! }).pipe(Effect.ignore),
      { concurrency: "unbounded" },
    )

    // Clean up checkpoint
    yield* Effect.promise(() => Checkpoint.remove(sessionID))

    return {
      results,
      subtasks,
      mergeOutcome,
      conflicted,
    }
  })
}
