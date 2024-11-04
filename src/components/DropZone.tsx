import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { ImagePreview } from './ImagePreview';

interface DropZoneProps {
  files: File[];
  onDrop: (files: File[]) => void;
  onError: (error: string) => void;
  maxFiles?: number;
  maxSize?: number;
  showPreviews: boolean;
  onTogglePreviews: () => void;
}

export function DropZone({ 
  files, 
  onDrop, 
  onError,
  maxFiles = 50000,
  maxSize = 5 * 1024 * 1024,
  showPreviews,
  onTogglePreviews
}: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles,
    maxSize,
    noClick: false,
    noKeyboard: false,
    useFsAccessApi: false,
    multiple: true,
    onDropRejected: (fileRejections) => {
      const errors = fileRejections.map(rejection => {
        if (rejection.errors[0].code === 'file-too-large') {
          return `Файл "${rejection.file.name}" завеликий. Максимальний розмір ${maxSize / 1024 / 1024}MB`;
        }
        if (rejection.errors[0].code === 'too-many-files') {
          return `Забагато файлів. Максимум дозволено ${maxFiles}`;
        }
        return `Файл "${rejection.file.name}" відхилено: ${rejection.errors[0].message}`;
      });
      onError(errors[0]);
    },
    getFilesFromEvent: async (event) => {
      const items = event.dataTransfer ? event.dataTransfer.items : event.target.files;
      const files: File[] = [];

      async function traverseFileTree(item: any, path = '') {
        if (item.isFile) {
          const file = await new Promise<File>((resolve) => {
            item.file((file: File) => {
              resolve(file);
            });
          });
          if (file.type.startsWith('image/')) {
            files.push(file);
          }
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          await new Promise<void>((resolve) => {
            dirReader.readEntries(async (entries: any[]) => {
              for (const entry of entries) {
                await traverseFileTree(entry, path + item.name + "/");
              }
              resolve();
            });
          });
        }
      }

      if (items) {
        for (const item of Array.from(items)) {
          if (item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              await traverseFileTree(entry);
            }
          } else if (item.getAsFile) {
            const file = item.getAsFile();
            if (file && file.type.startsWith('image/')) {
              files.push(file);
            }
          } else if (item instanceof File && item.type.startsWith('image/')) {
            files.push(item);
          }
        }
      }

      return files;
    }
  });

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 mb-2">
          {isDragActive ? 'Відпустіть файли тут' : 'Перетягніть файли або папки сюди або клікніть для вибору'}
        </p>
        <p className="text-sm text-gray-500">
          Підтримуються: JPG, PNG, GIF, WebP (макс. {maxSize / 1024 / 1024}MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Вибрано {files.length} з {maxFiles} файлів</span>
            <button
              onClick={onTogglePreviews}
              className="flex items-center gap-1 text-[#3498db] hover:text-[#2980b9] transition-colors"
            >
              {showPreviews ? (
                <>
                  Сховати превью
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Показати превью
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          
          {showPreviews && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {files.map((file, index) => (
                <ImagePreview 
                  key={`${file.name}-${file.size}-${index}`} 
                  file={file} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}