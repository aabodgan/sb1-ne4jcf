import React from 'react';
import { FileText, Check } from 'lucide-react';

interface MappingUploadProps {
  mappingFile: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onError: (error: string) => void;
}

export function MappingUpload({ mappingFile, onFileChange, onError }: MappingUploadProps) {
  return (
    <div>
      <div className="flex items-center mb-4">
        <FileText className="w-5 h-5 text-[#3498db] mr-2" />
        <h2 className="text-lg font-semibold text-[#2c3e50]">Файл відповідності</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept=".txt,.csv"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-[#e3f2fd] file:text-[#2196f3]
            hover:file:bg-[#bbdefb]
            cursor-pointer"
        />
        {mappingFile && (
          <div className="flex items-center text-[#27ae60]">
            <Check className="w-5 h-5 mr-1" />
            <span className="text-sm">Вибрано</span>
          </div>
        )}
      </div>
      
      <p className="mt-2 text-sm text-gray-500">
        Завантажте файл .txt або .csv з інформацією про відповідність
      </p>
    </div>
  );
}