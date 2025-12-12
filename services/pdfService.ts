import * as pdfjsLib from 'pdfjs-dist';

// Handle potential ESM/CJS interop issues with pdfjs-dist on esm.sh
// Often the module is exported as 'default' in the namespace object
const lib = (pdfjsLib as any).default || pdfjsLib;

if (lib.GlobalWorkerOptions) {
  lib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
} else {
  console.warn("GlobalWorkerOptions not found in pdfjs-dist import");
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use the resolved lib instance
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Iterate through all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
        
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    if (!fullText.trim()) {
      throw new Error("Unable to extract text from PDF. The file might be scanned images.");
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to parse PDF file. Please ensure it contains selectable text.");
  }
};