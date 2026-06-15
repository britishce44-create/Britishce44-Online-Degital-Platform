export class OfflineQueue {
  private queue: { type: string; payload: unknown; retries: number }[] = []
  private readonly storageKey = 'b44_offline_queue_web'
  private isProcessing = false

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) this.queue = JSON.parse(stored)
      } catch { this.queue = [] }
    }
  }

  enqueue(type: string, payload: unknown): void {
    this.queue.push({ type, payload, retries: 0 })
    this.persist()
  }

  async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return
    if (!navigator.onLine) return
    this.isProcessing = true

    const remaining: typeof this.queue = []
    for (const item of this.queue) {
      try {
        const res = await fetch(`/api/sync/${item.type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } catch {
        item.retries++
        if (item.retries < 5) remaining.push(item)
      }
    }
    this.queue = remaining
    this.persist()
    this.isProcessing = false
  }

  get length(): number { return this.queue.length }

  private persist(): void {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.queue)) } catch {}
  }

  clear(): void {
    this.queue = []
    this.persist()
  }
}

export const offlineQueue = new OfflineQueue()
