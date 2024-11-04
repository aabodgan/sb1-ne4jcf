import React, { useState, useCallback } from 'react';
import { Loader2, Download, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { DropZone } from './components/DropZone';
import { MappingUpload } from './components/MappingUpload';
import { ResultsList } from './components/ResultsList';
import { ErrorMessage } from './components/ErrorMessage';
import { Instructions } from './components/Instructions';
import { processFiles, downloadProcessedFiles } from './utils/fileProcessor';

interface FileWithPreview extends File {
  preview?: string;
}

interface RenameResult {
  oldName: string;
  newName: string;
  status: 'success' | 'error';
  message?: string;
  downloadUrl?: string;
}

function App() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [results, setResults] = useState<RenameResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPreviews, setShowPreviews] = useState(false);

  const handleMappingFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        setMappingFile(file);
        setError(null);
      } else {
        setError('Будь ласка, виберіть файл .txt або .csv');
      }
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [
      ...prevFiles,
      ...acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }))
    ]);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!files.length || !mappingFile) {
      setError('Будь ласка, виберіть файли для перейменування та файл відповідності');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const processedResults = await processFiles(files, mappingFile);
      setResults(processedResults);
      setDownloadReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при обробці файлів');
    } finally {
      setIsProcessing(false);
    }
  }, [files, mappingFile]);

  const handleDownloadAll = useCallback(async () => {
    try {
      await downloadProcessedFiles(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка при завантаженні файлів');
    }
  }, [results]);

  // Cleanup previews when component unmounts
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className="min-h-screen bg-[#f5f6f7] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2c3e50]">Перейменування зображень</h1>
          </div>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2 px-4 py-2 text-[#3498db] hover:bg-[#ecf0f1] rounded-lg transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            {showInstructions ? 'Сховати інструкції' : 'Показати інструкції'}
            {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <ErrorMessage message={error} onClose={() => setError(null)} />

        {showInstructions && <Instructions />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <MappingUpload 
                mappingFile={mappingFile} 
                onFileChange={handleMappingFileChange}
                onError={setError}
              />

              <div className="mt-6">
                <DropZone 
                  files={files} 
                  onDrop={onDrop} 
                  onError={setError}
                  maxFiles={5000}
                  maxSize={5 * 1024 * 1024}
                  showPreviews={showPreviews}
                  onTogglePreviews={() => setShowPreviews(!showPreviews)}
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !files.length || !mappingFile}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-white
                    ${isProcessing || !files.length || !mappingFile
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#3498db] hover:bg-[#2980b9]'
                    } transition-colors flex items-center justify-center`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Обробка...
                    </>
                  ) : (
                    'Перейменувати'
                  )}
                </button>

                {downloadReady && (
                  <button
                    onClick={handleDownloadAll}
                    className="py-3 px-6 rounded-lg font-medium text-white bg-[#27ae60] hover:bg-[#219a52] 
                      transition-colors flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Завантажити
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <ResultsList 
              results={results} 
              onError={setError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;