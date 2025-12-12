export enum ProcessingStatus {
  IDLE = 'IDLE',
  READING = 'READING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum AIModel {
  DEEPSEEK = 'DeepSeek',
  DOUBAO = 'Doubao',
  QWEN = 'Qwen',
}

export interface FigureTableSummary {
  number: string;
  title: string;
  content: string;
}

export interface PaperAnalysis {
  basicInfo: {
    title: string;
    year: string;
    firstAuthor: string;
    journal: string;
    volumeIssue: string;
    keywords: string;
  };
  researchQuestion: string; // 1. 研究问题及假设
  researchDesign: string;   // 2. 研究设计 (或综述框架)
  methods: string;          // 3. 方法技术
  analysisProcess: string;  // 4. 分析流程
  results: string;          // 5. 实验结果
  conclusion: string;       // 6. 实验结论
  evaluation: string;       // 7. 评价
  limitations: string;      // 8. 不足和启发
  figuresTables: FigureTableSummary[]; // 9. 图表
  keyReferences: string[];  // 10. 代表性参考文献
  isReview: boolean;        // Helper to adjust UI labels
}

export interface AnalyzedFile {
  id: string;
  file: File;
  status: ProcessingStatus;
  result?: PaperAnalysis;
  error?: string;
}