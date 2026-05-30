import fs from "fs/promises"
import path from "path"
import { Global } from "@/global"

/** Persisted state for an in-progress orchestration run. */
export interface CheckpointData {
  taskDescription: string
  subtasks: Array<{
    id: string
    description: string
    prompt: string
    agentType: string
    worktreePath?: string
    status: "pending" | "running" | "done" | "failed"
    result?: string
    error?: string
  }>
  createdAt: number
  updatedAt: number
}

export namespace Checkpoint {
  function checkpointDir(): string {
    return path.join(Global.Path.data, "orchestrator-checkpoints")
  }

  function checkpointPath(sessionID: string): string {
    // Sanitize sessionID to be safe as a filename
    const safe = sessionID.replace(/[^a-zA-Z0-9_-]/g, "_")
    return path.join(checkpointDir(), `${safe}.json`)
  }

  /** Save checkpoint data for a session. Creates directory if needed. */
  export async function save(sessionID: string, data: CheckpointData): Promise<void> {
    const dir = checkpointDir()
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(checkpointPath(sessionID), JSON.stringify(data, null, 2), "utf8")
  }

  /** Load checkpoint for a session. Returns null if not found. */
  export async function load(sessionID: string): Promise<CheckpointData | null> {
    try {
      const raw = await fs.readFile(checkpointPath(sessionID), "utf8")
      return JSON.parse(raw) as CheckpointData
    } catch {
      return null
    }
  }

  /** Remove checkpoint file after successful completion. */
  export async function remove(sessionID: string): Promise<void> {
    try {
      await fs.unlink(checkpointPath(sessionID))
    } catch {
      // Ignore — file may already be gone
    }
  }
}
