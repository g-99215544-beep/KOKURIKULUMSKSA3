
import React, { useState } from 'react';

interface PDFViewerModalProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ url, title, onClose }) => {
  const [loading, setLoading] = useState(true);

  // Helper function to ensure Google Drive URLs are in preview mode for embedding
  const getEmbedUrl = (originalUrl: string) => {
    if (originalUrl.includes('drive.google.com') && (originalUrl.includes('view') || originalUrl.includes('open'))) {
      // Replace 'view' or 'open' with 'preview' for better embedding
      return originalUrl.replace(/\/view.*/, '/preview').replace(/\/open.*/, '/preview');
    }
    return originalUrl;
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white md:rounded-2xl w-full max-w-5xl h-full md:h-[90vh] relative flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0 shadow-md z-10">
          <div className="flex flex-col">
             <h3 className="font-bold text-lg leading-tight truncate max-w-[200px] md:max-w-md">
               {title || 'Paparan Dokumen'}
             </h3>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">Mod Lihat Sahaja</p>
          </div>
          <div className="flex gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs font-bold transition-colors flex items-center gap-1"
              title="Buka di Tab Baru jika gagal dimuatkan"
            >
              ⬇ <span className="hidden sm:inline">Muat Turun</span>
            </a>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body (Iframe) */}
        <div className="flex-1 relative bg-gray-100 w-full h-full">
           {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-600 mb-4"></div>
                <p className="text-gray-500 font-medium animate-pulse">Memuatkan PDF...</p>
             </div>
           )}
           <iframe 
             src={embedUrl} 
             className="w-full h-full relative z-10" 
             onLoad={() => setLoading(false)}
             title="PDF Viewer"
           />
        </div>
      </div>
    </div>
  );
};
