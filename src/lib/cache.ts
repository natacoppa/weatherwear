// Tiny in-memory TTL cache. Scoped to a single function instance — on
// Vercel, each cold start loses cached entries. Acceptable for popular
// cities where repeat hits within a warm instance's lifetime hit cache;
// cold-start misses just revert to the upstream fetch.
//
// For cross-instance caching (necessary at scale), upgrade to Vercel KV /
// Upstash Redis with the same interface. See be-002.

interface Entry<T> {
  value: T;
  expiresAt: number; // ms since epoch; Infinity means never expires
}

export class TtlCache<T> {
  private store = new Map<string, Entry<T>>();
  constructor(private readonly defaultTtlMs = 10 * 60 * 1000) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = ttl === Infinity ? Infinity : Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
  }

  /** Fetch-or-cache. Returns cached value if present, else computes and stores. */
  async getOrCompute(key: string, compute: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = await compute();
    this.set(key, value, ttlMs);
    return value;
  }
}
