import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PaperAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define the response schema strictly to match the requirements
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    basicInfo: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        year: { type: Type.STRING },
        firstAuthor: { type: Type.STRING },
        journal: { type: Type.STRING },
        volumeIssue: { type: Type.STRING },
        keywords: { type: Type.STRING, description: "English keywords comma separated" },
      },
      required: ["title", "year", "firstAuthor"],
    },
    researchQuestion: { type: Type.STRING, description: "Research question and hypothesis" },
    researchDesign: { type: Type.STRING, description: "Overall research design or Review framework" },
    methods: { type: Type.STRING, description: "Methods, data, techniques" },
    analysisProcess: { type: Type.STRING, description: "Step by step analysis or logic flow" },
    results: { type: Type.STRING, description: "Key findings, quantitative and qualitative" },
    conclusion: { type: Type.STRING, description: "Final conclusions based on evidence" },
    evaluation: { type: Type.STRING, description: "Contribution, rigor, logic evaluation" },
    limitations: { type: Type.STRING, description: "Limitations and future inspirations" },
    figuresTables: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.STRING, description: "e.g., Fig 1" },
          title: { type: Type.STRING },
          content: { type: Type.STRING, description: "Core content summary" },
        },
      },
    },
    keyReferences: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "1-2 most representative references (Author, Year, Title, Journal...)"
    },
    isReview: { type: Type.BOOLEAN, description: "True if the paper is a review/survey article" },
  },
  required: [
    "basicInfo", "researchQuestion", "researchDesign", "methods", 
    "analysisProcess", "results", "conclusion", "evaluation", 
    "limitations", "figuresTables", "keyReferences", "isReview"
  ],
};

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzePaperWithGemini = async (file: File): Promise<PaperAnalysis> => {
  try {
    const base64Data = await fileToGenerativePart(file);

    const modelId = "gemini-2.5-flash"; // Efficient for long context like PDFs

    const prompt = `
      Analyze the attached academic paper. You are an expert researcher. 
      Extract and summarize the information strictly based on the file content. DO NOT hallucinate.
      
      Respond in CHINESE (Simplified) for the content fields, but keep keywords in English as requested.
      
      Follow this structure exactly:
      - Basic Info: Title, Year, First Author, Journal/Conf, Vol/Issue, Keywords (English).
      1. Research Question & Hypothesis: Core scientific problem and hypothesis.
      2. Research Design: Overall thought process. (If Review: Main framework).
      3. Methods & Tech: Data source, sample size, algorithms, platforms. (If Review: Details of review method).
      4. Analysis Process: Steps, stats methods, validation.
      5. Results: Key findings, quantitative indicators, qualitative conclusions.
      6. Conclusion: Final conclusion based on evidence.
      7. Evaluation: Contribution to field, rigor, logic.
      8. Limitations & Inspiration: Doubts, limitations, new ideas.
      9. Figures & Tables: List number, title, and summary.
      10. References: Pick 1-2 most important references in format: Author, Year, Title, Journal, Vol, Page.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Low temperature for factual extraction
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as PaperAnalysis;
    return data;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};