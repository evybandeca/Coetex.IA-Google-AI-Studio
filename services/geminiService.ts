
import { GoogleGenAI, Type } from "@google/genai";
import { DatabaseRow, DatabaseColumn, Block, ConsultationResponse } from "../types";

// Initialize the Gemini API client
// Note: In a real deployment, ensure process.env.API_KEY is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- CONSULTANT PERSONA CONFIGURATION ---
const CONSULTANT_SYSTEM_INSTRUCTION = `
You are Cortexia, a Professional Medical Knowledge Consultant. 
Your role is NOT to be a generic chatbot, but to act as an interface to the user's structured medical data.

OPERATIONAL RULES:
1. DATA GROUNDING: You must answer primarily based on the "Structured Context" provided in the prompt (Database rows, Text blocks).
2. REASONING: You must explain *how* you derived the answer from the data.
3. CITATION: You must cite specific data elements (e.g., "According to Protocol Database, Row 2...").
4. NO HALLUCINATION: If the answer is not in the provided context, state "Information not found in current workspace context", then clearly separate and provide general medical consensus labeled as "General Medical Knowledge".
5. STRUCTURE: Your output must be a JSON object containing the answer, reasoning steps, citations, and recognized entities.

You are rigorous, precise, and evidence-based.
`;

const SYSTEM_INSTRUCTION = `
You are Cortexia, a specialized AI medical study assistant. 
Your outputs must be scientifically rigorous and designed for medical students and residents.
1. CITATIONS: Whenever answering a medical query, you must attempt to cite a source or indicate if the knowledge is general medical consensus.
2. CONCISENESS: Medical students have limited time. Be direct.
3. FORMAT: Use Markdown for all text generation.
`;

/**
 * Main Consultation Function: Interacts with the page context as a database.
 */
export const consultCortexia = async (
  query: string, 
  pageContext: { title: string; blocks: Block[] },
  attachments: { mimeType: string; data: string }[] = []
): Promise<ConsultationResponse> => {
  
  // 1. Flatten Page Context into a structured string representation for the model
  const contextString = JSON.stringify({
    pageTitle: pageContext.title,
    content: pageContext.blocks.map(b => {
      if (b.type === 'database' && b.metadata) {
        return {
          id: b.id,
          type: 'DATABASE_TABLE',
          name: b.metadata.title,
          data: b.metadata.rows.map((r: any) => r.cells)
        };
      }
      return {
        id: b.id,
        type: b.type,
        content: b.content
      };
    })
  }, null, 2);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...attachments.map(a => ({ inlineData: a })),
          { text: `STRUCTURED CONTEXT:\n${contextString}\n\nUSER QUERY: ${query}` }
        ]
      },
      config: {
        systemInstruction: CONSULTANT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: "The direct answer to the user query, grounded in the context." },
            reasoning: { type: Type.STRING, description: "Step-by-step logic used to derive the answer from the data tables or text." },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceId: { type: Type.STRING, description: "The ID of the block or row used." },
                  sourceType: { type: Type.STRING, enum: ["block", "database_row"] },
                  label: { type: Type.STRING, description: "Human readable label (e.g. 'Row 3', 'Heading 1')" }
                }
              }
            },
            entities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of medical entities (drugs, diseases) identified." },
            related_concepts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggested related topics based on the data." }
          },
          required: ["answer", "reasoning", "citations", "entities"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ConsultationResponse;
    }
    throw new Error("Empty response from Cortexia");
  } catch (error) {
    console.error("Cortexia Consultation Error:", error);
    return {
      answer: "I encountered an error analyzing the structured data.",
      reasoning: "API Error or Context Limit Reached.",
      citations: [],
      entities: [],
      related_concepts: []
    };
  }
};

/**
 * Generates a flashcard (Front/Back) from a given text block.
 */
export const generateFlashcardFromText = async (text: string): Promise<{ front: string; back: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Fast, efficient for student tier
      contents: `Generate a single high-yield medical flashcard from the following text. Return ONLY JSON. Text: "${text}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING, description: "The question or concept to test." },
            back: { type: Type.STRING, description: "The answer or explanation." },
          },
          required: ["front", "back"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from Cortexia.");
  } catch (error) {
    console.error("Cortexia Flashcard Error:", error);
    return { front: "Error generating card", back: "Please try again." };
  }
};

/**
 * Summarizes a text block concisely.
 */
export const summarizeText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following medical text into a concise, high-yield bullet point list. Text: "${text}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Cortexia Summary Error:", error);
    return "Error communicating with Cortexia.";
  }
};

/**
 * Refines or Edits text based on user instruction (e.g. "Fix grammar", "Simplify").
 */
export const refineText = async (text: string, instruction: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Original Text: "${text}"\n\nInstruction: ${instruction}\n\nReturn ONLY the rewritten text. Maintain medical accuracy.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Cortexia Refine Error:", error);
    return text;
  }
};

/**
 * Analyzes a medical image and provides a description.
 */
export const analyzeImage = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Analyze this medical image. Identify key anatomical structures, potential pathologies, or visual findings visible. Be concise and professional." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Cortexia Image Analysis Error:", error);
    return "Could not analyze image. Please ensure it is a supported format.";
  }
};

/**
 * Edits an image based on a text prompt using Gemini 2.5 Flash Image.
 */
export const editImageWithPrompt = async (base64Data: string, mimeType: string, prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    // Iterate to find the image part in the response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
             return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Cortexia Image Edit Error:", error);
    return null;
  }
};

/**
 * Transcribes audio input into text.
 * @param base64Audio Base64 encoded audio string
 * @param mimeType Mime type of the audio (e.g. 'audio/webm')
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: "Transcribe the spoken medical notes in this audio clearly and accurately into formatted Markdown text. Do not add conversational filler." }
        ]
      },
      config: {
        systemInstruction: "You are a medical transcriptionist. Ensure medical terminology is spelled correctly."
      }
    });
    return response.text?.trim() || "Transcription unavailable.";
  } catch (error) {
    console.error("Cortexia Transcription Error:", error);
    return "Error transcribing audio.";
  }
};

/**
 * Simulates RAG by "indexing" a file description. 
 * In a real app, this would accept binary data.
 */
export const indexFileContext = async (fileName: string): Promise<string> => {
  // Simulating a delay for indexing
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `[System] ${fileName} has been indexed. Cortexia can now reference this in queries.`;
};

/**
 * Simulates OCR and Indexing of text within images for Semantic Search.
 */
export const indexImageText = async (base64Data: string): Promise<void> => {
  console.log("Cortexia: Starting OCR and indexing process for uploaded image...");
  // Simulate network latency for OCR service
  await new Promise(resolve => setTimeout(resolve, 1200));
  console.log("Cortexia: Image text successfully extracted and indexed for search.");
};

/**
 * Generates a value for a specific AI column in a database row.
 */
export const generateAIColumnValue = async (inputContext: string, columnType: 'ai-summary' | 'ai-evidence'): Promise<string> => {
  const prompt = columnType === 'ai-summary' 
    ? `Extract 3-5 key medical concepts or keywords from this text: "${inputContext}". Return them as a comma-separated list.`
    : `Determine the Level of Evidence (I, II, III, IV, or V) based on standard Evidence-Based Medicine criteria for a study/protocol titled/described as: "${inputContext}". Return ONLY the Roman Numeral level (e.g., "Level I"). If not applicable, return "N/A".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a medical data extractor. Be precise and brief.",
      },
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("AI Column Error:", error);
    return "Error";
  }
};

/**
 * "Chat with Database" - RAG query over database rows.
 */
export const queryDatabase = async (query: string, rows: DatabaseRow[], columns: DatabaseColumn[]): Promise<string> => {
  // Construct context from rows
  const context = rows.map(row => {
    return columns.map(col => `${col.name}: ${row.cells[col.id] || 'N/A'}`).join(' | ');
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context Data (Medical Protocols):\n${context}\n\nUser Query: ${query}\n\nAnswer the user's question based strictly on the Context Data provided. Cite the specific protocol/row if applicable.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text || "No answer found in database.";
  } catch (error) {
    console.error("Database Query Error:", error);
    return "Cortexia could not process the query.";
  }
};
