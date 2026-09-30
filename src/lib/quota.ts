/**
 * In-memory daily quota tracker. Fine for a single instance; replace with
 * Redis/Postgres (INCR with a UTC-day key) when running multiple instances.
 */
const used = new Map<string, number>();

const day = () => new Date().toISOString().slice(0, 10);

export function dailyLimit(): number {
  return Number(process.env.GOOGLE_DAILY_QUOTA ?? 200);
}

export function remaining(): number {
  return Math.max(0, dailyLimit() - (used.get(day()) ?? 0));
}

/** Reserve up to `n` slots, returning how many were granted. */
export function reserve(n: number): number {
  const granted = Math.min(n, remaining());
  used.set(day(), (used.get(day()) ?? 0) + granted);
  return granted;
}
