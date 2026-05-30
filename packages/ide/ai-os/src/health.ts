import type { AiOsHealth } from './types.js'

export function checkHealth(status?: { mcpServer?: boolean }): AiOsHealth {
  return {
    mcpServer: status?.mcpServer ?? false,
    modelOrchestrator: false,
    timestamp: Date.now(),
  }
}
