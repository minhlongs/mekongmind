import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { McpToolName, McpToolArgs, AiOsConfig } from './types.js'
import { createServerProcess } from './server.js'

export type AiOsMcpStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export class AiOsMcpClient {
  private _client: Client | null = null
  private _transport: StdioClientTransport | null = null
  private _status: AiOsMcpStatus = 'disconnected'
  private _cfg: AiOsConfig

  constructor(cfg?: Partial<AiOsConfig>) {
    this._cfg = {
      mcpServerName: 'cc-ai-os',
      timeout: 30000,
      ...cfg,
    }
  }

  get status(): AiOsMcpStatus {
    return this._status
  }

  get serverName(): string {
    return this._cfg.mcpServerName
  }

  getToolNames(): McpToolName[] {
    return [
      'cc_memory_search', 'cc_memory_consolidate',
      'cc_tasks_list', 'cc_tasks_create', 'cc_tasks_done', 'cc_tasks_start', 'cc_tasks_delete',
      'cc_agents_list', 'cc_agents_start', 'cc_agents_stop',
      'cc_skills_list',
      'cc_mcp_list',
      'cc_plugins_list', 'cc_plugins_install',
      'cc_brainstorm',
      'cc_lab_start', 'cc_lab_status',
      'cc_trading_analyze', 'cc_trading_price',
      'cc_monitor_run', 'cc_monitor_status',
      'cc_plan_start', 'cc_plan_list', 'cc_plan_done',
      'cc_ssj',
    ]
  }

  describeTools(): string {
    return this.getToolNames().join(', ')
  }

  async start(): Promise<void> {
    if (this._status === 'connected') return

    this._status = 'connecting'

    try {
      const { transport } = createServerProcess(this._cfg)
      this._transport = transport

      this._client = new Client(
        { name: 'mekong-ai-os-client', version: '1.0.0' },
        { capabilities: {} },
      )

      await this._client.connect(this._transport)
      this._status = 'connected'
    } catch (err) {
      this._status = 'error'
      throw err
    }
  }

  async stop(): Promise<void> {
    if (this._client) {
      try { await this._client.close() } catch { /* ignore */ }
      this._client = null
    }
    this._transport = null
    this._status = 'disconnected'
  }

  async listTools() {
    if (!this._client) throw new Error('MCP client not connected. Call start() first.')
    return this._client.listTools()
  }

  async invoke<N extends McpToolName>(
    name: N,
    args: McpToolArgs[N],
  ): Promise<unknown> {
    if (!this._client) throw new Error('MCP client not connected. Call start() first.')

    const result = await this._client.callTool({
      name,
      arguments: args as Record<string, unknown>,
    })

    return result
  }
}
