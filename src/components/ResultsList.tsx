import React, { useState, useMemo } from 'react';
import { FileImage, Check, AlertCircle, Download, Archive, ArrowUpDown, Copy, FileX, FileQuestion } from 'lucide-react';
import { downloadFileList, downloadProcessedFiles } from '../utils/fileProcessor';

interface RenameResult {
  oldName: string;
  newName: string;
  status: 'success' | 'error' | 'no_match' | 'invalid_format';
  message?: string;
  downloadUrl?: string;
  timestamp?: number;
}

interface ResultsListProps {
  results: RenameResult[];
  onError: (error: string) => void;
}

type SortField = 'status' | 'oldName' | 'newName' | 'timestamp' | 'duplicate';
type SortOrder = 'asc' | 'desc';

export function ResultsList({ results, onError }: ResultsListProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

  const { sortedResults, duplicatesMap, stats } = useMemo(() => {
    // Create a map of newName to count of occurrences
    const duplicates = new Map<string, number>();
    const stats = {
      success: 0,
      noMatch: 0,
      invalidFormat: 0,
      error: 0
    };

    results.forEach(result => {
      switch (result.status) {
        case 'success':
          stats.success++;
          duplicates.set(result.newName, (duplicates.get(result.newName) || 0) + 1);
          break;
        case 'no_match':
          stats.noMatch++;
          break;
        case 'invalid_format':
          stats.invalidFormat++;
          break;
        case 'error':
          stats.error++;
          break;
      }
    });

    const filtered = showDuplicatesOnly 
      ? results.filter(r => r.status === 'success' && duplicates.get(r.newName)! > 1)
      : results;

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'oldName':
          comparison = a.oldName.localeCompare(b.oldName);
          break;
        case 'newName':
          if (a.status !== 'success' && b.status !== 'success') {
            comparison = (a.message || '').localeCompare(b.message || '');
          } else if (a.status !== 'success') {
            comparison = 1;
          } else if (b.status !== 'success') {
            comparison = -1;
          } else {
            comparison = a.newName.localeCompare(b.newName);
          }
          break;
        case 'duplicate':
          const aCount = a.status === 'success' ? duplicates.get(a.newName) || 0 : 0;
          const bCount = b.status === 'success' ? duplicates.get(b.newName) || 0 : 0;
          comparison = bCount - aCount;
          break;
        case 'timestamp':
          comparison = ((a.timestamp || 0) - (b.timestamp || 0));
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return { 
      sortedResults: sorted,
      duplicatesMap: duplicates,
      stats
    };
  }, [results, sortField, sortOrder, showDuplicatesOnly]);

  const duplicatesCount = Array.from(duplicatesMap.values()).filter(count => count > 1).length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDownloadList = async (type: 'success' | 'error' | 'no_match' | 'invalid_format') => {
    try {
      downloadFileList(results, type);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Помилка завантаження списку');
    }
  };

  const handleDownloadFiles = async () => {
    try {
      await downloadProcessedFiles(results);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Помилка завантаження файлів');
    }
  };

  const renderSortButton = (field: SortField, label: string) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 transition-colors ${
        sortField === field ? 'text-[#3498db]' : 'text-[#7f8c8d] hover:text-[#3498db]'
      }`}
    >
      {label}
      <ArrowUpDown className={`w-4 h-4 ${
        sortField === field ? 'opacity-100' : 'opacity-50'
      }`} />
    </button>
  );

  const renderStatus = (result: RenameResult) => {
    switch (result.status) {
      case 'success':
        return (
          <span className="inline-flex items-center text-[#27ae60]">
            <Check className="w-4 h-4 mr-1" />
            <span className="text-sm">Успішно</span>
          </span>
        );
      case 'no_match':
        return (
          <span className="inline-flex items-center text-[#f39c12]">
            <FileQuestion className="w-4 h-4 mr-1" />
            <span className="text-sm">Не знайдено</span>
          </span>
        );
      case 'invalid_format':
        return (
          <span className="inline-flex items-center text-[#7f8c8d]">
            <FileX className="w-4 h-4 mr-1" />
            <span className="text-sm">Не фото</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[#e74c3c]">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">Помилка</span>
          </span>
        );
    }
  };

  if (results.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#2c3e50]">Результати обробки</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm space-x-4">
            <span className="text-[#27ae60]">{stats.success} успішно</span>
            {stats.noMatch > 0 && (
              <span className="text-[#f39c12]">{stats.noMatch} не знайдено</span>
            )}
            {stats.invalidFormat > 0 && (
              <span className="text-[#7f8c8d]">{stats.invalidFormat} не фото</span>
            )}
            {stats.error > 0 && (
              <span className="text-[#e74c3c]">{stats.error} помилок</span>
            )}
            {duplicatesCount > 0 && (
              <span className="text-[#9b59b6]">
                {duplicatesCount} {duplicatesCount === 1 ? 'дублікат' : 'дублікатів'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {duplicatesCount > 0 && (
              <button
                onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                className={`text-sm px-3 py-1.5 rounded flex items-center gap-1 transition-colors
                  ${showDuplicatesOnly 
                    ? 'bg-[#f3e5f5] text-[#9b59b6] hover:bg-[#e1bee7]' 
                    : 'bg-[#f8f9fa] text-[#6c757d] hover:bg-[#e2e6ea]'
                  }`}
              >
                <Copy className="w-4 h-4" />
                {showDuplicatesOnly ? 'Показати всі' : 'Показати дублікати'}
              </button>
            )}
            {stats.success > 0 && (
              <>
                <button
                  onClick={() => handleDownloadList('success')}
                  className="text-sm px-3 py-1.5 rounded bg-[#f1f8e9] text-[#27ae60] hover:bg-[#dcedc8] 
                    transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Список успішних
                </button>
                <button
                  onClick={handleDownloadFiles}
                  className="text-sm px-3 py-1.5 rounded bg-[#e3f2fd] text-[#2196f3] hover:bg-[#bbdefb] 
                    transition-colors flex items-center"
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Завантажити файли
                </button>
              </>
            )}
            {stats.noMatch > 0 && (
              <button
                onClick={() => handleDownloadList('no_match')}
                className="text-sm px-3 py-1.5 rounded bg-[#fff3cd] text-[#f39c12] hover:bg-[#ffeeba] 
                  transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Список не знайдених
              </button>
            )}
            {stats.invalidFormat > 0 && (
              <button
                onClick={() => handleDownloadList('invalid_format')}
                className="text-sm px-3 py-1.5 rounded bg-[#f8f9fa] text-[#7f8c8d] hover:bg-[#e2e6ea] 
                  transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Список не фото
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="pb-3 text-sm font-medium text-[#95a5a6] w-8">#</th>
              <th className="pb-3 text-sm font-medium">
                {renderSortButton('status', 'Статус')}
              </th>
              <th className="pb-3 text-sm font-medium">
                {renderSortButton('oldName', 'Оригінальна назва')}
              </th>
              <th className="pb-3 text-sm font-medium">
                {renderSortButton('newName', 'Нова назва')}
              </th>
              <th className="pb-3 text-sm font-medium">
                {renderSortButton('timestamp', 'Час')}
              </th>
              {duplicatesCount > 0 && (
                <th className="pb-3 text-sm font-medium">
                  {renderSortButton('duplicate', 'Дублікати')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedResults.map((result, index) => {
              const duplicateCount = result.status === 'success' ? duplicatesMap.get(result.newName) || 0 : 0;
              const isDuplicate = duplicateCount > 1;

              return (
                <tr key={index} className={`hover:bg-gray-50 ${isDuplicate ? 'bg-[#f3e5f5]' : ''}`}>
                  <td className="py-3 text-sm text-[#95a5a6]">{index + 1}</td>
                  <td className="py-3">
                    {renderStatus(result)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <FileImage className="w-4 h-4 text-[#95a5a6] mr-2" />
                      <span className="text-sm text-[#2c3e50]">{result.oldName}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    {result.status === 'success' ? (
                      <span className="text-sm font-medium text-[#2c3e50]">{result.newName}</span>
                    ) : (
                      <span className="text-sm text-[#7f8c8d]">{result.message}</span>
                    )}
                  </td>
                  <td className="py-3">
                    {result.timestamp && (
                      <span className="text-sm text-[#95a5a6]">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </td>
                  {duplicatesCount > 0 && (
                    <td className="py-3">
                      {isDuplicate && (
                        <span className="text-sm text-[#9b59b6] font-medium">
                          {duplicateCount}x
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}