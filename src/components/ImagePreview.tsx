import React from 'react';

interface ImagePreviewProps {
  file: File & { preview?: string };
}

export function ImagePreview({ file }: ImagePreviewProps) {
  return (
    <div className="relative group">
      <img
        src={file.preview}
        alt={file.name}
        className="w-full h-24 object-cover rounded-lg"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
        <p className="text-white text-xs px-2 truncate">{file.name}</p>
      </div>
    </div>
  );
}