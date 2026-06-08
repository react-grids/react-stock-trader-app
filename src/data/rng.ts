// Small deterministic PRNG (mulberry32) so the mocked universe is stable
// across reloads — important for a demo where layout/data shouldn't jump.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gaussian-ish noise in [-1, 1] from a uniform generator (sum of 3). */
export function noise(rand: () => number): number {
  return (rand() + rand() + rand()) / 1.5 - 1;
}

export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function range(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

export function intRange(rand: () => number, min: number, max: number): number {
  return Math.floor(range(rand, min, max + 1));
}
