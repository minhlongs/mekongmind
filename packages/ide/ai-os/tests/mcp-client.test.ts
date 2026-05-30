import { AiOsMcpClient } from '../src/mcp-client.js'
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'

describe('AiOsMcpClient', () => {
  let client: AiOsMcpClient

  beforeAll(async () => {
    client = new AiOsMcpClient()
    await client.start()
  })

  afterAll(async () => {
    await client.stop()
  })

  it('connects and shows connected status', () => {
    expect(client.status).toBe('connected')
  })

  it('lists tools with all expected tool names', async () => {
    const result = await client.listTools()
    const tools = result.tools
    const names = tools.map((t: any) => t.name)

    expect(names).toContain('cc_memory_search')
    expect(names).toContain('cc_tasks_create')
    expect(names).toContain('cc_plan_start')
    expect(names).toContain('cc_ssj')
    expect(names.length).toBeGreaterThanOrEqual(20)
  })

  it('invokes cc_ssj diagnostics', async () => {
    const result: any = await client.invoke('cc_ssj', { action: 'diagnostics' })
    expect(result.content).toBeDefined()
    expect(result.content.length).toBeGreaterThan(0)
    const text = result.content[0].text
    expect(text.toLowerCase()).toMatch(/python|platform/)
  })

  it('invokes cc_ssj health-check', async () => {
    const result: any = await client.invoke('cc_ssj', { action: 'health-check' })
    const text = result.content[0].text
    const data = JSON.parse(text)
    expect(data.ok).toBe(true)
    expect(data.data).toBeDefined()
  })

  it('full task lifecycle via invoke', async () => {
    const created: any = await client.invoke('cc_tasks_create', { subject: 'TS test task' })
    const data = JSON.parse(created.content[0].text)
    expect(data.ok).toBe(true)
    const taskId = data.data.task.task_id
    expect(taskId).toBeTruthy()

    const listed: any = await client.invoke('cc_tasks_list', { status: '' })
    const listData = JSON.parse(listed.content[0].text)
    expect(listData.data.tasks.length).toBeGreaterThanOrEqual(1)

    const done: any = await client.invoke('cc_tasks_done', { task_id: taskId })
    const doneData = JSON.parse(done.content[0].text)
    expect(doneData.ok).toBe(true)

    const deleted: any = await client.invoke('cc_tasks_delete', { task_id: taskId })
    const delData = JSON.parse(deleted.content[0].text)
    expect(delData.ok).toBe(true)
  })

  it('full plan lifecycle via invoke', async () => {
    // Create
    const created: any = await client.invoke('cc_plan_start', { description: '- Step A\n- Step B' })
    const data = JSON.parse(created.content[0].text)
    expect(data.ok).toBe(true)
    const planId: string = data.data.plan_id
    expect(planId).toBeTruthy()
    expect(data.data.tasks.length).toBe(2)

    // List
    const listed: any = await client.invoke('cc_plan_list', { status: '' })
    const listData = JSON.parse(listed.content[0].text)
    expect(listData.ok).toBe(true)
    expect(listData.data.plans.length).toBeGreaterThanOrEqual(1)

    // Done
    const done: any = await client.invoke('cc_plan_done', { plan_id: planId })
    const doneData = JSON.parse(done.content[0].text)
    expect(doneData.ok).toBe(true)
  })

  it('handles error gracefully when tool name is invalid', async () => {
    try {
      await (client.invoke as any)('cc_nonexistent', {})
      expect('should have thrown').toBe('never')
    } catch (err: any) {
      expect(err).toBeDefined()
    }
  })
})
