import React, { useState, useRef } from 'react';
import { Upload, File, Loader2, AlertCircle, Trash2, BookOpen, Download } from 'lucide-react';
import { AnalyzedFile, ProcessingStatus } from './types';
import { analyzePaperWithGemini } from './services/geminiService';
import { Button } from './components/Button';
import { ResultsView } from './components/ResultsView';
import { downloadExcel } from './services/exportService';
import ParticleBackground from './components/ParticleBackground';

const App: React.FC = () => {
  const [files, setFiles] = useState<AnalyzedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(Array.from(event.target.files));
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files) {
      addFiles(Array.from(event.dataTransfer.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Gemini supports PDF and Images, but we focus on PDF for papers
    const validFiles = newFiles.filter(f => f.type === 'application/pdf');
    if (validFiles.length !== newFiles.length) {
      alert("仅支持 PDF 文件。");
    }
    
    const preparedFiles: AnalyzedFile[] = validFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      status: ProcessingStatus.IDLE
    }));

    setFiles(prev => [...prev, ...preparedFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Processing Logic
  const startProcessing = async () => {
    const idleFiles = files.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
    
    if (idleFiles.length === 0) return;

    for (const fileObj of idleFiles) {
       await processFile(fileObj.id);
    }
  };

  const processFile = async (id: string) => {
    // Step 1: Reading/Pre-processing
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: ProcessingStatus.READING } : f));
    
    // Artificial small delay for UI smoothness
    await new Promise(r => setTimeout(r, 500));

    // Step 2: Analyzing
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: ProcessingStatus.ANALYZING } : f));

    try {
      const fileObj = files.find(f => f.id === id);
      if (!fileObj) return;

      // Call Gemini Service
      const result = await analyzePaperWithGemini(fileObj.file);
      
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: ProcessingStatus.COMPLETED, result } : f
      ));
    } catch (err: any) {
      console.error(err);
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: ProcessingStatus.ERROR, error: err.message || "分析失败，请重试" } : f
      ));
    }
  };

  const handleBatchExcelExport = () => {
    const completed = files.filter(f => f.status === ProcessingStatus.COMPLETED && f.result).map(f => f.result!);
    if (completed.length > 0) {
      downloadExcel(completed);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative text-gray-800 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-white -z-20"></div>
      <ParticleBackground />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/30">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">EasyPaper</h1>
              <p className="text-xs text-indigo-600 font-semibold tracking-wider">文献速读助手</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Upload Area */}
        <div 
          className={`relative overflow-hidden group border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 mb-10 ${
            isDragOver 
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' 
                : 'border-white/50 bg-white/40 hover:border-blue-300 hover:bg-white/60'
          } backdrop-blur-md shadow-xl`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className={`p-5 rounded-2xl mb-6 transition-all duration-300 ${isDragOver ? 'bg-blue-100' : 'bg-white shadow-md'}`}>
              <Upload className={`h-10 w-10 ${isDragOver ? 'text-blue-600' : 'text-indigo-500'}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">点击或拖拽上传论文 PDF</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">支持批量上传，我们将为您自动提取关键信息、翻译并生成总结。</p>
            <div className="relative group">
              <span className="absolute inset-0 w-full h-full bg-blue-600 rounded-lg opacity-20 blur-lg group-hover:opacity-40 transition-opacity"></span>
              <Button size="lg" className="relative shadow-xl border-t border-white/20" onClick={handleUploadClick}>选择文件</Button>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".pdf" 
                multiple 
                onChange={handleFileChange} 
              />
            </div>
          </div>
        </div>

        {/* Controls & Status */}
        {files.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
             <div className="text-gray-700 font-medium pl-2">
               已添加 {files.length} 个文件
             </div>
             <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setFiles([])} disabled={files.some(f => f.status === ProcessingStatus.ANALYZING)}>
                 清空列表
               </Button>
               {files.some(f => f.status === ProcessingStatus.COMPLETED) && (
                 <Button variant="secondary" onClick={handleBatchExcelExport}>
                   <Download className="w-4 h-4 mr-2" /> 批量导出 Excel
                 </Button>
               )}
               <Button onClick={startProcessing} disabled={files.every(f => f.status === ProcessingStatus.COMPLETED) || files.some(f => f.status === ProcessingStatus.ANALYZING)}>
                 {files.some(f => f.status === ProcessingStatus.ANALYZING) ? 'AI 分析中...' : '开始智能分析'}
               </Button>
             </div>
          </div>
        )}

        {/* File List / Results */}
        <div className="space-y-6">
          {files.map((fileObj) => {
             const isFinished = fileObj.status === ProcessingStatus.COMPLETED;
             return (
               <div key={fileObj.id}>
                 {/* Progress Card */}
                 {!isFinished && (
                   <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/60 p-5 flex items-center justify-between shadow-lg transition-all hover:shadow-xl">
                     <div className="flex items-center gap-5 truncate">
                       <div className="p-3 bg-white rounded-xl shadow-sm">
                         <File className="h-6 w-6 text-indigo-500" />
                       </div>
                       <div className="min-w-0">
                         <p className="font-semibold text-gray-800 truncate text-base">{fileObj.file.name}</p>
                         <p className="text-xs text-gray-500 mt-1">{(fileObj.file.size / 1024 / 1024).toFixed(2)} MB</p>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-6 flex-shrink-0 pl-4">
                       {fileObj.status === ProcessingStatus.IDLE && <span className="text-gray-500 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">等待分析</span>}
                       {(fileObj.status === ProcessingStatus.READING || fileObj.status === ProcessingStatus.ANALYZING) && (
                         <span className="flex items-center text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                           <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" />
                           AI 深度思考中...
                         </span>
                       )}
                       {fileObj.status === ProcessingStatus.ERROR && (
                         <span className="flex items-center text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-full border border-red-100" title={fileObj.error}>
                           <AlertCircle className="h-3.5 w-3.5 mr-2" />
                           分析失败
                         </span>
                       )}
                       
                       <button onClick={() => removeFile(fileObj.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                         <Trash2 className="h-5 w-5" />
                       </button>
                     </div>
                   </div>
                 )}

                 {/* Completed Result Card */}
                 {isFinished && fileObj.result && (
                    <div className="transform transition-all duration-500 ease-in-out">
                        <ResultsView analysis={fileObj.result} fileName={fileObj.file.name} />
                    </div>
                 )}
               </div>
             );
          })}
        </div>
      </main>

      <footer className="mt-auto py-8 text-center text-gray-500 text-sm relative z-10">
        <p className="font-medium">© 2024 EasyPaper.</p>
        <p className="text-xs mt-1 opacity-60">Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;