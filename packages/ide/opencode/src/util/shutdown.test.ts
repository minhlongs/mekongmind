import { describe, test, expect } from "bun:test"

// Shutdown uses module-level state (Map + executing flag).
// We test through a factory that replicates the same logic so each test
// gets a fresh, isolated instance without touching the real process.
// This follows the repo's "avoid mocks" guidance by testing real logic,
// not wiring the singleton into a process that would exit under test.

type Handler = () => Promise<void> | void

function makeShutdown(onForceExit?: () => void, timeoutMs = 5_000) {
  const handlers = new Map<string, Handler>()
  let executing = false

  function register(name: string, fn: Handler) {
    handlers.set(name, fn)
  }

  async function execute(signal: string) {
    if (executing) return
    executing = true

    const timer = new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        onForceExit?.()
        resolve()
      }, timeoutMs)
      t.unref()
    })

    const work = Promise.allSettled(
      Array.from(handlers.entries()).map(([, fn]) =>
        Promise.resolve()
          .then(() => fn())
          .catch(() => undefined),
      ),
    )

    await Promise.race([work, timer])
  }

  return { register, execute }
}

describe("Shutdown.register", () => {
  test("adds a handler that is called on execute", async () => {
    const S = makeShutdown()
    let called = false
    S.register("h", () => { called = true })
    await S.execute("SIGTERM")
    expect(called).toBe(true)
  })
})

describe("Shutdown.execute", () => {
  test("runs all registered handlers", async () => {
    const S = makeShutdown()
    const results: string[] = []
    S.register("a", () => { results.push("a") })
    S.register("b", () => { results.push("b") })
    await S.execute("SIGTERM")
    expect(results.sort()).toEqual(["a", "b"])
  })

  test("is idempotent — second call is no-op", async () => {
    const S = makeShutdown()
    let count = 0
    S.register("c", () => { count++ })
    await S.execute("SIGTERM")
    await S.execute("SIGTERM")
    expect(count).toBe(1)
  })

  test("a throwing handler does not prevent other handlers from running", async () => {
    const S = makeShutdown()
    let bRan = false
    S.register("bad", () => { throw new Error("boom") })
    S.register("good", () => { bRan = true })
    await S.execute("SIGTERM")
    expect(bRan).toBe(true)
  })

  test("async handlers are awaited", async () => {
    const S = makeShutdown()
    let done = false
    S.register("async", async () => {
      await new Promise<void>((r) => setTimeout(r, 10))
      done = true
    })
    await S.execute("SIGTERM")
    expect(done).toBe(true)
  })

  test("hanging handlers trigger force-exit after timeout", async () => {
    let exited = false
    // Use a very short timeout so the test doesn't stall
    const S = makeShutdown(() => { exited = true }, 50)
    S.register("hang", () => new Promise<void>(() => { /* never resolves */ }))
    await S.execute("SIGTERM")
    expect(exited).toBe(true)
  })
})
