/** Repeatable motion keeps architectural views and screenshots reproducible. */
export function seededRandom(seed = 731) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class MarketState {
  constructor() { this.open = false; this.elapsed = 100; this.count = 0; }
  toggle() { this.open = !this.open; this.elapsed = 0; this.count++; return this.open; }
  update(dt) { this.elapsed += dt; }
  get celebrating() { return this.elapsed < 8; }
  get label() { return this.open ? 'Market Open' : 'Market Close'; }
}

// A long oval stays clear of the stair, cube and reception columns.
export function walkingPosition(phase, lane = 0) {
  return [2.7 + (.9 + lane * .12) * Math.cos(phase), 0, 1.2 + 10.3 * Math.sin(phase)];
}
