import { PaperAnalysis, AIModel } from "../types";

interface ModelConfig {
  name: string;
  baseUrl: string;
  modelId: string;
  placeholder: string;
  needsEndpoint?: boolean;
}

// Configuration for supported models
const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  [AIModel.DEEPSEEK]: {
    name: 'DeepSeek-V3',
    baseUrl: 'https://api.deepseek.com',
    modelId: 'deepseek-chat',
    placeholder: '请输入 DeepSeek API Key (sk-...)',
  },
  [AIModel.QWEN]: {
    name: 'Qwen-Plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelId: 'qwen-plus',
    placeholder: '请输入 DashScope API Key (sk-...)',
  },
  [AIModel.DOUBAO]: {
    name: 'Doubao-Pro',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    modelId: '', // User must provide endpoint ID or we use a common default logic if possible
    placeholder: '请输入火山引擎 API Key',
    needsEndpoint: true
  }
};

const JSON_SCHEMA_PROMPT = `
Respond with a valid JSON object strictly matching this schema:
{
  "basicInfo": {
    "title": "string",
    "year": "string",
    "firstAuthor": "string",
    "journal": "string",
    "volumeIssue": "string",
    "keywords": "string (English)"
  },
  "researchQuestion": "string (Research question and hypothesis)",
  "researchDesign": "string (Overall research design or Review framework)",
  "methods": "string (Methods, data, techniques)",
  "analysisProcess": "string (Step by step analysis)",
  "results": "string (Key findings)",
  "conclusion": "string (Final conclusion)",
  "evaluation": "string (Contribution, rigor, logic)",
  "limitations": "string (Limitations and inspirations)",
  "figuresTables": [
    { "number": "string", "title": "string", "content": "string" }
  ],
  "keyReferences": ["string"],
  "isReview": boolean
}
`;

export const getModelConfig = (model: AIModel): ModelConfig => MODEL_CONFIGS[model];

export const analyzePaperWithExternalAI = async (
  text: string, 
  model: AIModel, 
  apiKey: string,
  customEndpointId?: string // Specifically for Doubao
): Promise<PaperAnalysis> => {
  const config = MODEL_CONFIGS[model];
  const modelId = customEndpointId || config.modelId;

  if (!apiKey) throw new Error(`${config.name} API Key is required.`);
  if (model === AIModel.DOUBAO && !modelId) throw new Error("Doubao requires an Endpoint ID (Model ID).");

  const prompt = `
    Analyze the following academic paper text. You are an expert researcher. 
    Extract and summarize the information strictly based on the text provided.
    
    Respond in CHINESE (Simplified) for the content fields, but keep keywords in English.
    
    ${JSON_SCHEMA_PROMPT}

    --- PAPER TEXT BEGINS ---
    ${text.slice(0, 100000)} 
    --- PAPER TEXT ENDS ---
    (Note: Text might be truncated if too long, prioritize the beginning and end).
  `;

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: 'You are a helpful academic assistant that outputs strict JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' } // Supported by DeepSeek and Qwen recent versions
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("Empty response from AI provider.");

    // Parse JSON safely
    try {
        // Find JSON boundaries if extra text exists
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
        
        const jsonStr = content.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr) as PaperAnalysis;
    } catch (e) {
        console.error("JSON Parse Error", content);
        throw new Error("Failed to parse AI response as JSON. The model might be overloaded.");
    }

  } catch (error: any) {
    console.error(`${model} Analysis Error:`, error);
    throw error;
  }
};