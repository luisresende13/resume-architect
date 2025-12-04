# Gemini API Reliability Implementation Plan

## Overview
This plan addresses two critical issues with Gemini 3.0 integration:
1. **Fast failures** with "model is overloaded. please try again later" errors
2. **Hanging requests** that take unacceptable time before first token arrives

## Implementation Phases

### Phase 1: Core Retry Infrastructure
**Goal**: Build reusable retry mechanism with exponential backoff

#### 1.1 Create Retry Utility Module
**File**: `services/retryUtils.ts`

**Components**:
- `RetryableError` class to identify retryable errors
- `isRetryableError(error: any): boolean` function
  - Checks for "model is overloaded" in error message
  - Checks for HTTP status codes: 429, 503, 502, 500
  - Checks for network errors (ECONNRESET, ETIMEDOUT, etc.)
  - Returns false for 4xx errors (except 429), authentication errors, validation errors
- `calculateBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number`
  - Exponential backoff: `baseDelay * Math.pow(2, attempt)`
  - Add jitter: `delay + Math.random() * delay * 0.3` (30% jitter)
  - Cap at maxDelay
- `sleep(ms: number): Promise<void>` utility for delays
- `retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T>`
  - Options: `maxRetries`, `baseDelay`, `maxDelay`, `onRetry` callback
  - Wraps function calls with retry logic
  - Throws last error if all retries exhausted

**Configuration**:
```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 4,        // 5 total attempts (1 initial + 4 retries)
  baseDelay: 1000,      // 1 second
  maxDelay: 30000,      // 30 seconds max
};
```

#### 1.2 Error Classification
**File**: `services/retryUtils.ts` (extend)

**Error Detection Logic**:
- Parse error objects from `@google/genai` SDK
- Check `error.message` for keywords: "overloaded", "rate limit", "quota", "try again later"
- Check `error.status` or `error.code` for HTTP status codes
- Check `error.name` for network error types
- Log error details for debugging

---

### Phase 2: Timeout Infrastructure
**Goal**: Add timeout support for all API calls

#### 2.1 Timeout Configuration
**File**: `services/geminiService.ts` (add constants)

**Configuration Constants**:
```typescript
const TIMEOUT_CONFIG = {
  connectionTimeout: 15000,    // 15 seconds to establish connection
  requestTimeout: 120000,      // 2 minutes for full request
  firstTokenTimeout: 45000,    // 45 seconds for first token in stream
  streamHeartbeatInterval: 10000, // 10 seconds between chunks (warning threshold)
};
```

#### 2.2 Timeout Wrapper for Non-Streaming Calls
**File**: `services/retryUtils.ts` (add)

**Function**: `withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T>`
- Wraps promise with timeout using `AbortController` or `Promise.race`
- Throws `TimeoutError` if timeout exceeded
- Cleans up timeout on success

#### 2.3 Timeout Wrapper for Streaming Calls
**File**: `services/retryUtils.ts` (add)

**Function**: `withStreamTimeout<T>(stream: AsyncGenerator<T>, timeoutMs: number, onTimeout: () => void): AsyncGenerator<T>`
- Wraps async generator with timeout monitoring
- Tracks time-to-first-token
- Aborts stream if no data within timeout
- Monitors heartbeat between chunks (warns if too slow)

**Implementation Strategy**:
- Use `AbortController` for cancellation
- Track `firstTokenReceived` flag
- Use `setTimeout` to trigger timeout
- Yield chunks as they arrive
- Clean up on completion or timeout

---

### Phase 3: Integrate Retry + Timeout into Gemini Service
**Goal**: Apply retry and timeout to all Gemini API calls

#### 3.1 Update `generateSection()` Function
**File**: `services/geminiService.ts`

**Changes**:
1. Wrap `ai.models.generateContent()` call with:
   - `withTimeout()` for request timeout
   - `retryWithBackoff()` for retry logic
2. Combine: `retryWithBackoff(() => withTimeout(apiCall, timeout), retryConfig)`
3. Add error context logging (section name, attempt number)
4. Preserve existing error handling for non-retryable errors

**Implementation**:
```typescript
export const generateSection = async (...) => {
  // ... existing prompt preparation ...
  
  const apiCall = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { ... }
    });
    return response;
  };

  try {
    const response = await retryWithBackoff(
      () => withTimeout(
        apiCall(),
        TIMEOUT_CONFIG.requestTimeout,
        `generateSection timeout for ${section}`
      ),
      {
        ...DEFAULT_RETRY_CONFIG,
        onRetry: (attempt, error) => {
          console.warn(`Retry ${attempt} for generateSection(${section}):`, error.message);
        }
      }
    );
    
    // ... existing JSON parsing logic ...
  } catch (error) {
    // Enhanced error handling
    if (error instanceof TimeoutError) {
      throw new Error(`Generation timed out for ${section}. Please try again.`);
    }
    throw error;
  }
};
```

#### 3.2 Update `generateFullProfile()` Function
**File**: `services/geminiService.ts`

**Changes**:
- Same pattern as `generateSection()`
- Use longer timeout (full profile is more complex)
- Add progress indication if possible

#### 3.3 Update `generateTailoredResumeStream()` Function
**File**: `services/geminiService.ts`

**Changes**:
1. Wrap stream creation with retry logic
2. Implement first-token timeout monitoring
3. Add stream heartbeat monitoring
4. Handle stream abortion gracefully

**Implementation Strategy**:
```typescript
export async function* generateTailoredResumeStream(...) {
  // ... existing prompt preparation ...
  
  let attempt = 0;
  const maxAttempts = DEFAULT_RETRY_CONFIG.maxRetries + 1;
  
  while (attempt < maxAttempts) {
    try {
      const stream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { ... }
      });

      // Wrap stream with timeout monitoring
      const monitoredStream = withStreamTimeout(
        stream,
        TIMEOUT_CONFIG.firstTokenTimeout,
        () => {
          console.warn('Stream timeout: no first token received');
        }
      );

      let firstTokenReceived = false;
      
      for await (const chunk of monitoredStream) {
        if (signal.aborted) {
          throw new DOMException("Aborted by user", "AbortError");
        }
        
        if (!firstTokenReceived) {
          firstTokenReceived = true;
          // Log time to first token for monitoring
        }
        
        yield chunk;
      }
      
      // Success - exit retry loop
      return;
      
    } catch (error) {
      attempt++;
      
      if (!isRetryableError(error) || attempt >= maxAttempts) {
        throw error;
      }
      
      // Calculate backoff and wait
      const delay = calculateBackoffDelay(
        attempt - 1,
        DEFAULT_RETRY_CONFIG.baseDelay,
        DEFAULT_RETRY_CONFIG.maxDelay
      );
      
      console.warn(`Stream error on attempt ${attempt}, retrying in ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }
}
```

#### 3.4 Update `refineResumeStream()` Function
**File**: `services/geminiService.ts`

**Changes**:
- Same pattern as `generateTailoredResumeStream()`
- Reuse stream timeout and retry logic

---

### Phase 4: Enhanced Error Handling & User Feedback
**Goal**: Improve error messages and provide user visibility

#### 4.1 Error Message Enhancement
**File**: `services/geminiService.ts`

**Changes**:
- Create user-friendly error messages
- Map technical errors to actionable messages
- Include retry attempt information in error context

**Error Message Mapping**:
```typescript
const ERROR_MESSAGES = {
  'model is overloaded': 'The AI service is currently busy. Please try again in a moment.',
  'timeout': 'The request took too long. Please try again.',
  'rate limit': 'Too many requests. Please wait a moment and try again.',
  'network': 'Network error. Please check your connection and try again.',
  'default': 'An error occurred during generation. Please try again.',
};
```

#### 4.2 UI Feedback for Retries
**File**: `screens/ResumeEditor.tsx`, `components/ProfileTab.tsx`, `components/SourcesTab.tsx`

**Changes**:
- Add retry attempt indicator in UI
- Show "Retrying..." message with attempt number
- Update `ThinkingUI` component to show retry status
- Add timeout warning if approaching timeout

**UI Updates**:
- Add `retryAttempt` state to track current attempt
- Display retry status in generation UI
- Show countdown for timeouts (optional)

#### 4.3 Logging & Monitoring
**File**: `services/geminiService.ts`

**Changes**:
- Add structured logging for:
  - Retry attempts (attempt number, delay, error type)
  - Timeout events (which timeout triggered)
  - Time-to-first-token metrics
  - Success/failure rates
- Use console.warn for retries, console.error for final failures

---

### Phase 5: Configuration & Environment Variables
**Goal**: Make retry/timeout configurable

#### 5.1 Environment-Based Configuration
**File**: `services/geminiService.ts` or new `services/geminiConfig.ts`

**Configuration Source**:
- Environment variables with defaults
- Allow override via config object

**Configuration Options**:
```typescript
interface GeminiConfig {
  retry: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
  timeout: {
    connectionTimeout: number;
    requestTimeout: number;
    firstTokenTimeout: number;
  };
}

const getGeminiConfig = (): GeminiConfig => {
  return {
    retry: {
      maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '4'),
      baseDelay: parseInt(process.env.GEMINI_BASE_DELAY || '1000'),
      maxDelay: parseInt(process.env.GEMINI_MAX_DELAY || '30000'),
    },
    timeout: {
      connectionTimeout: parseInt(process.env.GEMINI_CONNECTION_TIMEOUT || '15000'),
      requestTimeout: parseInt(process.env.GEMINI_REQUEST_TIMEOUT || '120000'),
      firstTokenTimeout: parseInt(process.env.GEMINI_FIRST_TOKEN_TIMEOUT || '45000'),
    },
  };
};
```

#### 5.2 Update Vite Config
**File**: `vite.config.ts`

**Changes**:
- Add new environment variables to define block
- Document in README

---

### Phase 6: Testing & Validation
**Goal**: Ensure reliability improvements work correctly

#### 6.1 Unit Tests for Retry Logic
**File**: `services/__tests__/retryUtils.test.ts` (create)

**Test Cases**:
- Retry on retryable errors
- No retry on non-retryable errors
- Exponential backoff calculation
- Jitter application
- Max retry limit enforcement
- Timeout wrapper functionality

#### 6.2 Integration Tests
**File**: `services/__tests__/geminiService.test.ts` (create)

**Test Cases**:
- Retry behavior with mock overloaded errors
- Timeout behavior with slow responses
- Stream timeout with delayed first token
- Error message mapping
- Configuration override

#### 6.3 Manual Testing Scenarios
**Documentation**: Test cases to verify manually

**Scenarios**:
1. Simulate "overloaded" error (mock or wait for real occurrence)
   - Verify retry attempts occur
   - Verify backoff delays
   - Verify final error if all retries fail
2. Simulate slow connection
   - Verify timeout triggers
   - Verify user-friendly error message
3. Simulate slow first token
   - Verify first-token timeout
   - Verify stream abortion
4. Normal operation
   - Verify no performance degradation
   - Verify no unnecessary retries

---

## Implementation Order

### Step 1: Foundation (Phase 1)
1. Create `services/retryUtils.ts` with core retry infrastructure
2. Implement error classification logic
3. Test retry utilities in isolation

### Step 2: Timeout Support (Phase 2)
1. Add timeout wrapper functions
2. Add stream timeout monitoring
3. Test timeout functionality

### Step 3: Integration (Phase 3)
1. Integrate retry + timeout into `generateSection()`
2. Integrate into `generateFullProfile()`
3. Integrate into `generateTailoredResumeStream()`
4. Integrate into `refineResumeStream()`

### Step 4: Polish (Phase 4 & 5)
1. Enhance error messages
2. Add UI feedback for retries
3. Add configuration support
4. Update documentation

### Step 5: Validation (Phase 6)
1. Write unit tests
2. Manual testing
3. Monitor in production

---

## Success Criteria

1. ✅ "Model overloaded" errors trigger automatic retries with backoff
2. ✅ Requests timeout appropriately instead of hanging indefinitely
3. ✅ Streaming requests detect and abort if first token doesn't arrive in time
4. ✅ Users see clear feedback during retries
5. ✅ Configuration is flexible and environment-based
6. ✅ No performance degradation for successful requests
7. ✅ Error messages are user-friendly and actionable

---

## Risk Mitigation

1. **Too many retries causing longer delays**: 
   - Limit max retries to 4-5
   - Cap max delay at 30 seconds
   - Show user option to cancel

2. **Timeout too aggressive**:
   - Start with conservative timeouts
   - Make configurable
   - Monitor and adjust based on real usage

3. **Retry logic interfering with user cancellation**:
   - Check `AbortSignal` before each retry
   - Respect user cancellation immediately

4. **Stream timeout false positives**:
   - Use reasonable first-token timeout (45s)
   - Monitor false positive rate
   - Adjust based on metrics

---

## Future Enhancements (Post-Implementation)

1. **Metrics Collection**: Track retry rates, timeout frequency, time-to-first-token
2. **Adaptive Timeouts**: Adjust timeouts based on historical performance
3. **Circuit Breaker**: Temporarily stop requests if error rate too high
4. **Rate Limiting**: Client-side rate limiting to prevent overload
5. **Fallback Model**: Use different model if primary fails repeatedly

