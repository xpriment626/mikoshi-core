import { beforeAll, afterEach, afterAll } from 'vitest';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TZ = 'UTC';
  
  // Mock console methods to reduce noise in tests
  if (process.env.SILENT_TESTS === 'true') {
    global.console = {
      ...console,
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  }
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
  vi.resetAllMocks();
});

afterAll(() => {
  // Clean up after all tests
  vi.restoreAllMocks();
});