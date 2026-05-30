export type McpToolName =
  | 'cc_memory_search' | 'cc_memory_consolidate'
  | 'cc_tasks_list' | 'cc_tasks_create' | 'cc_tasks_done' | 'cc_tasks_start' | 'cc_tasks_delete'
  | 'cc_agents_list' | 'cc_agents_start' | 'cc_agents_stop'
  | 'cc_skills_list'
  | 'cc_mcp_list'
  | 'cc_plugins_list' | 'cc_plugins_install'
  | 'cc_brainstorm'
  | 'cc_lab_start' | 'cc_lab_status'
  | 'cc_trading_analyze' | 'cc_trading_price'
  | 'cc_monitor_run' | 'cc_monitor_status'
  | 'cc_plan_start' | 'cc_plan_list' | 'cc_plan_done'
  | 'cc_ssj';

export interface McpToolArgs {
  cc_memory_search: { query: string; limit?: number };
  cc_memory_consolidate: Record<string, never>;
  cc_tasks_list: { status?: string };
  cc_tasks_create: { subject: string };
  cc_tasks_done: { task_id: string };
  cc_tasks_start: { task_id: string };
  cc_tasks_delete: { task_id: string };
  cc_agents_list: Record<string, never>;
  cc_agents_start: { template: string; args?: string };
  cc_agents_stop: { name: string };
  cc_skills_list: Record<string, never>;
  cc_mcp_list: Record<string, never>;
  cc_plugins_list: Record<string, never>;
  cc_plugins_install: { name_url: string };
  cc_brainstorm: { topic: string };
  cc_lab_start: { topic: string };
  cc_lab_status: Record<string, never>;
  cc_trading_analyze: { symbol: string };
  cc_trading_price: { symbol: string };
  cc_monitor_run: { topic?: string };
  cc_monitor_status: Record<string, never>;
  cc_plan_start: { description: string };
  cc_plan_list: { status?: string };
  cc_plan_done: { plan_id: string };
  cc_ssj: { action?: string };
}

export interface AiOsConfig {
  mcpServerName: string;
  timeout: number;
}

export interface AiOsHealth {
  mcpServer: boolean;
  modelOrchestrator: boolean;
  timestamp: number;
}

export interface ModelRoute {
  provider: string;
  model: string;
  tier: 'fast' | 'balanced' | 'deep';
  endpoint?: string;
}
