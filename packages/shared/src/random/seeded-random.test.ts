import { describe, it, expect } from 'vitest';
import { SeededRandom, MathRandomGenerator } from './seeded-random';

describe('SeededRandom', () => {
  describe('Determinism', () => {
    it('should produce identical sequences with same seed', () => {
      const seed = 12345;
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      const sequence1: number[] = [];
      const sequence2: number[] = [];

      for (let i = 0; i < 100; i++) {
        sequence1.push(rng1.next());
        sequence2.push(rng2.next());
      }

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(67890);

      const sequence1: number[] = [];
      const sequence2: number[] = [];

      for (let i = 0; i < 100; i++) {
        sequence1.push(rng1.next());
        sequence2.push(rng2.next());
      }

      expect(sequence1).not.toEqual(sequence2);
    });

    it('should handle edge case seeds correctly', () => {
      // Test with 0 (should convert to 1)
      const rng0 = new SeededRandom(0);
      const rng1 = new SeededRandom(1);

      expect(rng0.next()).toBe(rng1.next());

      // Test with negative seed (should use absolute value)
      const rngNeg = new SeededRandom(-12345);
      const rngPos = new SeededRandom(12345);

      expect(rngNeg.next()).toBe(rngPos.next());

      // Test with very large seed
      const rngLarge = new SeededRandom(Number.MAX_SAFE_INTEGER);
      expect(rngLarge.next()).toBeGreaterThanOrEqual(0);
      expect(rngLarge.next()).toBeLessThan(1);
    });

    it('should verify implementation correctness', () => {
      expect(SeededRandom.verify()).toBe(true);
    });
  });

  describe('Statistical Properties', () => {
    it('should generate uniform distribution', () => {
      const rng = new SeededRandom(42);
      const samples = 10000;
      const buckets = 10;
      const counts = new Array(buckets).fill(0);

      for (let i = 0; i < samples; i++) {
        const value = rng.next();
        const bucket = Math.floor(value * buckets);
        counts[Math.min(bucket, buckets - 1)]++;
      }

      const expected = samples / buckets;
      const tolerance = expected * 0.1; // 10% tolerance

      counts.forEach((count) => {
        expect(Math.abs(count - expected)).toBeLessThan(tolerance);
      });
    });

    it('should pass chi-square test for uniformity', () => {
      const rng = new SeededRandom(12345);
      const samples = 1000;
      const buckets = 10;
      const counts = new Array(buckets).fill(0);

      for (let i = 0; i < samples; i++) {
        const value = rng.next();
        const bucket = Math.floor(value * buckets);
        counts[Math.min(bucket, buckets - 1)]++;
      }

      const expected = samples / buckets;
      let chiSquare = 0;

      counts.forEach((observed) => {
        chiSquare += Math.pow(observed - expected, 2) / expected;
      });

      // Critical value for 9 degrees of freedom at 0.05 significance
      const criticalValue = 16.919;
      expect(chiSquare).toBeLessThan(criticalValue);
    });

    it('should have correct mean and variance', () => {
      const rng = new SeededRandom(9999);
      const samples = 10000;
      let sum = 0;
      let sumSquares = 0;

      for (let i = 0; i < samples; i++) {
        const value = rng.next();
        sum += value;
        sumSquares += value * value;
      }

      const mean = sum / samples;
      const variance = sumSquares / samples - mean * mean;

      // Theoretical mean = 0.5, variance = 1/12 ≈ 0.0833
      expect(Math.abs(mean - 0.5)).toBeLessThan(0.01);
      expect(Math.abs(variance - 1 / 12)).toBeLessThan(0.01);
    });

    it('should have minimal correlation between consecutive values', () => {
      const rng = new SeededRandom(7777);
      const samples = 1000;
      const values: number[] = [];

      for (let i = 0; i < samples; i++) {
        values.push(rng.next());
      }

      // Calculate autocorrelation at lag 1
      let sum1 = 0,
        sum2 = 0,
        sumProd = 0;
      for (let i = 0; i < samples - 1; i++) {
        sum1 += values[i];
        sum2 += values[i + 1];
        sumProd += values[i] * values[i + 1];
      }

      const mean1 = sum1 / (samples - 1);
      const mean2 = sum2 / (samples - 1);
      const correlation =
        (sumProd / (samples - 1) - mean1 * mean2) / (Math.sqrt(1 / 12) * Math.sqrt(1 / 12)); // Using theoretical variance

      // Correlation should be close to 0
      expect(Math.abs(correlation)).toBeLessThan(0.1);
    });
  });

  describe('nextInt', () => {
    it('should generate integers within range', () => {
      const rng = new SeededRandom(123);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThanOrEqual(20);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should handle single value range', () => {
      const rng = new SeededRandom(456);

      for (let i = 0; i < 10; i++) {
        expect(rng.nextInt(5, 5)).toBe(5);
      }
    });

    it('should throw on invalid range', () => {
      const rng = new SeededRandom(789);
      expect(() => rng.nextInt(10, 5)).toThrow('Invalid range');
    });

    it('should distribute evenly across range', () => {
      const rng = new SeededRandom(111);
      const min = 1,
        max = 6;
      const counts = new Map<number, number>();
      const samples = 6000;

      for (let i = min; i <= max; i++) {
        counts.set(i, 0);
      }

      for (let i = 0; i < samples; i++) {
        const value = rng.nextInt(min, max);
        counts.set(value, counts.get(value)! + 1);
      }

      const expected = samples / (max - min + 1);
      counts.forEach((count) => {
        expect(Math.abs(count - expected)).toBeLessThan(expected * 0.15);
      });
    });
  });

  describe('nextFloat', () => {
    it('should generate floats within range', () => {
      const rng = new SeededRandom(234);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(1.5, 2.5);
        expect(value).toBeGreaterThanOrEqual(1.5);
        expect(value).toBeLessThan(2.5);
      }
    });

    it('should throw on invalid range', () => {
      const rng = new SeededRandom(345);
      expect(() => rng.nextFloat(2.5, 1.5)).toThrow('Invalid range');
    });
  });

  describe('nextBoolean', () => {
    it('should generate booleans with default 50% probability', () => {
      const rng = new SeededRandom(567);
      let trueCount = 0;
      const samples = 1000;

      for (let i = 0; i < samples; i++) {
        if (rng.nextBoolean()) trueCount++;
      }

      expect(Math.abs(trueCount - 500)).toBeLessThan(50);
    });

    it('should respect custom probability', () => {
      const rng = new SeededRandom(678);
      let trueCount = 0;
      const samples = 1000;
      const probability = 0.3;

      for (let i = 0; i < samples; i++) {
        if (rng.nextBoolean(probability)) trueCount++;
      }

      expect(Math.abs(trueCount - 300)).toBeLessThan(50);
    });

    it('should handle extreme probabilities', () => {
      const rng = new SeededRandom(789);

      for (let i = 0; i < 10; i++) {
        expect(rng.nextBoolean(0)).toBe(false);
      }

      for (let i = 0; i < 10; i++) {
        expect(rng.nextBoolean(1)).toBe(true);
      }
    });

    it('should throw on invalid probability', () => {
      const rng = new SeededRandom(890);
      expect(() => rng.nextBoolean(-0.1)).toThrow('Probability must be between 0 and 1');
      expect(() => rng.nextBoolean(1.1)).toThrow('Probability must be between 0 and 1');
    });
  });

  describe('choice', () => {
    it('should select elements from array', () => {
      const rng = new SeededRandom(901);
      const array = ['a', 'b', 'c', 'd', 'e'];

      for (let i = 0; i < 20; i++) {
        const choice = rng.choice(array);
        expect(array).toContain(choice);
      }
    });

    it('should distribute choices evenly', () => {
      const rng = new SeededRandom(234);
      const array = [1, 2, 3, 4];
      const counts = new Map<number, number>();
      const samples = 4000;

      array.forEach((item) => counts.set(item, 0));

      for (let i = 0; i < samples; i++) {
        const choice = rng.choice(array);
        counts.set(choice, counts.get(choice)! + 1);
      }

      const expected = samples / array.length;
      counts.forEach((count) => {
        expect(Math.abs(count - expected)).toBeLessThan(expected * 0.15);
      });
    });

    it('should throw on empty array', () => {
      const rng = new SeededRandom(345);
      expect(() => rng.choice([])).toThrow('Cannot choose from empty array');
    });
  });

  describe('shuffle', () => {
    it('should preserve all elements', () => {
      const rng = new SeededRandom(456);
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle([...original]);

      expect(shuffled.length).toBe(original.length);
      expect(new Set(shuffled)).toEqual(new Set(original));
    });

    it('should produce different permutations', () => {
      const rng = new SeededRandom(567);
      const array = [1, 2, 3, 4, 5];
      const permutations = new Set<string>();

      for (let i = 0; i < 20; i++) {
        const shuffled = rng.shuffle([...array]);
        permutations.add(JSON.stringify(shuffled));
      }

      // Should generate multiple different permutations
      expect(permutations.size).toBeGreaterThan(5);
    });

    it('should be deterministic with same seed', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const rng1 = new SeededRandom(678);
      const shuffled1 = rng1.shuffle([...array]);

      const rng2 = new SeededRandom(678);
      const shuffled2 = rng2.shuffle([...array]);

      expect(shuffled1).toEqual(shuffled2);
    });
  });

  describe('sample', () => {
    it('should sample correct number of elements', () => {
      const rng = new SeededRandom(789);
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const sample = rng.sample(array, 5);

      expect(sample.length).toBe(5);
      sample.forEach((item) => {
        expect(array).toContain(item);
      });
    });

    it('should sample without replacement', () => {
      const rng = new SeededRandom(890);
      const array = [1, 2, 3, 4, 5];
      const sample = rng.sample(array, 5);

      expect(new Set(sample).size).toBe(5);
    });

    it('should throw on invalid sample size', () => {
      const rng = new SeededRandom(901);
      const array = [1, 2, 3];

      expect(() => rng.sample(array, 4)).toThrow('Cannot sample 4 elements from array of length 3');
      expect(() => rng.sample(array, -1)).toThrow('Sample size must be non-negative');
    });
  });

  describe('string', () => {
    it('should generate strings of correct length', () => {
      const rng = new SeededRandom(123);

      for (let len = 0; len <= 20; len++) {
        const str = rng.string(len);
        expect(str.length).toBe(len);
      }
    });

    it('should use custom charset', () => {
      const rng = new SeededRandom(234);
      const charset = 'ABC';
      const str = rng.string(100, charset);

      for (const char of str) {
        expect(charset).toContain(char);
      }
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(345);
      const rng2 = new SeededRandom(345);

      expect(rng1.string(20)).toBe(rng2.string(20));
    });

    it('should throw on negative length', () => {
      const rng = new SeededRandom(456);
      expect(() => rng.string(-1)).toThrow('String length must be non-negative');
    });
  });

  describe('uuid', () => {
    it('should generate UUID-like strings', () => {
      const rng = new SeededRandom(567);
      const uuid = rng.uuid();

      // Check format: 8-4-4-4-12
      const parts = uuid.split('-');
      expect(parts.length).toBe(5);
      expect(parts[0].length).toBe(8);
      expect(parts[1].length).toBe(4);
      expect(parts[2].length).toBe(4);
      expect(parts[3].length).toBe(4);
      expect(parts[4].length).toBe(12);

      // Check all characters are hex
      expect(/^[0-9a-f-]+$/.test(uuid)).toBe(true);
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom(678);
      const rng2 = new SeededRandom(678);

      expect(rng1.uuid()).toBe(rng2.uuid());
    });
  });

  describe('gaussian', () => {
    it('should generate normally distributed values', () => {
      const rng = new SeededRandom(789);
      const samples = 10000;
      let sum = 0;
      let sumSquares = 0;

      for (let i = 0; i < samples; i++) {
        const value = rng.gaussian(0, 1);
        sum += value;
        sumSquares += value * value;
      }

      const mean = sum / samples;
      const variance = sumSquares / samples - mean * mean;

      // Should be close to N(0, 1)
      expect(Math.abs(mean)).toBeLessThan(0.05);
      expect(Math.abs(variance - 1)).toBeLessThan(0.1);
    });

    it('should respect custom mean and stdDev', () => {
      const rng = new SeededRandom(890);
      const samples = 10000;
      const targetMean = 100;
      const targetStdDev = 15;
      let sum = 0;

      for (let i = 0; i < samples; i++) {
        sum += rng.gaussian(targetMean, targetStdDev);
      }

      const mean = sum / samples;
      expect(Math.abs(mean - targetMean)).toBeLessThan(1);
    });
  });

  describe('exponential', () => {
    it('should generate exponentially distributed values', () => {
      const rng = new SeededRandom(901);
      const samples = 10000;
      const lambda = 2;
      let sum = 0;

      for (let i = 0; i < samples; i++) {
        const value = rng.exponential(lambda);
        expect(value).toBeGreaterThanOrEqual(0);
        sum += value;
      }

      const mean = sum / samples;
      const expectedMean = 1 / lambda;

      expect(Math.abs(mean - expectedMean)).toBeLessThan(0.05);
    });

    it('should throw on invalid lambda', () => {
      const rng = new SeededRandom(234);
      expect(() => rng.exponential(0)).toThrow('Lambda must be positive');
      expect(() => rng.exponential(-1)).toThrow('Lambda must be positive');
    });
  });

  describe('clone', () => {
    it('should create independent copy with same state', () => {
      const rng1 = new SeededRandom(123);

      // Advance original
      rng1.next();
      rng1.next();

      const rng2 = rng1.clone();

      // Both should produce same next value
      expect(rng1.next()).toBe(rng2.next());

      // But advancing one shouldn't affect the other
      rng1.next();
      const rng3 = rng1.clone();

      expect(rng2.next()).not.toBe(rng3.next());
    });
  });

  describe('reset', () => {
    it('should reset to initial seed', () => {
      const seed = 456;
      const rng = new SeededRandom(seed);

      const value1 = rng.next();
      const value2 = rng.next();

      rng.reset(seed);

      expect(rng.next()).toBe(value1);
      expect(rng.next()).toBe(value2);
    });

    it('should handle new seed on reset', () => {
      const rng1 = new SeededRandom(123);
      const rng2 = new SeededRandom(456);

      const value2 = rng2.next();

      rng1.reset(456);
      expect(rng1.next()).toBe(value2);
    });
  });

  describe('Integration with ConversationFactory', () => {
    it('should be compatible with RandomGenerator interface', () => {
      const rng: SeededRandom = new SeededRandom(789);

      // Test that SeededRandom implements all required methods
      expect(typeof rng.next).toBe('function');
      expect(typeof rng.nextInt).toBe('function');
      expect(typeof rng.nextFloat).toBe('function');
      expect(typeof rng.nextBoolean).toBe('function');
      expect(typeof rng.choice).toBe('function');
      expect(typeof rng.shuffle).toBe('function');
      expect(typeof rng.sample).toBe('function');
    });
  });

  describe('MathRandomGenerator', () => {
    it('should implement RandomGenerator interface', () => {
      const rng = new MathRandomGenerator();

      // Test basic functionality
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);

      const intValue = rng.nextInt(1, 10);
      expect(intValue).toBeGreaterThanOrEqual(1);
      expect(intValue).toBeLessThanOrEqual(10);

      const boolValue = rng.nextBoolean();
      expect(typeof boolValue).toBe('boolean');

      const array = [1, 2, 3, 4, 5];
      const choice = rng.choice(array);
      expect(array).toContain(choice);

      const shuffled = rng.shuffle([...array]);
      expect(shuffled.length).toBe(array.length);

      const sampled = rng.sample(array, 3);
      expect(sampled.length).toBe(3);
    });
  });
});
