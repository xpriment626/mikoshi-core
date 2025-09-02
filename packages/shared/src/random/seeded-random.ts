/**
 * SeededRandom - Deterministic random number generator using Linear Congruential Generator (LCG)
 *
 * This implementation provides reproducible pseudo-random numbers for testing purposes.
 * Uses the Park-Miller algorithm parameters for good statistical properties.
 *
 * @example
 * ```typescript
 * const rng = new SeededRandom(12345);
 * const value1 = rng.next(); // Always returns the same sequence
 * const value2 = rng.nextInt(1, 100); // Deterministic integer in range
 * ```
 */
export class SeededRandom {
  private seed: number;

  // Park-Miller constants for good statistical properties
  private static readonly MULTIPLIER = 48271;
  private static readonly MODULUS = 2147483647; // 2^31 - 1 (Mersenne prime)
  private static readonly CHECK = 1493962164; // Correct value after 10000 iterations with seed=1

  constructor(seed: number = Date.now()) {
    // Ensure seed is a positive integer
    this.seed = Math.abs(Math.floor(seed)) || 1;

    // Validate seed is within acceptable range
    if (this.seed >= SeededRandom.MODULUS) {
      this.seed = this.seed % SeededRandom.MODULUS;
    }

    // Ensure seed is not 0 (LCG requirement)
    if (this.seed === 0) {
      this.seed = 1;
    }
  }

  /**
   * Generate next random number in sequence [0, 1)
   */
  next(): number {
    this.seed = (this.seed * SeededRandom.MULTIPLIER) % SeededRandom.MODULUS;
    return (this.seed - 1) / (SeededRandom.MODULUS - 1);
  }

  /**
   * Generate random integer in range [min, max]
   */
  nextInt(min: number, max: number): number {
    if (min > max) {
      throw new Error(`Invalid range: min (${min}) must be <= max (${max})`);
    }

    const range = max - min + 1;
    return Math.floor(this.next() * range) + min;
  }

  /**
   * Generate random float in range [min, max)
   */
  nextFloat(min: number, max: number): number {
    if (min >= max) {
      throw new Error(`Invalid range: min (${min}) must be < max (${max})`);
    }

    return this.next() * (max - min) + min;
  }

  /**
   * Generate random boolean with optional probability
   */
  nextBoolean(probability: number = 0.5): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error(`Probability must be between 0 and 1, got ${probability}`);
    }

    return this.next() < probability;
  }

  /**
   * Select random element from array
   */
  choice<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }

    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Shuffle array in place (Fisher-Yates algorithm)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /**
   * Sample n elements from array without replacement
   */
  sample<T>(array: readonly T[], n: number): T[] {
    if (n > array.length) {
      throw new Error(`Cannot sample ${n} elements from array of length ${array.length}`);
    }

    if (n < 0) {
      throw new Error(`Sample size must be non-negative, got ${n}`);
    }

    const shuffled = this.shuffle([...array]);
    return shuffled.slice(0, n);
  }

  /**
   * Generate random string of specified length
   */
  string(length: number, charset?: string): string {
    const defaultCharset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const chars = charset || defaultCharset;

    if (length < 0) {
      throw new Error(`String length must be non-negative, got ${length}`);
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.choice(chars.split(''));
    }

    return result;
  }

  /**
   * Generate random UUID v4-like string (deterministic)
   */
  uuid(): string {
    const hex = '0123456789abcdef';
    const segments = [8, 4, 4, 4, 12];

    return segments.map((len) => this.string(len, hex)).join('-');
  }

  /**
   * Generate normally distributed random number using Box-Muller transform
   */
  gaussian(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    const u1 = this.next();
    const u2 = this.next();

    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Generate exponentially distributed random number
   */
  exponential(lambda: number = 1): number {
    if (lambda <= 0) {
      throw new Error(`Lambda must be positive, got ${lambda}`);
    }

    return -Math.log(1 - this.next()) / lambda;
  }

  /**
   * Clone the generator with current state
   */
  clone(): SeededRandom {
    return new SeededRandom(this.seed);
  }

  /**
   * Get current seed value (for persistence)
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Reset to initial seed
   */
  reset(seed?: number): void {
    if (seed !== undefined) {
      this.seed = Math.abs(Math.floor(seed)) || 1;

      if (this.seed >= SeededRandom.MODULUS) {
        this.seed = this.seed % SeededRandom.MODULUS;
      }

      if (this.seed === 0) {
        this.seed = 1;
      }
    }
  }

  /**
   * Static method to verify implementation correctness
   */
  static verify(): boolean {
    const rng = new SeededRandom(1);

    // Generate 10000th value
    for (let i = 0; i < 9999; i++) {
      rng.next();
    }

    // Check against known value for seed=1 after 10000 iterations
    return rng.getSeed() === SeededRandom.CHECK;
  }
}

/**
 * Global instance factory for convenience
 */
export function createSeededRandom(seed?: number): SeededRandom {
  return new SeededRandom(seed);
}

/**
 * Interface for abstracting random number generation
 * Allows swapping between SeededRandom and Math.random
 */
export interface RandomGenerator {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  nextBoolean(probability?: number): boolean;
  choice<T>(array: readonly T[]): T;
  shuffle<T>(array: T[]): T[];
  sample<T>(array: readonly T[], n: number): T[];
}

/**
 * Math.random adapter for RandomGenerator interface
 */
export class MathRandomGenerator implements RandomGenerator {
  next(): number {
    return Math.random();
  }

  nextInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  nextBoolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  choice<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  sample<T>(array: readonly T[], n: number): T[] {
    return this.shuffle([...array]).slice(0, n);
  }
}
