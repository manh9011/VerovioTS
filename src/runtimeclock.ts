/**
 * Pure TypeScript equivalent of Verovio's RuntimeClock.
 *
 * The C++ implementation uses std::chrono::steady_clock, so performance.now()
 * is used as the monotonic clock in environments where it is available. A
 * process-relative monotonic fallback based on process.hrtime.bigint() is
 * provided for Node.js. Both return elapsed milliseconds and are independent
 * of wall-clock changes.
 */
export class RuntimeClock {
  private m_start!: number;
  private readonly clock: () => number;

  public constructor(clock?: () => number) {
    this.clock = clock ?? RuntimeClock.defaultClock;
    this.Reset();
  }

  /** Resets the clock. */
  public Reset(): void {
    this.m_start = this.clock();
  }

  /** Get current runtime in seconds. */
  public GetSeconds(): number {
    const timeDiffMilliseconds = this.clock() - this.m_start;
    return timeDiffMilliseconds / 1000;
  }

  private static defaultClock(): number {
    // `performance` is monotonic in both browsers and modern Node.js.
    if (typeof globalThis.performance?.now === "function") {
      return globalThis.performance.now();
    }

    // Node.js fallback. Keep this branch dynamically evaluated so the module
    // remains usable in browser builds without a Node.js import.
    const processObject = (globalThis as typeof globalThis & {
      process?: { hrtime?: { bigint?: () => bigint } };
    }).process;
    const hrtimeBigint = processObject?.hrtime?.bigint;
    if (typeof hrtimeBigint === "function") {
      return Number(hrtimeBigint()) / 1_000_000;
    }

    // This should only be reachable in a non-standard runtime. Date.now() is
    // not monotonic, but provides a final compatibility fallback.
    return Date.now();
  }
}
