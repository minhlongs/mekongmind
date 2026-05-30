import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { AiOsConfig } from './types.js'
import { homedir } from 'os'
import { join } from 'path'
import { existsSync } from 'fs'

const MEKONG_CLI_DIR = join(homedir(), 'mekong-cli')

export interface ServerProcess {
  transport: StdioClientTransport
}

function findMekongCli(): string | null {
  if (existsSync(join(MEKONG_CLI_DIR, 'src', 'core', 'mcp_server.py'))) {
    return MEKONG_CLI_DIR
  }
  const cwd = process.cwd()
  if (existsSync(join(cwd, 'src', 'core', 'mcp_server.py'))) {
    return cwd
  }
  return null
}

export function createServerProcess(cfg?: AiOsConfig): ServerProcess {
  const mcpDir = findMekongCli()
  if (!mcpDir) {
    throw new Error(
      'Mekong CLI not found. Expected at ~/mekong-cli/ or current working directory.',
    )
  }

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    PYTHONPATH: `${mcpDir}${process.env.PYTHONPATH ? `:${process.env.PYTHONPATH}` : ''}`,
  }

  const transport = new StdioClientTransport({
    command: 'python3',
    args: ['-m', 'src.core.mcp_server'],
    env,
    cwd: mcpDir,
  })

  return { transport }
}
