import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import `MasterProfile` to resolve type error.
import { Document, MasterProfile, MasterProfileSection } from '../types';
import {
  retryWithBackoff,
  withTimeout,
  withStreamTimeout,
  isRetryableError,
  TimeoutError,
  calculateBackoffDelay,
  sleep,
  RetryOptions,
} from './retryUtils';
import { GEMINI_CONFIG, getGeminiConfig } from './geminiConfig';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Builds inference config object from environment variables
 * Only includes parameters that are explicitly set
 */
function buildInferenceConfig(additionalConfig: any = {}) {
  const config: any = { ...additionalConfig };
  
  if (GEMINI_CONFIG.inference.temperature !== undefined) {
    config.temperature = GEMINI_CONFIG.inference.temperature;
  }
  if (GEMINI_CONFIG.inference.topP !== undefined) {
    config.topP = GEMINI_CONFIG.inference.topP;
  }
  if (GEMINI_CONFIG.inference.topK !== undefined) {
    config.topK = GEMINI_CONFIG.inference.topK;
  }
  if (GEMINI_CONFIG.inference.maxOutputTokens !== undefined) {
    config.maxOutputTokens = GEMINI_CONFIG.inference.maxOutputTokens;
  }
  
  return config;
}

/**
 * Timeout configuration for API calls
 * Uses environment variables with defaults
 */
export const TIMEOUT_CONFIG = {
  connectionTimeout: GEMINI_CONFIG.timeout.connectionTimeout,
  requestTimeout: GEMINI_CONFIG.timeout.requestTimeout,
  firstTokenTimeout: GEMINI_CONFIG.timeout.firstTokenTimeout,
  streamHeartbeatInterval: GEMINI_CONFIG.timeout.streamHeartbeatInterval,
};

/**
 * Gets retry configuration from environment variables
 * 
 * @returns RetryOptions object with configured values
 */
function getRetryConfig(): RetryOptions {
  return {
    maxRetries: GEMINI_CONFIG.retry.maxRetries,
    baseDelay: GEMINI_CONFIG.retry.baseDelay,
    maxDelay: GEMINI_CONFIG.retry.maxDelay,
  };
}

const getResponseSchemaForSection = (section: MasterProfileSection) => {
  switch (section) {
    case 'personal_info':
      return {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'The full name.' },
          email: { type: Type.STRING, description: 'The email address.' },
          phone: { type: Type.STRING, description: 'The phone number.' },
          linkedin: { type: Type.STRING, description: 'The LinkedIn profile URL.' },
          portfolio: { type: Type.STRING, description: 'The personal portfolio URL.' },
          github: { type: Type.STRING, description: 'The GitHub profile URL.' },
        },
        required: ['name', 'email'],
      };
    case 'experience':
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'The job title.' },
            company: { type: Type.STRING, description: 'The company name.' },
            dates: { type: Type.STRING, description: 'The employment dates (e.g., Jan 2020 - Present).' },
            description: { type: Type.STRING, description: 'A detailed description of responsibilities and achievements.' }
          },
          required: ['title', 'company', 'dates', 'description'],
        }
      };
    case 'skills':
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the skill.' }
          },
          required: ['name'],
        }
      };
    case 'projects':
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The project name.' },
            description: { type: Type.STRING, description: 'A detailed description of the project.' }
          },
          required: ['name', 'description'],
        }
      };
    case 'education':
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            institution: { type: Type.STRING, description: 'The name of the institution.' },
            degree: { type: Type.STRING, description: 'The degree or certification obtained.' },
            dates: { type: Type.STRING, description: 'The dates of attendance (e.g., Aug 2016 - May 2020).' },
            description: { type: Type.STRING, description: 'Optional details about the education.' }
          },
          required: ['institution', 'degree', 'dates'],
        }
      };
    case 'certifications':
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the certification.' },
            issuingOrganization: { type: Type.STRING, description: 'The organization that issued the certification.' },
            date: { type: Type.STRING, description: 'The date the certification was issued (e.g., Issued Jun 2023).' },
          },
          required: ['name', 'issuingOrganization', 'date'],
        }
      };
    case 'awards':
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the award.' },
            issuer: { type: Type.STRING, description: 'The organization or entity that gave the award.' },
            date: { type: Type.STRING, description: 'The date the award was received (e.g., Awarded May 2022).' },
          },
          required: ['name', 'issuer', 'date'],
        }
      };
    case 'languages':
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the language.' },
            proficiency: { type: Type.STRING, description: 'The proficiency level (e.g., Native, Fluent, Conversational).' },
          },
          required: ['name', 'proficiency'],
        }
      };
    default:
      throw new Error(`Unknown section: ${section}`);
  }
};

import { supabase } from './supabaseClient';

/**
 * Error message mapping for user-friendly error messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  'model is overloaded': 'The AI service is currently busy. Please try again in a moment.',
  'overloaded': 'The AI service is currently busy. Please try again in a moment.',
  'timeout': 'The request took too long. Please try again.',
  'rate limit': 'Too many requests. Please wait a moment and try again.',
  'quota': 'API quota exceeded. Please try again later.',
  'network': 'Network error. Please check your connection and try again.',
  'connection': 'Connection error. Please check your connection and try again.',
  'default': 'An error occurred during generation. Please try again.',
};

/**
 * Gets a user-friendly error message from an error object
 * 
 * @param error - The error object
 * @param context - Additional context (e.g., section name, operation type)
 * @returns User-friendly error message
 */
function getUserFriendlyErrorMessage(error: any, context?: string): string {
  if (!error) {
    return ERROR_MESSAGES.default;
  }

  const errorMessage = String(error.message || error.toString() || '').toLowerCase();
  
  // Check for specific error patterns
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (key !== 'default' && errorMessage.includes(key)) {
      return context ? `${message} (${context})` : message;
    }
  }

  // Check for timeout errors
  if (error instanceof TimeoutError) {
    return ERROR_MESSAGES.timeout;
  }

  // Default message
  return context ? `${ERROR_MESSAGES.default} (${context})` : ERROR_MESSAGES.default;
}

export const generateSection = async (
  documents: Document[],
  section: MasterProfileSection,
  customInstructions: string,
  existingItems?: any[]
): Promise<any> => {
  const documentContents = await Promise.all(
    documents.map(async (doc) => {
      const { data, error } = await supabase.storage.from('documents').download(doc.storage_path);
      if (error) throw error;
      const content = await data.text();
      return `Document: ${doc.name}\n\n${content}`;
    })
  );

  const combinedContent = documentContents.join('\n\n---\n\n');

  let prompt;
  if (existingItems && existingItems.length > 0) {
    const existingItemsString = JSON.stringify(existingItems, null, 2);
    prompt = `
      You are an expert career profiler. Your primary task is to perform a comprehensive and exhaustive extraction of information from the provided documents to find items that have not yet been extracted.

      You have already extracted the following items for the "${section}" resume section:
      ---
      ${existingItemsString}
      ---
      Now, your task is to find and extract all additional items for the "${section}" resume section that are not present in the list above.

      It is crucial that you capture all details associated with each new item you find, even if they seem minor, extraneous, or irrelevant. Do not filter, summarize, or judge the relevance of the information. Your responsibility is solely to extract and preserve the data as completely as possible. The task of filtering and determining relevance will be handled by a separate process later.

      Be exhaustive in finding new items and preserve every detail associated with them.

      Be careful not to extract duplicated or repeated information.

      Be careful not to find mix instances belonging to different sections.

      ${customInstructions ? `Follow these custom instructions: ${customInstructions}` : ''}

      Here is the content:
      ---
      ${combinedContent}
      ---
    `;
  } else {
    prompt = `
      You are an expert career profiler. Your primary task is to perform a comprehensive and exhaustive extraction of information from the provided documents.

      Your goal is to identify and extract every piece of information related to the "${section}" resume section. It is crucial that you capture all details associated with each item, even if they seem minor, extraneous, or irrelevant. Do not filter, summarize, or judge the relevance of the information you find. Your responsibility is solely to extract and preserve the data as completely as possible. The task of filtering and determining relevance will be handled by a separate process later.

      Extract all instances of resume's "${section}". Be exhaustive and preserve every detail.

      Be careful not to extract duplicated or repeated information.

      Be careful not to find mix instances belonging to different sections.

      ${customInstructions ? `Follow these custom instructions: ${customInstructions}` : ''}

      Here is the content:
      ---
      ${combinedContent}
      ---
    `;
  }

  try {
    // Wrap API call with retry and timeout
    const apiCall = async () => {
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          ...buildInferenceConfig(),
          responseMimeType: 'application/json',
          responseSchema: getResponseSchemaForSection(section),
        },
      });
      return response;
    };

    const retryConfig = getRetryConfig();
    const response = await retryWithBackoff(
      () => withTimeout(
        apiCall(),
        TIMEOUT_CONFIG.requestTimeout,
        `generateSection timeout for ${section}`
      ),
      {
        ...retryConfig,
        onRetry: (attempt, error, delay) => {
          // Structured logging for retry attempts
          console.warn(`[RETRY] generateSection(${section}) - Attempt ${attempt}/${retryConfig.maxRetries}`, {
            errorType: error?.name || 'Unknown',
            errorMessage: error?.message || String(error),
            delayMs: delay,
            section,
            timestamp: new Date().toISOString(),
          });
        }
      }
    );

    let jsonText = response.text.trim();
    
    // The model can sometimes wrap the JSON in markdown backticks.
    // This cleanup logic removes them before parsing.
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3);
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
    }

    return JSON.parse(jsonText);
  } catch (error) {
    // Enhanced error handling with user-friendly messages
    const userMessage = getUserFriendlyErrorMessage(error, `section: ${section}`);
    
    // Structured logging for final failures
    console.error(`[ERROR] generateSection(${section}) - Final failure`, {
      errorType: error instanceof TimeoutError ? 'TimeoutError' : (error as any)?.name || 'Unknown',
      errorMessage: (error as any)?.message || String(error),
      section,
      timestamp: new Date().toISOString(),
    });
    
    // Throw user-friendly error
    throw new Error(userMessage);
  }
};
export async function* generateTailoredResumeStream(profile: MasterProfile, jobDescription: string, customInstructions: string, signal: AbortSignal): AsyncGenerator<any> {
  // Note: The 'profile' parameter may be a partial MasterProfile object,
  // containing only the sections selected by the user in the UI.
  // Use structuredClone to avoid modifying the original profile object
  const profileForPrompt = structuredClone(profile);
  
  // Extract personal info to highlight it in the prompt
  const personalInfo = profileForPrompt.personal_info;
  delete (profileForPrompt as any).personal_info;
  
  const profileString = JSON.stringify(profileForPrompt, null, 2);

    // # Prompt v1:
    // ```markdown
    // You are an expert resume writer. I will provide you with my personal contact information, a master profile containing all of my professional history, and a target job description.
    
    // Your task is to create a tailored, professional one-page resume. Follow this structure precisely:
    // 1.  **Header:** Start with my name, followed by my contact details (email, phone, LinkedIn, portfolio, GitHub) in a clean, single line or two.
    // 2.  **Professional Summary:** Write a compelling, tailored professional summary (2-4 sentences) that highlights my key qualifications for this specific role, based on my master profile and the job description.
    // 3.  **Content Sections:** From the master profile, select only the most relevant information that aligns with the job description. Create sections like "Summary", "Skills", "Professional Experience", "Projects", "Education", etc., as needed.
    // 4.  **Formatting:** Rephrase bullet points to use action verbs and highlight achievements that match the company's needs. The output must be clean, well-formatted resume text in Markdown format.

    // Do not include any preamble or explanation, just the resume content itself.
    // ```

  const prompt = `
    You are an expert resume writer. I will provide you with my personal contact information, a master profile containing all of my professional history, and a target job description.
    
    Your task is to create a tailored, professional resume.

    Use the master profile as your sole source of truth for all information about my background, skills, and experience.
    
    Use the job description to identify and highlight the most relevant information from my master profile.
    Only include information that is relevant to the target job description.

    Do not copy verbatin from the master profile, just use it as a source of truth.

    Make it ATS friendly.

    Use all sections and section items from the master profile that are relevant to the job description.
    
    Leverage the master profile information as much as possible in order to get me hired.
    
    Do not include any preamble or explanation, just the resume content itself.

    ${customInstructions ? `**Custom Instructions:**\n---\n${customInstructions}\n---\n\n` : ''}
    **Personal Information:**
    Name: ${personalInfo.name}
    Email: ${personalInfo.email}
    Phone: ${personalInfo.phone}
    LinkedIn: ${personalInfo.linkedin}
    Portfolio: ${personalInfo.portfolio}
    GitHub: ${personalInfo.github}

    **Master Profile:**
    \`\`\`json
    ${profileString}
    \`\`\`

    **Target Job Description:**
    ---
    ${jobDescription}
    ---
  `;
  
  const retryConfig = getRetryConfig();
  let attempt = 0;
  const maxAttempts = retryConfig.maxRetries! + 1; // Initial attempt + retries

  while (attempt < maxAttempts) {
    // Track metrics for this attempt
    const apiCallStartTime = Date.now();
    let connectionTime: number | null = null;
    let streamReadyTime: number | null = null;
    let firstTokenReceived = false;
    let firstTokenTime: number | null = null;
    let streamEndTime: number | null = null;
    let totalChunks = 0;

    try {
      // Check if user aborted before retry
      if (signal.aborted) {
        throw new DOMException("Aborted by user", "AbortError");
      }

      // Wrap stream creation with connection timeout
      const streamCreationPromise = ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: {
            includeThoughts: true,
          }
        }
      });

      // Apply connection timeout to stream creation
      const stream = await withTimeout(
        streamCreationPromise,
        TIMEOUT_CONFIG.connectionTimeout,
        `Connection timeout for generateTailoredResumeStream after ${TIMEOUT_CONFIG.connectionTimeout}ms`
      );

      // Track connection time (time from API call to stream ready)
      streamReadyTime = Date.now();
      connectionTime = streamReadyTime - apiCallStartTime;

      // Wrap stream with timeout monitoring
      const monitoredStream = withStreamTimeout(
        stream,
        {
          firstTokenTimeout: TIMEOUT_CONFIG.firstTokenTimeout,
          heartbeatInterval: TIMEOUT_CONFIG.streamHeartbeatInterval,
          onTimeout: () => {
            // Structured logging for timeout events
            console.warn('[TIMEOUT] Stream timeout: no first token received', {
              operation: 'generateTailoredResumeStream',
              timeoutMs: TIMEOUT_CONFIG.firstTokenTimeout,
              connectionTimeMs: connectionTime,
              timestamp: new Date().toISOString(),
            });
          },
          onHeartbeatWarning: (timeSinceLastChunk) => {
            // Structured logging for heartbeat warnings
            console.warn('[HEARTBEAT] Stream heartbeat warning', {
              operation: 'generateTailoredResumeStream',
              timeSinceLastChunkMs: timeSinceLastChunk,
              thresholdMs: TIMEOUT_CONFIG.streamHeartbeatInterval,
              chunksReceived: totalChunks,
              timestamp: new Date().toISOString(),
            });
          }
        }
      );
      
      for await (const chunk of monitoredStream) {
        if (signal.aborted) {
          throw new DOMException("Aborted by user", "AbortError");
        }
        
        totalChunks++;
        
        if (!firstTokenReceived) {
          firstTokenReceived = true;
          firstTokenTime = Date.now();
          
          // Calculate all timing metrics
          const timeToFirstTokenFromStream = firstTokenTime - streamReadyTime!;
          const totalTimeToFirstToken = firstTokenTime - apiCallStartTime;
          
          // Structured logging for comprehensive metrics
          console.log('[METRIC] Stream metrics', {
            operation: 'generateTailoredResumeStream',
            attempt: attempt + 1,
            connectionTimeMs: connectionTime!,
            timeToFirstTokenFromStreamMs: timeToFirstTokenFromStream,
            totalTimeToFirstTokenMs: totalTimeToFirstToken,
            timestamp: new Date().toISOString(),
          });
        }
        
        // Yield the entire chunk so the frontend can process thoughts and text
        yield chunk;
      }
      
      // Track stream completion time
      streamEndTime = Date.now();
      const totalGenerationTime = streamEndTime - apiCallStartTime;
      const streamDuration = streamEndTime - streamReadyTime!;
      
      // Log completion metrics
      console.log('[METRIC] Stream completion', {
        operation: 'generateTailoredResumeStream',
        attempt: attempt + 1,
        totalGenerationTimeMs: totalGenerationTime,
        streamDurationMs: streamDuration,
        totalChunks,
        timestamp: new Date().toISOString(),
      });
      
      // Success - exit retry loop
      return;
      
    } catch (error: any) {
      // Don't retry if user aborted
      if (error.name === 'AbortError') {
        throw error;
      }

      attempt++;
      
      // Check if error is retryable and we have attempts left
      if (!isRetryableError(error) || attempt >= maxAttempts) {
        // Enhanced error handling with user-friendly messages
        const userMessage = getUserFriendlyErrorMessage(error, 'resume generation');
        
        // Structured logging for final failures
        console.error(`[ERROR] generateTailoredResumeStream - Final failure`, {
          errorType: error instanceof TimeoutError ? 'TimeoutError' : error?.name || 'Unknown',
          errorMessage: error?.message || String(error),
          attempts: attempt,
          timestamp: new Date().toISOString(),
        });
        
        // Throw user-friendly error
        throw new Error(userMessage);
      }
      
      // Calculate backoff and wait before retrying
      const delay = calculateBackoffDelay(
        attempt - 1,
        retryConfig.baseDelay!,
        retryConfig.maxDelay!
      );
      
      // Structured logging for retry attempts
      console.warn(`[RETRY] generateTailoredResumeStream - Attempt ${attempt}/${maxAttempts - 1}`, {
        errorType: error?.name || 'Unknown',
        errorMessage: error?.message || String(error),
        delayMs: delay,
        timestamp: new Date().toISOString(),
      });
      
      // Wait before retrying
      await sleep(delay);
    }
  }
};

export async function* refineResumeStream(profile: MasterProfile, markdownContent: string, instruction: string, signal: AbortSignal): AsyncGenerator<any> {
  // Note: The 'profile' parameter may be a partial MasterProfile object,
  // containing only the sections selected by the user in the UI.
  const profileForPrompt = structuredClone(profile);
  
  const personalInfo = profileForPrompt.personal_info;
  delete (profileForPrompt as any).personal_info;
  
  const profileString = JSON.stringify(profileForPrompt, null, 2);
  
  const prompt = `
    You are an expert resume editor. I will provide you with a resume in Markdown format, the master profile it was generated from, and an instruction for how to refine it.

    Your task is to return a new version of the resume that incorporates the instruction, using the master profile as a source of truth and for any additional information required.
    
    Do not include any preamble or explanation, just the updated resume content itself.

    **Master Profile:**
    ---
    ${profileString}
    ---

    **Original Resume:**
    ---
    ${markdownContent}
    ---

    **Instruction:**
    ---
    ${instruction}
    ---
  `;

  const retryConfig = getRetryConfig();
  let attempt = 0;
  const maxAttempts = retryConfig.maxRetries! + 1; // Initial attempt + retries

  while (attempt < maxAttempts) {
    // Track metrics for this attempt
    const apiCallStartTime = Date.now();
    let connectionTime: number | null = null;
    let streamReadyTime: number | null = null;
    let firstTokenReceived = false;
    let firstTokenTime: number | null = null;
    let streamEndTime: number | null = null;
    let totalChunks = 0;

    try {
      // Check if user aborted before retry
      if (signal.aborted) {
        throw new DOMException("Aborted by user", "AbortError");
      }

      // Wrap stream creation with connection timeout
      const streamCreationPromise = ai.models.generateContentStream({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          ...buildInferenceConfig(),
          thinkingConfig: {
            includeThoughts: true,
          }
        }
      });

      // Apply connection timeout to stream creation
      const stream = await withTimeout(
        streamCreationPromise,
        TIMEOUT_CONFIG.connectionTimeout,
        `Connection timeout for refineResumeStream after ${TIMEOUT_CONFIG.connectionTimeout}ms`
      );

      // Track connection time (time from API call to stream ready)
      streamReadyTime = Date.now();
      connectionTime = streamReadyTime - apiCallStartTime;

      // Wrap stream with timeout monitoring
      const monitoredStream = withStreamTimeout(
        stream,
        {
          firstTokenTimeout: TIMEOUT_CONFIG.firstTokenTimeout,
          heartbeatInterval: TIMEOUT_CONFIG.streamHeartbeatInterval,
          onTimeout: () => {
            // Structured logging for timeout events
            console.warn('[TIMEOUT] Stream timeout: no first token received', {
              operation: 'refineResumeStream',
              timeoutMs: TIMEOUT_CONFIG.firstTokenTimeout,
              connectionTimeMs: connectionTime,
              timestamp: new Date().toISOString(),
            });
          },
          onHeartbeatWarning: (timeSinceLastChunk) => {
            // Structured logging for heartbeat warnings
            console.warn('[HEARTBEAT] Stream heartbeat warning', {
              operation: 'refineResumeStream',
              timeSinceLastChunkMs: timeSinceLastChunk,
              thresholdMs: TIMEOUT_CONFIG.streamHeartbeatInterval,
              chunksReceived: totalChunks,
              timestamp: new Date().toISOString(),
            });
          }
        }
      );
      
      for await (const chunk of monitoredStream) {
        if (signal.aborted) {
          throw new DOMException("Aborted by user", "AbortError");
        }
        
        totalChunks++;
        
        if (!firstTokenReceived) {
          firstTokenReceived = true;
          firstTokenTime = Date.now();
          
          // Calculate all timing metrics
          const timeToFirstTokenFromStream = firstTokenTime - streamReadyTime!;
          const totalTimeToFirstToken = firstTokenTime - apiCallStartTime;
          
          // Structured logging for comprehensive metrics
          console.log('[METRIC] Stream metrics', {
            operation: 'refineResumeStream',
            attempt: attempt + 1,
            connectionTimeMs: connectionTime!,
            timeToFirstTokenFromStreamMs: timeToFirstTokenFromStream,
            totalTimeToFirstTokenMs: totalTimeToFirstToken,
            timestamp: new Date().toISOString(),
          });
        }
        
        yield chunk;
      }
      
      // Track stream completion time
      streamEndTime = Date.now();
      const totalGenerationTime = streamEndTime - apiCallStartTime;
      const streamDuration = streamEndTime - streamReadyTime!;
      
      // Log completion metrics
      console.log('[METRIC] Stream completion', {
        operation: 'refineResumeStream',
        attempt: attempt + 1,
        totalGenerationTimeMs: totalGenerationTime,
        streamDurationMs: streamDuration,
        totalChunks,
        timestamp: new Date().toISOString(),
      });
      
      // Success - exit retry loop
      return;
      
    } catch (error: any) {
      // Don't retry if user aborted
      if (error.name === 'AbortError') {
        throw error;
      }

      attempt++;
      
      // Check if error is retryable and we have attempts left
      if (!isRetryableError(error) || attempt >= maxAttempts) {
        // Enhanced error handling with user-friendly messages
        const userMessage = getUserFriendlyErrorMessage(error, 'resume refinement');
        
        // Structured logging for final failures
        console.error(`[ERROR] refineResumeStream - Final failure`, {
          errorType: error instanceof TimeoutError ? 'TimeoutError' : error?.name || 'Unknown',
          errorMessage: error?.message || String(error),
          attempts: attempt,
          timestamp: new Date().toISOString(),
        });
        
        // Throw user-friendly error
        throw new Error(userMessage);
      }
      
      // Calculate backoff and wait before retrying
      const delay = calculateBackoffDelay(
        attempt - 1,
        retryConfig.baseDelay!,
        retryConfig.maxDelay!
      );
      
      // Structured logging for retry attempts
      console.warn(`[RETRY] refineResumeStream - Attempt ${attempt}/${maxAttempts - 1}`, {
        errorType: error?.name || 'Unknown',
        errorMessage: error?.message || String(error),
        delayMs: delay,
        timestamp: new Date().toISOString(),
      });
      
      // Wait before retrying
      await sleep(delay);
    }
  }
};

export const generateFullProfile = async (documents: Document[]): Promise<MasterProfile> => {
  const documentContents = await Promise.all(
    documents.map(async (doc) => {
      const { data, error } = await supabase.storage.from('documents').download(doc.storage_path);
      if (error) throw error;
      const content = await data.text();
      return `Document: ${doc.name}\n\n${content}`;
    })
  );

  const combinedContent = documentContents.join('\n\n---\n\n');

  const prompt = `
    You are an expert career profiler. Your task is to perform a comprehensive and exhaustive extraction of information from the provided documents to create a complete Master Profile.

    Extract all information for the following sections: personal_info, experience, skills, projects, education, certifications, awards, and languages.

    It is crucial that you capture all details associated with each item, even if they seem minor. Do not filter or summarize. Your responsibility is to extract and preserve the data as completely as possible.

    Here is the content:
    ---
    ${combinedContent}
    ---
  `;

  try {
    // Wrap API call with retry and timeout
    // Use longer timeout for full profile generation (more complex)
    const apiCall = async () => {
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.model,
        contents: prompt,
        config: {
          ...buildInferenceConfig(),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personal_info: getResponseSchemaForSection('personal_info'),
              experience: getResponseSchemaForSection('experience'),
              skills: getResponseSchemaForSection('skills'),
              projects: getResponseSchemaForSection('projects'),
              education: getResponseSchemaForSection('education'),
              certifications: getResponseSchemaForSection('certifications'),
              awards: getResponseSchemaForSection('awards'),
              languages: getResponseSchemaForSection('languages'),
            },
          },
        },
      });
      return response;
    };

    const retryConfig = getRetryConfig();
    const response = await retryWithBackoff(
      () => withTimeout(
        apiCall(),
        TIMEOUT_CONFIG.requestTimeout * 1.5, // 3 minutes for full profile
        'generateFullProfile timeout'
      ),
      {
        ...retryConfig,
        onRetry: (attempt, error, delay) => {
          // Structured logging for retry attempts
          console.warn(`[RETRY] generateFullProfile - Attempt ${attempt}/${retryConfig.maxRetries}`, {
            errorType: error?.name || 'Unknown',
            errorMessage: error?.message || String(error),
            delayMs: delay,
            timestamp: new Date().toISOString(),
          });
        }
      }
    );

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3);
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
    }

    return JSON.parse(jsonText);
  } catch (error) {
    // Enhanced error handling with user-friendly messages
    const userMessage = getUserFriendlyErrorMessage(error, 'full profile generation');
    
    // Structured logging for final failures
    console.error(`[ERROR] generateFullProfile - Final failure`, {
      errorType: error instanceof TimeoutError ? 'TimeoutError' : (error as any)?.name || 'Unknown',
      errorMessage: (error as any)?.message || String(error),
      timestamp: new Date().toISOString(),
    });
    
    // Throw user-friendly error
    throw new Error(userMessage);
  }
};
