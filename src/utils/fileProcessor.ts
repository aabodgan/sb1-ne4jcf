import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export interface RenameResult {
  oldName: string;
  newName: string;
  status: 'success' | 'error' | 'no_match' | 'invalid_format';
  message?: string;
  downloadUrl?: string;
  timestamp?: number;
}

export interface ProcessedFile {
  file: File;
  newName: string;
  preview?: string;
}

const getTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

export async function processFiles(files: File[], mappingFile: File): Promise<RenameResult[]> {
  try {
    const mapping = await readMappingFile(mappingFile);
    const results: RenameResult[] = [];
    
    for (const file of files) {
      const result = await processFile(file, mapping);
      results.push({
        ...result,
        timestamp: Date.now()
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error processing files:', error);
    throw new Error(`Помилка обробки файлів: ${(error as Error).message}`);
  }
}

async function readMappingFile(file: File): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const mapping = new Map<string, string>();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Split by tab and clean up quotes and whitespace
          const [id, artNum] = line.split('\t').map(part => 
            part.trim().replace(/^"/, '').replace(/"$/, '')
          );
          
          if (id && artNum) {
            // Store both original and lowercase versions for better matching
            const cleanArtNum = artNum.toLowerCase().replace(/[. \-_~]/g, '');
            mapping.set(cleanArtNum, id);
            
            // Also store without "amparts_" prefix if present
            if (cleanArtNum.startsWith('amparts_')) {
              mapping.set(cleanArtNum.replace('amparts_', ''), id);
            }
          }
        }
        
        resolve(mapping);
      } catch (error) {
        reject(new Error(`Помилка читання файлу відповідності: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Помилка читання файлу відповідності'));
    reader.readAsText(file);
  });
}

async function processFile(file: File, mapping: Map<string, string>): Promise<RenameResult> {
  // First check if it's an image
  if (!file.type.startsWith('image/')) {
    return {
      oldName: file.name,
      newName: '',
      status: 'invalid_format',
      message: 'Файл не є зображенням'
    };
  }

  const fileName = file.name;
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  // Extract base name and sequence number
  const match = fileName.match(/^(.+?)(?:-(\d+))?\.[\w]+$/i);
  if (!match) {
    return {
      oldName: fileName,
      newName: '',
      status: 'error',
      message: 'Невірний формат імені файлу'
    };
  }

  const [, baseName, sequenceNum = '1'] = match;
  
  // Clean the base name and try to find a match
  const cleanBaseName = baseName.toLowerCase().replace(/[. \-_~]/g, '');
  let id = mapping.get(cleanBaseName);
  
  // Try without "amparts_" prefix if present
  if (!id && cleanBaseName.startsWith('amparts_')) {
    id = mapping.get(cleanBaseName.replace('amparts_', ''));
  }
  
  if (!id) {
    return {
      oldName: fileName,
      newName: '',
      status: 'no_match',
      message: 'Не знайдено відповідність в файлі маппінгу'
    };
  }
  
  // Create new name using the original sequence number
  const newName = `${id}_${sequenceNum}${extension.toLowerCase()}`;
  
  return {
    oldName: fileName,
    newName: newName,
    status: 'success',
    downloadUrl: URL.createObjectURL(file)
  };
}

export function downloadFileList(results: RenameResult[], type: 'success' | 'error' | 'no_match' | 'invalid_format'): void {
  try {
    const filteredResults = results.filter(r => r.status === type);
    const content = filteredResults.map(result => {
      if (type === 'success') {
        return `${result.oldName} -> ${result.newName}`;
      } else {
        return `${result.oldName} - ${result.message}`;
      }
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const timestamp = getTimestamp();
    const fileName = type === 'success' ? 'успішні' : 
                    type === 'no_match' ? 'не_знайдено_відповідність' :
                    type === 'invalid_format' ? 'невірний_формат' : 'помилки';
    
    saveAs(blob, `${fileName}_${timestamp}.txt`);
  } catch (error) {
    console.error(`Error downloading ${type} file list:`, error);
    throw new Error(`Помилка завантаження списку файлів: ${(error as Error).message}`);
  }
}

export async function downloadProcessedFiles(results: RenameResult[]): Promise<void> {
  try {
    const successfulResults = results.filter(r => r.status === 'success' && r.downloadUrl);
    
    if (successfulResults.length === 0) {
      throw new Error('Немає файлів для завантаження');
    }
    
    const zip = new JSZip();
    
    for (const result of successfulResults) {
      if (result.downloadUrl) {
        const response = await fetch(result.downloadUrl);
        const blob = await response.blob();
        zip.file(result.newName, blob);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `оброблені_файли_${getTimestamp()}.zip`);
  } catch (error) {
    console.error('Error downloading processed files:', error);
    throw new Error(`Помилка завантаження оброблених файлів: ${(error as Error).message}`);
  }
}