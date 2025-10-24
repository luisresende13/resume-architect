import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import `MasterProfile` to resolve type error.
import { Document, MasterProfile, MasterProfileSection } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

      You have already extracted the following items for the "${section}" section:
      ---
      ${existingItemsString}
      ---
      Now, your task is to find and extract all additional items for the "${section}" section that are not present in the list above.

      It is crucial that you capture all details associated with each new item you find, even if they seem minor, extraneous, or irrelevant. Do not filter, summarize, or judge the relevance of the information. Your responsibility is solely to extract and preserve the data as completely as possible. The task of filtering and determining relevance will be handled by a separate process later.

      Be exhaustive in finding new items and preserve every detail associated with them.
      ${customInstructions ? `Follow these custom instructions: ${customInstructions}` : ''}

      Here is the content:
      ---
      ${combinedContent}
      ---
    `;
  } else {
    prompt = `
      You are an expert career profiler. Your primary task is to perform a comprehensive and exhaustive extraction of information from the provided documents.

      Your goal is to identify and extract every piece of information related to the "${section}" section. It is crucial that you capture all details associated with each item, even if they seem minor, extraneous, or irrelevant. Do not filter, summarize, or judge the relevance of the information you find. Your responsibility is solely to extract and preserve the data as completely as possible. The task of filtering and determining relevance will be handled by a separate process later.

      Extract all instances of "${section}". Be exhaustive and preserve every detail.
      ${customInstructions ? `Follow these custom instructions: ${customInstructions}` : ''}

      Here is the content:
      ---
      ${combinedContent}
      ---
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: getResponseSchemaForSection(section),
      },
    });

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
    console.error("Error extracting information from documents:", error);
    // Re-throw the error to be handled by the UI component
    throw error;
  }
};

export async function* generateTailoredResumeStream(profile: MasterProfile, jobDescription: string, signal: AbortSignal): AsyncGenerator<any> {
  // Use structuredClone to avoid modifying the original profile object
  const profileForPrompt = structuredClone(profile);
  
  // Extract personal info to highlight it in the prompt
  const personalInfo = profileForPrompt.personal_info;
  delete (profileForPrompt as any).personal_info;
  
  const profileString = JSON.stringify(profileForPrompt, null, 2);

  const prompt = `
    You are an expert resume writer. I will provide you with my personal contact information, a master profile containing all of my professional history, and a target job description.
    
    Your task is to create a tailored, professional one-page resume. Follow this structure precisely:
    1.  **Header:** Start with my name, followed by my contact details (email, phone, LinkedIn, portfolio, GitHub) in a clean, single line or two.
    2.  **Professional Summary:** Write a compelling, tailored professional summary (2-4 sentences) that highlights my key qualifications for this specific role, based on my master profile and the job description.
    3.  **Content Sections:** From the master profile, select only the most relevant information that aligns with the job description. Create sections like "Professional Experience", "Skills", "Projects", "Education", etc., as needed.
    4.  **Formatting:** Rephrase bullet points to use action verbs and highlight achievements that match the company's needs. The output must be clean, well-formatted resume text in Markdown format.
    
    Do not include any preamble or explanation, just the resume content itself.

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
  
  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        thinkingConfig: {
          includeThoughts: true,
        }
      }
    });

    for await (const chunk of stream) {
      if (signal.aborted) {
        throw new DOMException("Aborted by user", "AbortError");
      }
      // Yield the entire chunk so the frontend can process thoughts and text
      yield chunk;
    }
  } catch (error) {
    console.error("Error generating tailored resume:", error);
    // Re-throw the error to be handled by the UI component
    throw error;
  }
};
