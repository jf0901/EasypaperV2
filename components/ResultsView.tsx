import React, { useState } from 'react';
import { PaperAnalysis } from '../types';
import { ChevronDown, ChevronUp, FileText, Download, FileSpreadsheet, FileType, FileCode } from 'lucide-react';
import { handleExport } from '../services/exportService';
import { Button } from './Button';

interface ResultsViewProps {
  analysis: PaperAnalysis;
  fileName: string;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ analysis, fileName }) => {
  const [isOpen, setIsOpen] = useState(true);

  const Section = ({ title, content }: { title: string, content: string | React.ReactNode }) => (
    <div className="mb-6 group">
      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2 border-l-4 border-blue-400 pl-3 transition-all group-hover:border-blue-600">
        {title}
      </h4>
      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/60 shadow-sm transition-all hover:shadow-md hover:bg-white/70">
        {content}
      </div>
    </div>
  );

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl">
      <div 
        className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-white/40 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="p-2 bg-blue-100/50 rounded-lg backdrop-blur-sm">
            <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-800 truncate pr-4">{analysis.basicInfo.title}</h3>
            <p className="text-xs text-gray-500 truncate font-medium mt-0.5">
              {analysis.basicInfo.firstAuthor} • {analysis.basicInfo.year} • {analysis.basicInfo.journal}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-6 border-t border-white/30">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
             <span className="text-sm font-semibold text-gray-700">导出选项:</span>
             <div className="flex gap-3">
                <Button size="sm" variant="outline" className="bg-white/80 hover:bg-white" onClick={() => handleExport('md', analysis, fileName)}>
                  <FileCode className="w-4 h-4 mr-2 text-gray-700" /> Markdown
                </Button>
                <Button size="sm" variant="outline" className="bg-white/80 hover:bg-white" onClick={() => handleExport('xlsx', analysis, fileName)}>
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel
                </Button>
                <Button size="sm" variant="outline" className="bg-white/80 hover:bg-white" onClick={() => handleExport('pdf', analysis, fileName)}>
                  <FileType className="w-4 h-4 mr-2 text-red-600" /> PDF
                </Button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="col-span-1 md:col-span-2">
               <div className="flex flex-wrap gap-2 mb-2">
                 {analysis.basicInfo.keywords.split(',').map((k, i) => (
                   <span key={i} className="px-3 py-1 bg-white/80 text-blue-700 text-xs font-medium rounded-full border border-blue-100 shadow-sm">
                     {k.trim()}
                   </span>
                 ))}
               </div>
             </div>

            <Section title="1. 研究问题及假设" content={analysis.researchQuestion} />
            <Section title={`2. 研究设计 ${analysis.isReview ? '(综述框架)' : ''}`} content={analysis.researchDesign} />
            
            <Section title="3. 方法技术" content={analysis.methods} />
            <Section title="4. 分析流程" content={analysis.analysisProcess} />
            
            <Section title="5. 实验结果" content={analysis.results} />
            <Section title="6. 实验结论" content={analysis.conclusion} />
            
            <Section title="7. 评价 (贡献与严谨性)" content={analysis.evaluation} />
            <Section title="8. 不足和启发" content={analysis.limitations} />

            <div className="col-span-1 md:col-span-2">
              <Section 
                title="9. 图表摘要" 
                content={
                  <div className="space-y-4">
                    {analysis.figuresTables.map((fig, idx) => (
                      <div key={idx} className="flex gap-4 text-sm bg-white/40 p-3 rounded-lg border border-white/50">
                        <span className="font-bold text-blue-800 shrink-0 min-w-[80px] bg-blue-50/50 py-1 px-2 rounded h-fit text-center">{fig.number}</span>
                        <div className="space-y-1">
                          <div className="font-bold text-gray-900">{fig.title}</div>
                          <div className="text-gray-600 leading-relaxed">{fig.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                } 
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <Section 
                title="10. 关键参考文献" 
                content={
                  <ul className="list-none space-y-2">
                    {analysis.keyReferences.map((ref, idx) => (
                      <li key={idx} className="text-gray-600 italic pl-4 border-l-2 border-gray-300 py-1">{ref}</li>
                    ))}
                  </ul>
                } 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};