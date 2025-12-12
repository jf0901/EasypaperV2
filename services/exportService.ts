import { PaperAnalysis } from "../types";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Helper to format text for Markdown
const toMarkdown = (analysis: PaperAnalysis): string => {
  const { basicInfo } = analysis;
  return `
# ${basicInfo.title}

**年份**: ${basicInfo.year} | **第一作者**: ${basicInfo.firstAuthor}
**期刊**: ${basicInfo.journal} (${basicInfo.volumeIssue})
**关键词**: ${basicInfo.keywords}

## 1. 研究问题及假设
${analysis.researchQuestion}

## 2. 研究设计 ${analysis.isReview ? '(综述框架)' : ''}
${analysis.researchDesign}

## 3. 方法技术
${analysis.methods}

## 4. 分析流程
${analysis.analysisProcess}

## 5. 实验结果
${analysis.results}

## 6. 实验结论
${analysis.conclusion}

## 7. 评价
${analysis.evaluation}

## 8. 不足和启发
${analysis.limitations}

## 9. 图表摘要
${analysis.figuresTables.map(f => `- **${f.number} ${f.title}**: ${f.content}`).join('\n')}

## 10. 关键参考文献
${analysis.keyReferences.map(r => `- ${r}`).join('\n')}
  `.trim();
};

export const downloadMarkdown = (analysis: PaperAnalysis, filename: string) => {
  const md = toMarkdown(analysis);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace(/\.[^/.]+$/, "")}_summary.md`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadExcel = (analyses: PaperAnalysis[]) => {
  const data = analyses.map(a => ({
    Title: a.basicInfo.title,
    Year: a.basicInfo.year,
    Author: a.basicInfo.firstAuthor,
    Journal: a.basicInfo.journal,
    Keywords: a.basicInfo.keywords,
    Question: a.researchQuestion,
    Results: a.results,
    Conclusion: a.conclusion,
    Evaluation: a.evaluation,
    Limitations: a.limitations
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Summaries");
  XLSX.writeFile(wb, "EasyPaper_Batch_Export.xlsx");
};

export const downloadPDF = (analysis: PaperAnalysis, filename: string) => {
    // Note: Proper PDF generation with unicode (Chinese) in jsPDF usually requires a custom font.
    // For this demo, we will use a basic approach. In a production env, you'd load a font like NotoSansSC.
    // Since we cannot load binary font files easily here, we will create a text-heavy PDF 
    // or acknowledge that non-latin characters might need font setup in a real app.
    // HOWEVER, to make it work 'out of the box' in this constraint, we will try to use standard PDF functions
    // but warn that Chinese chars might be tricky without a font.
    // A robust fallback for a pure frontend demo without assets is tricky.
    // We will generate a PDF that assumes the browser/library can handle it or use basic standard fonts.
    
    // Better Approach for this specific "Single File" restriction:
    // We will use the 'html' method of jsPDF if possible, but that's complex.
    // Let's stick to a simple PDF structure. *Crucial*: jsPDF default fonts DO NOT support Chinese.
    // We will simulate the PDF export logic but output might be garbled for Chinese without a font file.
    // To solve this in a demo: We will generate a text file but name it .pdf? No, that's cheating.
    // We will stick to the Markdown/Excel as the primary "reliable" exports for Chinese content 
    // and implement PDF best-effort.

    const doc = new jsPDF();
    
    // Simple ASCII header to prove function
    doc.setFontSize(16);
    doc.text("EasyPaper Summary", 10, 10);
    
    doc.setFontSize(10);
    doc.text("Note: PDF export of Chinese characters requires loading custom font files.", 10, 20);
    doc.text("Please use Markdown or Excel export for full Chinese support in this demo.", 10, 25);
    
    doc.text(`Title: ${analysis.basicInfo.title.substring(0, 50)}...`, 10, 35);
    doc.text(`Year: ${analysis.basicInfo.year}`, 10, 40);
    
    doc.save(`${filename.replace(/\.[^/.]+$/, "")}_summary.pdf`);
};

// Re-exporting this to allow UI to call it
export const handleExport = (format: 'md' | 'pdf' | 'xlsx', analysis: PaperAnalysis, filename: string) => {
  if (format === 'md') downloadMarkdown(analysis, filename);
  if (format === 'pdf') downloadPDF(analysis, filename);
  if (format === 'xlsx') downloadExcel([analysis]);
};