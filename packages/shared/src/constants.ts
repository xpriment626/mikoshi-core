/**
 * Shared constants for Mikoshi
 */

/**
 * Conversation format constants
 */
export const CONVERSATION_FORMATS = {
  AUTOGEN: 'autogen',
  LANGCHAIN: 'langchain',
  CREW: 'crew',
  CUSTOM: 'custom',
} as const;

/**
 * Agent status constants
 */
export const AGENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
} as const;

/**
 * Chaos mode constants
 */
export const CHAOS_MODES = {
  MESSAGE_LOSS: 'message-loss',
  DELAY: 'delay',
  REORDER: 'reorder',
  CORRUPTION: 'corruption',
  AGENT_FAILURE: 'agent-failure',
  NETWORK_PARTITION: 'network-partition',
} as const;

/**
 * Invariant types
 */
export const INVARIANT_TYPES = {
  SEQUENCE: 'sequence',
  CONTENT: 'content',
  TIMING: 'timing',
  STATE: 'state',
  CUSTOM: 'custom',
} as const;

/**
 * Severity levels
 */
export const SEVERITY_LEVELS = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

/**
 * Test status constants
 */
export const TEST_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  PASSED: 'passed',
  FAILED: 'failed',
  ERROR: 'error',
  SKIPPED: 'skipped',
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  // Timing
  MAX_LATENCY: 5000,
  MIN_LATENCY: 0,
  TIMEOUT: 30000,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,

  // Chaos
  MESSAGE_LOSS_RATE: 0.1,
  DELAY_MIN: 100,
  DELAY_MAX: 2000,
  REORDER_WINDOW: 5,
  CORRUPTION_RATE: 0.05,

  // Testing
  TEST_TIMEOUT: 60000,
  COVERAGE_THRESHOLD: 80,
  MAX_PARALLEL_TESTS: 10,

  // Messages
  MAX_MESSAGE_LENGTH: 10000,
  MAX_MESSAGES_PER_CONVERSATION: 10000,

  // Performance
  CHUNK_SIZE: 100,
  BATCH_SIZE: 50,
  CACHE_TTL: 3600000, // 1 hour
} as const;

/**
 * Regular expressions for validation
 */
export const REGEX_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  SSN: /\d{3}-\d{2}-\d{4}/,
  CREDIT_CARD: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/,
  API_KEY: /api[_-]?key[\s:=]+[\w-]{20,}/i,
  PASSWORD: /password[\s:=]+\S+/i,
  SEMVER: /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/,
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  CHAOS_ERROR: 'CHAOS_ERROR',
  INVARIANT_VIOLATION: 'INVARIANT_VIOLATION',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  NOT_FOUND: 'NOT_FOUND',
  AGENT_ERROR: 'AGENT_ERROR',
  TEST_EXECUTION_ERROR: 'TEST_EXECUTION_ERROR',
  AGGREGATE_ERROR: 'AGGREGATE_ERROR',
  RETRYABLE_ERROR: 'RETRYABLE_ERROR',
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * File size limits
 */
export const FILE_LIMITS = {
  MAX_UPLOAD_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_CONVERSATION_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_EXPORT_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

/**
 * Supported file extensions
 */
export const FILE_EXTENSIONS = {
  CONVERSATION: ['.json', '.yaml', '.yml'],
  EXPORT: ['.pdf', '.csv', '.json'],
  IMPORT: ['.json', '.yaml', '.yml', '.txt'],
} as const;

/**
 * Environment variables
 */
export const ENV_VARS = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  API_URL: process.env.API_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  ENABLE_TRACING: process.env.ENABLE_TRACING === 'true',
} as const;

/**
 * Feature flags
 */
export const FEATURES = {
  CHAOS_TESTING: true,
  ADVANCED_ANALYTICS: false,
  REAL_TIME_MONITORING: false,
  AI_SUGGESTIONS: false,
  MULTI_TENANCY: false,
} as const;