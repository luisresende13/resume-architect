/**
 * Configuration module for Gemini API retry and timeout settings
 * All values can be overridden via environment variables
 */

/**
 * Gemini configuration interface
 */
export interface GeminiConfig {
  model: string;
  inference: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
  retry: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
  timeout: {
    connectionTimeout: number;
    requestTimeout: number;
    firstTokenTimeout: number;
    streamHeartbeatInterval: number;
  };
}

/**
 * Gets Gemini configuration from environment variables with defaults
 * 
 * @returns GeminiConfig object with model, inference, retry and timeout settings
 */
export function getGeminiConfig(): GeminiConfig {
  const parseOptionalNumber = (value: string | undefined): number | undefined => {
    if (!value || value.trim() === '') return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  };

  const parseOptionalInt = (value: string | undefined): number | undefined => {
    if (!value || value.trim() === '') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  };

  return {
    model: process.env.GEMINI_MODEL || 'gemini-3-pro-preview',
    inference: {
      temperature: parseOptionalNumber(process.env.GEMINI_TEMPERATURE),
      topP: parseOptionalNumber(process.env.GEMINI_TOP_P),
      topK: parseOptionalInt(process.env.GEMINI_TOP_K),
      maxOutputTokens: parseOptionalInt(process.env.GEMINI_MAX_OUTPUT_TOKENS),
    },
    retry: {
      maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '4', 10),
      baseDelay: parseInt(process.env.GEMINI_BASE_DELAY || '1000', 10),
      maxDelay: parseInt(process.env.GEMINI_MAX_DELAY || '30000', 10),
    },
    timeout: {
      connectionTimeout: parseInt(process.env.GEMINI_CONNECTION_TIMEOUT || '15000', 10),
      requestTimeout: parseInt(process.env.GEMINI_REQUEST_TIMEOUT || '120000', 10),
      firstTokenTimeout: parseInt(process.env.GEMINI_FIRST_TOKEN_TIMEOUT || '45000', 10),
      streamHeartbeatInterval: parseInt(process.env.GEMINI_STREAM_HEARTBEAT_INTERVAL || '10000', 10),
    },
  };
}

/**
 * Singleton instance of Gemini configuration
 * Loaded once when module is imported
 */
export const GEMINI_CONFIG = getGeminiConfig();

