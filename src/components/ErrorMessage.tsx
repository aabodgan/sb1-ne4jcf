import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
  onClose?: () => void;
}

export function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
        <p className="text-red-600 text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-red-400 hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}