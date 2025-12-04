/**
 * Retry utility module for handling transient API errors with exponential backoff
 * and timeout support for API calls
 */

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 4,        // 5 total attempts (1 initial + 4 retries)
  baseDelay: 1000,      // 1 second
  maxDelay: 30000,      // 30 seconds max
};

/**
 * Custom error class for timeout errors
 */
export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Retry options interface
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: any, delay: number) => void;
}

/**
 * Custom error class to identify retryable errors
 */
export class RetryableError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'RetryableError';
    Object.setPrototypeOf(this, RetryableError.prototype);
  }
}

/**
 * Checks if an error is retryable based on error type, message, and status codes
 * 
 * @param error - The error object to check
 * @returns true if the error is retryable, false otherwise
 */
export function isRetryableError(error: any): boolean {
  if (!error) {
    return false;
  }

  // Check error message for retryable keywords
  const errorMessage = String(error.message || error.toString() || '').toLowerCase();
  const retryableKeywords = [
    'model is overloaded',
    'overloaded',
    'rate limit',
    'quota',
    'try again later',
    'service unavailable',
    'temporary',
    'timeout',
    'connection',
    'network',
    'econnreset',
    'etimedout',
    'econnrefused',
  ];

  const hasRetryableKeyword = retryableKeywords.some(keyword => 
    errorMessage.includes(keyword)
  );

  if (hasRetryableKeyword) {
    return true;
  }

  // Check HTTP status codes
  // Retryable: 429 (Too Many Requests), 500 (Internal Server Error), 
  // 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout)
  const status = error.status || error.statusCode || error.code;
  const retryableStatusCodes = [429, 500, 502, 503, 504];
  
  if (status && retryableStatusCodes.includes(Number(status))) {
    return true;
  }

  // Check for network error types
  const errorName = String(error.name || '').toLowerCase();
  const networkErrorNames = [
    'networkerror',
    'timeouterror',
    'connectionerror',
    'econnreset',
    'etimedout',
    'econnrefused',
    'enotfound',
  ];

  if (networkErrorNames.some(name => errorName.includes(name))) {
    return true;
  }

  // Check for specific error codes from @google/genai SDK
  // The SDK might use different error structures
  if (error.code) {
    const errorCode = String(error.code).toLowerCase();
    if (errorCode.includes('rate_limit') || 
        errorCode.includes('quota') || 
        errorCode.includes('overload') ||
        errorCode.includes('unavailable')) {
      return true;
    }
  }

  // Non-retryable: 4xx errors (except 429), authentication errors, validation errors
  if (status) {
    const statusNum = Number(status);
    // 4xx errors (except 429) are not retryable
    if (statusNum >= 400 && statusNum < 500 && statusNum !== 429) {
      return false;
    }
    // Authentication errors (401) are not retryable
    if (statusNum === 401 || statusNum === 403) {
      return false;
    }
  }

  // Check for authentication/authorization errors in message
  const authKeywords = ['unauthorized', 'forbidden', 'authentication', 'invalid api key', 'invalid key'];
  if (authKeywords.some(keyword => errorMessage.includes(keyword))) {
    return false;
  }

  // Default: not retryable if we can't determine
  return false;
}

/**
 * Calculates exponential backoff delay with jitter
 * 
 * @param attempt - The current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns The calculated delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter: 30% random variation to prevent thundering herd
  const jitter = exponentialDelay * 0.3 * Math.random();
  const delayWithJitter = exponentialDelay + jitter;
  
  // Cap at maxDelay
  return Math.min(delayWithJitter, maxDelay);
}

/**
 * Sleep utility for delays
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws The last error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries,
    baseDelay = DEFAULT_RETRY_CONFIG.baseDelay,
    maxDelay = DEFAULT_RETRY_CONFIG.maxDelay,
    onRetry,
  } = options;

  let lastError: any;
  let attempt = 0;
  const totalAttempts = maxRetries + 1; // Initial attempt + retries

  while (attempt < totalAttempts) {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        // Not retryable, throw immediately
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt >= totalAttempts - 1) {
        throw error;
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);

      // Log retry attempt
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      } else {
        // Default logging
        const errorMessage = error?.message || String(error);
        console.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms. Error: ${errorMessage}`
        );
      }

      // Wait before retrying
      await sleep(delay);

      attempt++;
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error('Retry exhausted without error');
}

/**
 * Wraps a promise with a timeout
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message (optional)
 * @returns The promise result if completed within timeout
 * @throws TimeoutError if timeout is exceeded
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        const message = errorMessage || `Operation timed out after ${timeoutMs}ms`;
        reject(new TimeoutError(message, timeoutMs));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Stream timeout options
 */
export interface StreamTimeoutOptions {
  firstTokenTimeout?: number;
  heartbeatInterval?: number;
  onTimeout?: () => void;
  onHeartbeatWarning?: (timeSinceLastChunk: number) => void;
}

/**
 * Wraps an async generator (stream) with timeout monitoring
 * Tracks time-to-first-token and monitors heartbeat between chunks
 * 
 * @param stream - The async generator to wrap
 * @param timeoutMs - Timeout in milliseconds for first token (or options object)
 * @param onTimeout - Callback function called when timeout occurs (if timeoutMs is a number)
 * @returns An async generator that yields the same values with timeout monitoring
 */
export async function* withStreamTimeout<T>(
  stream: AsyncGenerator<T>,
  timeoutMs: number | StreamTimeoutOptions,
  onTimeout?: () => void
): AsyncGenerator<T> {
  // Parse options
  let firstTokenTimeout: number;
  let heartbeatInterval: number | undefined;
  let timeoutCallback: (() => void) | undefined;
  let heartbeatWarningCallback: ((timeSinceLastChunk: number) => void) | undefined;

  if (typeof timeoutMs === 'number') {
    // Legacy API: timeoutMs is a number, onTimeout is a separate parameter
    firstTokenTimeout = timeoutMs;
    timeoutCallback = onTimeout;
  } else {
    // New API: timeoutMs is an options object
    const options = timeoutMs;
    firstTokenTimeout = options.firstTokenTimeout || 45000;
    heartbeatInterval = options.heartbeatInterval;
    timeoutCallback = options.onTimeout;
    heartbeatWarningCallback = options.onHeartbeatWarning;
  }

  let firstTokenReceived = false;
  let timeoutId: NodeJS.Timeout | null = null;
  let heartbeatId: NodeJS.Timeout | null = null;
  let streamDone = false;
  let timeoutTriggered = false;
  let lastChunkTime = Date.now();

  // Set up timeout for first token
  const startFirstTokenTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (!firstTokenReceived && !streamDone) {
        timeoutTriggered = true;
        if (timeoutCallback) {
          timeoutCallback();
        }
        console.warn(`Stream timeout: no first token received within ${firstTokenTimeout}ms`);
      }
    }, firstTokenTimeout);
  };

  // Set up heartbeat monitoring (warns if chunks are too slow)
  const startHeartbeatMonitoring = () => {
    if (!heartbeatInterval) {
      return;
    }

    const checkHeartbeat = () => {
      if (streamDone || !firstTokenReceived) {
        return;
      }

      const timeSinceLastChunk = Date.now() - lastChunkTime;
      if (timeSinceLastChunk > heartbeatInterval!) {
        if (heartbeatWarningCallback) {
          heartbeatWarningCallback(timeSinceLastChunk);
        } else {
          console.warn(
            `Stream heartbeat warning: no chunk received for ${timeSinceLastChunk}ms (threshold: ${heartbeatInterval}ms)`
          );
        }
      }

      // Schedule next check
      heartbeatId = setTimeout(checkHeartbeat, heartbeatInterval);
    };

    // Start monitoring after first token
    if (firstTokenReceived) {
      heartbeatId = setTimeout(checkHeartbeat, heartbeatInterval);
    }
  };

  // Start monitoring
  startFirstTokenTimeout();

  try {
    for await (const chunk of stream) {
      // Update last chunk time for heartbeat monitoring
      lastChunkTime = Date.now();

      // Clear first token timeout once first token is received
      if (!firstTokenReceived) {
        firstTokenReceived = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        // Start heartbeat monitoring after first token
        startHeartbeatMonitoring();
      }

      // Check if timeout was triggered
      if (timeoutTriggered) {
        throw new TimeoutError(
          `Stream timeout: first token did not arrive within ${firstTokenTimeout}ms`,
          firstTokenTimeout
        );
      }

      yield chunk;
    }

    streamDone = true;
  } catch (error) {
    streamDone = true;
    // Clean up timeouts
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (heartbeatId) {
      clearTimeout(heartbeatId);
      heartbeatId = null;
    }
    
    // Re-throw the error
    throw error;
  } finally {
    // Ensure timeouts are cleared
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (heartbeatId) {
      clearTimeout(heartbeatId);
      heartbeatId = null;
    }
  }
}

