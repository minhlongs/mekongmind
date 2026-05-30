const TIMEOUT_MS = 5_000

const handlers = new Map<string, () => Promise<void> | void>()
let executing = false

export namespace Shutdown {
  export function register(name: string, fn: () => Promise<void> | void) {
    handlers.set(name, fn)
  }

  export async function execute(signal: string) {
    if (executing) return
    executing = true

    process.stderr.write(`shutdown: received ${signal}\n`)

    // timer resolves after TIMEOUT_MS; side-effect is a forced exit
    const timer = new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        process.stderr.write("shutdown: timeout, forcing exit\n")
        process.exit(1)
        resolve()
      }, TIMEOUT_MS)
      t.unref()
    })

    const work = Promise.allSettled(
      Array.from(handlers.entries()).map(([name, fn]) =>
        Promise.resolve()
          .then(() => fn())
          .then(() => process.stderr.write(`shutdown: ${name} done\n`))
          .catch((err) => process.stderr.write(`shutdown: ${name} error ${err}\n`)),
      ),
    )

    await Promise.race([work, timer])
    process.stderr.write("shutdown: complete\n")
  }

  export function install() {
    for (const sig of ["SIGTERM", "SIGINT"] as const) {
      process.on(sig, () => {
        execute(sig).then(() => process.exit(0))
      })
    }
  }
}
