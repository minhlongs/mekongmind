# Agents API — Agent Execution

> **Purpose**: Thực thi các chuyên gia AI (git, file, shell, content-writer, lead-hunter, recipe-crawler) với credit metering.

---

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/agents` | ❌ | List available agents |
| POST | `/v1/agents/:name/run` | ✅ | Run specific agent |

---

## GET /v1/agents — List Available Agents

### Request

```bash
curl -X GET https://agencyos.network/v1/agents
```

### Response

```json
{
  "agents": [
    {
      "name": "git",
      "description": "Git operations: clone, commit, push, branch management",
      "permissions": ["read", "write"],
      "credit_cost": 3
    },
    {
      "name": "file",
      "description": "File operations: read, write, edit, delete",
      "permissions": ["read", "write"],
      "credit_cost": 1
    },
    {
      "name": "shell",
      "description": "Shell command execution with sandbox",
      "permissions": ["execute"],
      "credit_cost": 3
    },
    {
      "name": "content-writer",
      "description": "AI content generation for blogs, social media, marketing",
      "permissions": ["read", "write"],
      "credit_cost": 5
    },
    {
      "name": "lead-hunter",
      "description": "Lead generation and prospecting",
      "permissions": ["read", "write", "external_api"],
      "credit_cost": 5
    },
    {
      "name": "recipe-crawler",
      "description": "Web scraping and data extraction",
      "permissions": ["read", "external_api"],
      "credit_cost": 3
    }
  ]
}
```

### Agent Types

| Agent | Purpose | Credits | Permissions |
|-------|---------|---------|-------------|
| `git` | Git operations | 3 | read, write |
| `file` | File I/O | 1 | read, write |
| `shell` | Command execution | 3 | execute |
| `content-writer` | Content creation | 5 | read, write |
| `lead-hunter` | Lead generation | 5 | read, write, external_api |
| `recipe-crawler` | Web scraping | 3 | read, external_api |

---

## POST /v1/agents/:name/run — Run Agent

### Request

```bash
curl -X POST https://agencyos.network/v1/agents/git/run \
  -H "Authorization: Bearer $RAAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Clone repository https://github.com/example/repo.git to ./repos/example",
    "context": {
      "repo_url": "https://github.com/example/repo.git",
      "target_path": "./repos/example",
      "branch": "main"
    }
  }'
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Agent name: `git`, `file`, `shell`, `content-writer`, `lead-hunter`, `recipe-crawler` |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `instruction` | string | ✅ | Natural language instruction (1-2000 chars) |
| `context` | object | ❌ | Additional context for agent |
| `timeout` | integer | ❌ | Timeout in seconds (default: 300, max: 3600) |

### Response (201 Created)

```json
{
  "mission_id": "mission_agent_xyz789",
  "agent": "git",
  "instruction": "Clone repository https://github.com/example/repo.git to ./repos/example",
  "status": "pending",
  "credits_used": 3,
  "created_at": "2026-03-19T10:30:00Z",
  "message": "Agent mission created. Use /v1/tasks/:id/stream to track progress."
}
```

### Agent Execution Flow

```
1. Validate agent name and instruction
2. Check tenant credit balance
3. Deduct credits (agent-specific cost)
4. Queue agent mission
5. Agent executes with PEV loop
6. Store results in R2/KV
7. Return output URL
```

### Error Responses

**400 Invalid Agent:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Unknown agent: 'unknown-agent'"
}
```

**400 Missing Instruction:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Instruction is required"
}
```

**402 Insufficient Credits:**
```json
{
  "error": "INSUFFICIENT_CREDITS",
  "message": "Insufficient balance",
  "details": [{"balance": 1, "required": 3}]
}
```

---

## Agent Specifications

### GitAgent

**Purpose:** Git operations với credit metering.

**Supported Commands:**
- `clone <repo_url> [target_path]`
- `commit -m "<message>" [files...]`
- `push [remote] [branch]`
- `pull [remote] [branch]`
- `branch <name>`
- `checkout <branch>`
- `merge <branch>`
- `status`, `log`, `diff`

**Example Instruction:**
```
"Clone repository https://github.com/example/repo.git, create branch feature-auth,
commit changes to src/auth.ts, and push to origin"
```

**Context Object:**
```json
{
  "repo_url": "https://github.com/example/repo.git",
  "target_path": "./repos/example",
  "branch": "feature-auth",
  "commit_message": "Add authentication module",
  "files": ["src/auth.ts"]
}
```

---

### FileAgent

**Purpose:** File operations (read, write, edit, delete).

**Supported Operations:**
- `read <file_path>` — Read file content
- `write <file_path> <content>` — Write new file
- `edit <file_path> <diff>` — Apply unified diff
- `delete <file_path>` — Delete file
- `mkdir <dir_path>` — Create directory
- `list <dir_path>` — List directory contents

**Example Instruction:**
```
"Read file src/config.ts, add new DATABASE_URL environment variable, and save"
```

**Context Object:**
```json
{
  "file_path": "src/config.ts",
  "operation": "edit",
  "diff": "@@ -5,6 +5,7 @@\n export const config = {\n+  DATABASE_URL: process.env.DATABASE_URL,\n   API_KEY: process.env.API_KEY\n }"
}
```

**Credit Cost:** 1 credit per operation

---

### ShellAgent

**Purpose:** Shell command execution với sandbox.

**Security:**
- Sandboxed execution (no network access by default)
- Command allowlist
- Timeout enforcement
- Output size limit (10MB)

**Allowed Commands:**
```bash
# Package managers
npm, pnpm, yarn, bun

# Build tools
tsc, vite, webpack, rollup

# Testing
jest, vitest, playwright, cypress

# Git
git (all commands)

# System
ls, cat, grep, find, head, tail, pwd, which
```

**Example Instruction:**
```
"Run npm install, then npm run build, and report any errors"
```

**Context Object:**
```json
{
  "commands": ["npm install", "npm run build"],
  "working_directory": "/path/to/project",
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

### ContentWriterAgent

**Purpose:** AI content generation for blogs, social media, marketing.

**Content Types:**
- Blog posts (500-3000 words)
- Social media posts (Facebook, Instagram, LinkedIn, Twitter)
- Email campaigns
- Landing page copy
- Product descriptions
- SEO meta descriptions

**Example Instruction:**
```
"Write a 1000-word blog post about '10 Coffee Brewing Techniques for Beginners'
with SEO keywords: coffee, brewing, beginner, guide"
```

**Context Object:**
```json
{
  "content_type": "blog_post",
  "topic": "Coffee Brewing Techniques",
  "target_audience": "beginners",
  "word_count": 1000,
  "tone": "friendly",
  "keywords": ["coffee", "brewing", "beginner", "guide"],
  "output_format": "markdown"
}
```

**Credit Cost:** 5 credits (complex)

---

### LeadHunterAgent

**Purpose:** Lead generation và prospecting.

**Data Sources:**
- LinkedIn (via API)
- Google Maps (local businesses)
- Industry directories
- Social media platforms

**Example Instruction:**
```
"Find 50 coffee shop owners in Ho Chi Minh City with email addresses
and LinkedIn profiles"
```

**Context Object:**
```json
{
  "industry": "F&B",
  "business_type": "coffee_shop",
  "location": "Ho Chi Minh City, Vietnam",
  "target_count": 50,
  "fields": ["name", "email", "phone", "linkedin", "website"]
}
```

**Output Format:**
```json
{
  "leads": [
    {
      "business_name": "The Coffee House",
      "contact_name": "Nguyen Van A",
      "email": "owner@thecoffeehouse.vn",
      "phone": "+84 90 123 4567",
      "linkedin": "https://linkedin.com/in/nguyenvana",
      "website": "https://thecoffeehouse.vn"
    }
  ],
  "total_found": 50
}
```

**Credit Cost:** 5 credits (complex)

---

### RecipeCrawlerAgent

**Purpose:** Web scraping và data extraction.

**Supported Sites:**
- Recipe blogs
- E-commerce product pages
- News articles
- Documentation sites

**Example Instruction:**
```
"Crawl all recipes from https://example-recipes.com category 'coffee'
and extract title, ingredients, instructions, cooking time"
```

**Context Object:**
```json
{
  "base_url": "https://example-recipes.com",
  "category": "coffee",
  "fields": ["title", "ingredients", "instructions", "cooking_time"],
  "max_pages": 100,
  "respect_robots_txt": true
}
```

**Output Format:**
```json
{
  "recipes": [
    {
      "title": "Vietnamese Ca Phe Sua Da",
      "ingredients": ["2 tbsp ground coffee", "4 oz hot water", "2 tbsp condensed milk", "ice"],
      "instructions": ["Brew coffee with phin filter", "Add condensed milk", "Pour over ice"],
      "cooking_time": "10 minutes"
    }
  ],
  "total_scraped": 25
}
```

**Credit Cost:** 3 credits (standard)

---

## SSE Streaming

All agent missions support real-time progress tracking:

```bash
curl -X GET https://agencyos.network/v1/tasks/mission_agent_xyz789/stream \
  -H "Authorization: Bearer $RAAS_API_KEY"
```

### SSE Events by Agent Type

**GitAgent:**
```
event: status
data: {"status":"cloning","result":{"repo":"https://github.com/example/repo.git"}}

event: status
data: {"status":"creating_branch","result":{"branch":"feature-auth"}}

event: status
data: {"status":"committing","result":{"files":["src/auth.ts"]}}

event: status
data: {"status":"pushing","result":{"remote":"origin"}}

event: complete
data: {"status":"completed","result":{"commit":"abc123"}}
```

**ContentWriterAgent:**
```
event: status
data: {"status":"researching","result":{"topic":"Coffee Brewing"}}

event: status
data: {"status":"outlining","result":{"sections":5}}

event: status
data: {"status":"writing","result":{"section":"introduction","word_count":200}}

event: complete
data: {"status":"completed","result":{"output":"blog_post.md","word_count":1000}}
```

---

## Related Endpoints

- [POST /v1/tasks](./tasks.md) — Create general missions
- [GET /billing/credits](./billing.md) — Check credit balance
- [POST /content/generate](./content.md) — AI content generation

---

## Next Steps

- [Tasks API](./tasks.md) — General mission management
- [Content API](./content.md) — Specialized content generation
- [Onboarding API](./onboarding.md) — 4-step tenant onboarding
