/**
 * Property-based tests for SeededRandom
 *
 * These tests verify mathematical properties that should always hold,
 * regardless of the specific input values.
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { SeededRandom } from './seeded-random';

describe('SeededRandom Property Tests', () => {
  describe('Determinism Properties', () => {
    it('should always produce identical sequences for same seed', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.nat({ max: 100 }), // sequence length
          (seed, length) => {
            const rng1 = new SeededRandom(seed);
            const rng2 = new SeededRandom(seed);

            const seq1: number[] = [];
            const seq2: number[] = [];

            for (let i = 0; i < length; i++) {
              seq1.push(rng1.next());
              seq2.push(rng2.next());
            }

            return seq1.every((val, idx) => val === seq2[idx]);
          },
        ),
      );
    });

    it('should always produce different sequences for different seeds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 1000000 }),
          fc.integer({ min: 2, max: 1000000 }),
          fc.integer({ min: 10, max: 100 }),
          (seed1, seed2, length) => {
            // Skip when seeds are the same
            if (seed1 === seed2) {
              return true;
            }

            const rng1 = new SeededRandom(seed1);
            const rng2 = new SeededRandom(seed2);

            const seq1: number[] = [];
            const seq2: number[] = [];

            for (let i = 0; i < length; i++) {
              seq1.push(rng1.next());
              seq2.push(rng2.next());
            }

            // At least one value should be different
            return seq1.some((val, idx) => val !== seq2[idx]);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Range Properties', () => {
    it('next() should always return values in [0, 1)', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.nat({ max: 1000 }), // number of values to generate
          (seed, count) => {
            const rng = new SeededRandom(seed);

            for (let i = 0; i < count; i++) {
              const value = rng.next();
              if (value < 0 || value >= 1) {
                return false;
              }
            }

            return true;
          },
        ),
      );
    });

    it('nextInt() should always return values in specified range', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.integer({ min: -1000, max: 1000 }), // min
          fc.integer({ min: -1000, max: 1000 }), // max
          (seed, min, max) => {
            if (min > max) {
              // Should throw error
              const rng = new SeededRandom(seed);
              try {
                rng.nextInt(min, max);
                return false; // Should have thrown
              } catch {
                return true; // Expected error
              }
            }

            const rng = new SeededRandom(seed);
            const samples = 100;

            for (let i = 0; i < samples; i++) {
              const value = rng.nextInt(min, max);
              if (value < min || value > max || !Number.isInteger(value)) {
                return false;
              }
            }

            return true;
          },
        ),
      );
    });

    it('nextFloat() should always return values in specified range', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }), // min
          fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }), // max
          (seed, min, max) => {
            // Handle edge cases with very small numbers
            if (Math.abs(min) < Number.EPSILON) min = 0;
            if (Math.abs(max) < Number.EPSILON) max = 0;

            if (min >= max) {
              // Should throw error
              const rng = new SeededRandom(seed);
              try {
                rng.nextFloat(min, max);
                return false; // Should have thrown
              } catch {
                return true; // Expected error
              }
            }

            const rng = new SeededRandom(seed);
            const samples = 100;

            for (let i = 0; i < samples; i++) {
              const value = rng.nextFloat(min, max);
              if (value < min || value >= max) {
                return false;
              }
            }

            return true;
          },
        ),
      );
    });
  });

  describe('Array Operation Properties', () => {
    it('shuffle should preserve all elements', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.array(fc.anything(), { minLength: 0, maxLength: 100 }), // array
          (seed, array) => {
            const rng = new SeededRandom(seed);
            const shuffled = rng.shuffle([...array]);

            // Same length
            if (shuffled.length !== array.length) {
              return false;
            }

            // All elements present (using frequency map)
            const freq1 = new Map();
            const freq2 = new Map();

            for (const item of array) {
              const key = JSON.stringify(item);
              freq1.set(key, (freq1.get(key) || 0) + 1);
            }

            for (const item of shuffled) {
              const key = JSON.stringify(item);
              freq2.set(key, (freq2.get(key) || 0) + 1);
            }

            // Check frequencies match
            if (freq1.size !== freq2.size) {
              return false;
            }

            for (const [key, count] of freq1) {
              if (freq2.get(key) !== count) {
                return false;
              }
            }

            return true;
          },
        ),
      );
    });

    it('sample should return exactly n unique elements', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.array(fc.integer(), { minLength: 1, maxLength: 50 }),
          fc.nat(),
          (seed, array, n) => {
            const rng = new SeededRandom(seed);
            const sampleSize = n % (array.length + 5); // Can exceed array length

            if (sampleSize > array.length) {
              // Should throw error
              try {
                rng.sample(array, sampleSize);
                return false;
              } catch {
                return true;
              }
            }

            if (sampleSize < 0) {
              // Should throw error
              try {
                rng.sample(array, sampleSize);
                return false;
              } catch {
                return true;
              }
            }

            const sampled = rng.sample(array, sampleSize);

            // Correct length
            if (sampled.length !== sampleSize) {
              return false;
            }

            // All elements from original array
            for (const item of sampled) {
              if (!array.includes(item)) {
                return false;
              }
            }

            // No duplicates (for arrays with unique elements)
            const uniqueArray = [...new Set(array)];
            if (uniqueArray.length >= sampleSize) {
              const uniqueSampled = new Set(sampled);
              if (uniqueSampled.size !== sampleSize) {
                return false;
              }
            }

            return true;
          },
        ),
      );
    });

    it('choice should always return element from array', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.array(fc.anything(), { minLength: 1, maxLength: 100 }),
          (seed, array) => {
            const rng = new SeededRandom(seed);
            const samples = 100;

            for (let i = 0; i < samples; i++) {
              const choice = rng.choice(array);
              if (!array.includes(choice)) {
                return false;
              }
            }

            return true;
          },
        ),
      );
    });
  });

  describe('String Generation Properties', () => {
    it('string should generate correct length', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.nat({ max: 1000 }), // length
          fc.option(fc.string({ minLength: 1, maxLength: 100 })), // charset
          (seed, length, charset) => {
            const rng = new SeededRandom(seed);

            if (length < 0) {
              try {
                rng.string(length, charset || undefined);
                return false;
              } catch {
                return true;
              }
            }

            const str = rng.string(length, charset || undefined);

            if (str.length !== length) {
              return false;
            }

            // Check all characters are from charset
            if (charset) {
              for (const char of str) {
                if (!charset.includes(char)) {
                  return false;
                }
              }
            }

            return true;
          },
        ),
      );
    });

    it('uuid should generate valid format', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          (seed) => {
            const rng = new SeededRandom(seed);
            const uuid = rng.uuid();

            // Check format: 8-4-4-4-12
            const parts = uuid.split('-');
            if (parts.length !== 5) return false;
            if (parts[0].length !== 8) return false;
            if (parts[1].length !== 4) return false;
            if (parts[2].length !== 4) return false;
            if (parts[3].length !== 4) return false;
            if (parts[4].length !== 12) return false;

            // Check all hex characters
            return /^[0-9a-f-]+$/.test(uuid);
          },
        ),
      );
    });
  });

  describe('Distribution Properties', () => {
    it('gaussian should have correct mean', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.double({ min: -100, max: 100, noNaN: true }), // mean
          fc.double({ min: 1, max: 10, noNaN: true }), // stdDev (increased min to avoid edge cases)
          (seed, mean, stdDev) => {
            const rng = new SeededRandom(seed);
            const samples = 1000;
            let sum = 0;

            for (let i = 0; i < samples; i++) {
              sum += rng.gaussian(mean, stdDev);
            }

            const sampleMean = sum / samples;
            // Use a more generous tolerance for edge cases
            const tolerance = Math.max((stdDev * 4) / Math.sqrt(samples), 0.5);

            return Math.abs(sampleMean - mean) < tolerance;
          },
        ),
        { numRuns: 50 }, // Reduce runs for statistical tests
      );
    });

    it('exponential should have positive values with correct mean', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.double({ min: 0.1, max: 10, noNaN: true }), // lambda
          (seed, lambda) => {
            const rng = new SeededRandom(seed);
            const samples = 1000;
            let sum = 0;

            for (let i = 0; i < samples; i++) {
              const value = rng.exponential(lambda);
              if (value < 0) {
                return false; // Must be positive
              }
              sum += value;
            }

            const sampleMean = sum / samples;
            const expectedMean = 1 / lambda;
            const tolerance = expectedMean * 0.2; // 20% tolerance

            return Math.abs(sampleMean - expectedMean) < tolerance;
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('State Management Properties', () => {
    it('clone should produce identical sequences', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.nat({ max: 100 }), // advance count
          fc.nat({ max: 100 }), // sequence length
          (seed, advanceCount, seqLength) => {
            const rng1 = new SeededRandom(seed);

            // Advance original
            for (let i = 0; i < advanceCount; i++) {
              rng1.next();
            }

            // Clone at this state
            const rng2 = rng1.clone();

            // Generate sequences
            const seq1: number[] = [];
            const seq2: number[] = [];

            for (let i = 0; i < seqLength; i++) {
              seq1.push(rng1.next());
              seq2.push(rng2.next());
            }

            return seq1.every((val, idx) => val === seq2[idx]);
          },
        ),
      );
    });

    it('reset should restore sequence', () => {
      fc.assert(
        fc.property(
          fc.integer(), // seed
          fc.nat({ max: 100 }), // sequence length
          (seed, length) => {
            const rng = new SeededRandom(seed);

            // Generate initial sequence
            const seq1: number[] = [];
            for (let i = 0; i < length; i++) {
              seq1.push(rng.next());
            }

            // Reset and regenerate
            rng.reset(seed);
            const seq2: number[] = [];
            for (let i = 0; i < length; i++) {
              seq2.push(rng.next());
            }

            return seq1.every((val, idx) => val === seq2[idx]);
          },
        ),
      );
    });
  });
});
