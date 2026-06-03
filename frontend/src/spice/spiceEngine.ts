/**
 * SpiceEngine — TypeScript wrapper around the ngspice Web Worker.
 *
 * Provides a simple async API for running SPICE .op analysis from the
 * AIPLC DRC engine. Lazily initializes the worker on first use and reuses
 * it for subsequent solves.
 */

export interface SpiceResult {
  /** For .op: variable name (lowercase) -> DC value */
  variables: Map<string, number>
  /** All variable names returned by ngspice */
  variableNames: string[]
  success: boolean
  error?: string
}

class SpiceEngine {
  private worker: Worker | null = null
  private ready = false
  private initPromise: Promise<void> | null = null

  /**
   * Boot the ngspice WASM worker. Idempotent — subsequent calls return
   * the same promise.  First call takes 2-5s (WASM download + init).
   */
  async init(): Promise<void> {
    if (this.ready) return
    if (this.initPromise) return this.initPromise

    const INIT_TIMEOUT_MS = 15_000 // 15 seconds max for WASM init

    this.initPromise = new Promise<void>((resolve, reject) => {
      let settled = false
      let timeoutId: ReturnType<typeof setTimeout> | undefined

      // Declared as function (hoisted) so it can be called from anywhere
      // within this scope, including the catch block before onMessage/onError
      function doCleanup(w: Worker | null) {
        settled = true
        if (timeoutId !== undefined) clearTimeout(timeoutId)
        w?.removeEventListener('message', onMessage)
        w?.removeEventListener('error', onError)
      }

      const onMessage = (ev: MessageEvent) => {
        if (settled) return
        const data = ev.data
        if (data.type === 'ready') {
          this.ready = true
          doCleanup(this.worker)
          resolve()
        } else if (data.type === 'error') {
          doCleanup(this.worker)
          reject(new Error(data.message || 'Worker init failed'))
        }
      }

      const onError = (ev: ErrorEvent) => {
        if (settled) return
        doCleanup(this.worker)
        reject(new Error(ev.message || 'Worker load error'))
      }

      try {
        // Worker loaded from source via Vite's ?url import — works in
        // both dev and production builds.
        this.worker = new Worker(
          new URL('./ngspice-worker.js', import.meta.url),
          { type: 'classic' },
        )

        timeoutId = setTimeout(() => {
          if (settled) return
          doCleanup(this.worker)
          this.initPromise = null // allow retry on next call
          reject(
            new Error(
              `ngspice WASM init timed out after ${INIT_TIMEOUT_MS / 1000}s`,
            ),
          )
        }, INIT_TIMEOUT_MS)

        this.worker.addEventListener('message', onMessage)
        this.worker.addEventListener('error', onError)
        this.worker.postMessage({ type: 'init' })
      } catch (err) {
        doCleanup(this.worker)
        reject(err)
      }
    })

    // If init fails, clear the cached promise so subsequent calls can retry
    this.initPromise.catch(() => {
      this.initPromise = null
    })

    return this.initPromise
  }

  /**
   * Run a SPICE netlist (.op analysis) and return the DC operating point.
   * Automatically calls init() if the worker hasn't booted yet.
   */
  async solve(netlist: string): Promise<SpiceResult> {
    await this.init()

    if (!this.worker) {
      return {
        variables: new Map(),
        variableNames: [],
        success: false,
        error: 'Worker not available',
      }
    }

    const SOLVE_TIMEOUT_MS = 10_000 // 10 seconds max for .op analysis

    return new Promise<SpiceResult>((resolve) => {
      let settled = false
      let timeoutId: ReturnType<typeof setTimeout> | undefined

      const cleanup = () => {
        settled = true
        if (timeoutId !== undefined) clearTimeout(timeoutId)
        this.worker?.removeEventListener('message', onMessage)
      }

      const onMessage = (ev: MessageEvent) => {
        if (settled) return
        const data = ev.data
        if (data.type === 'result') {
          cleanup()
          // Convert plain object vectors to Map<string, number>
          // For .op, each vector has exactly one value
          const variables = new Map<string, number>()
          const rawVectors: Record<string, number[]> = data.vectors || {}
          for (const [name, values] of Object.entries(rawVectors)) {
            if (Array.isArray(values) && values.length > 0) {
              variables.set(name, values[0])
            }
          }
          resolve({
            variables,
            variableNames: data.variableNames || [],
            success: true,
          })
        } else if (data.type === 'error') {
          cleanup()
          resolve({
            variables: new Map(),
            variableNames: [],
            success: false,
            error: data.message,
          })
        }
      }

      timeoutId = setTimeout(() => {
        if (settled) return
        cleanup()
        resolve({
          variables: new Map(),
          variableNames: [],
          success: false,
          error: `ngspice solve timed out after ${SOLVE_TIMEOUT_MS / 1000}s`,
        })
      }, SOLVE_TIMEOUT_MS)

      this.worker!.addEventListener('message', onMessage)
      this.worker!.postMessage({ type: 'run', netlist })
    })
  }

  /**
   * Terminate the worker and free resources.
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.ready = false
    this.initPromise = null
  }
}

/** Singleton instance shared across the app. */
export const spiceEngine = new SpiceEngine()
