# @mekong/ai-os

Mekong IDE AI OS — TypeScript bridge between the OpenCode engine and the CheetahClaws AI OS (model orchestrator, MCP server).

## Overview

This package provides:

- **AiOsMcpClient** — Thin client wrapper describing MCP tools available from the `cc-ai-os` server (memory, tasks, agents, skills, plugins, brainstorm, lab, trading, monitor, plan, ssj)
- **classifyIntent** — Intent classification + model routing (ports logic from `scripts-ai-os/intent-router.cjs`)
- **checkHealth** — Health check types for AI OS services
- **Shared types** — `McpToolName`, `AiOsConfig`, `ModelRoute`

## Usage

```ts
import { AiOsMcpClient, classifyIntent } from '@mekong/ai-os'

const client = new AiOsMcpClient()
console.log(client.describeTools())

const result = classifyIntent('Fix login redirect on Safari')
console.log(result.intent, result.route.model)
```

## License

MIT
