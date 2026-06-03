/**
 * SimulationClient — WebSocket bridge to /api/simulate
 *
 * Handles connection lifecycle, message routing, and reconnection.
 */

export interface SimulationCallbacks {
  onSerialOutput: (text: string) => void
  onGpioChange: (pin: number, state: number) => void
  onSystemEvent: (event: string) => void
}

class SimulationClient {
  private ws: WebSocket | null = null
  private callbacks: SimulationCallbacks | null = null

  /** Build the WebSocket URL respecting dev proxy or same-origin production. */
  private buildUrl(): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/api/simulate`
  }

  /**
   * Open a WebSocket connection and register message handlers.
   * Resolves once the socket is open; rejects on connection error.
   */
  connect(callbacks: SimulationCallbacks): Promise<void> {
    this.callbacks = callbacks

    return new Promise<void>((resolve, reject) => {
      const url = this.buildUrl()
      console.log('[SimClient] connecting to', url)
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('[SimClient] connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          switch (msg.type) {
            case 'serial_output':
              this.callbacks?.onSerialOutput(msg.data.text)
              break
            case 'gpio_change':
              this.callbacks?.onGpioChange(msg.data.pin, msg.data.state)
              break
            case 'system':
              this.callbacks?.onSystemEvent(msg.data.event)
              break
            default:
              console.log('[SimClient] unknown msg type:', msg.type)
          }
        } catch {
          console.warn('[SimClient] failed to parse message:', event.data)
        }
      }

      this.ws.onerror = (err) => {
        console.error('[SimClient] error:', err)
        reject(err)
      }

      this.ws.onclose = () => {
        console.log('[SimClient] disconnected')
      }
    })
  }

  /** Send a "start" command with the user's PLC code. */
  start(code: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'start', code }))
    } else {
      console.warn('[SimClient] cannot start — WebSocket not open')
    }
  }

  /** Send a "stop" command to halt the scan loop. */
  stop(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'stop' }))
    }
  }

  /** Close the WebSocket connection entirely. */
  disconnect(): void {
    this.ws?.close()
    this.ws = null
    this.callbacks = null
  }

  /** Whether the socket is currently open. */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const simulationClient = new SimulationClient()
